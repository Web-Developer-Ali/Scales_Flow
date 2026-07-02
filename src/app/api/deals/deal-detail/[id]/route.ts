import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  notifyDealStageChanged,
  notifyDealWon,
  notifyDealLost,
  notifyDealDeleted,
} from "@/lib/notifications";

// ── Permission check helper ───────────────────────────────────────────────────
async function canAccessDeal(
  dealId: string,
  userId: string,
  userRole: string,
): Promise<{ allowed: boolean; deal?: Record<string, unknown> }> {
  const { rows } = await query(
    `SELECT
       d.id, d.title, d.company, d.contact_person, d.contact_email,
       d.contact_phone, d.value, d.currency, d.stage::text, d.status::text,
       d.probability, d.expected_close_date, d.description,
       d.assigned_to, d.created_by, d.created_at, d.updated_at,
         d.client_id,
         cl.company_name AS client_name,
       GREATEST(
         EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0, 0
       ) AS days_in_stage,
       u.name  AS assigned_to_name,
       u.email AS assigned_to_email,
       c.name  AS created_by_name
     FROM deals d
     LEFT JOIN users u ON d.assigned_to  = u.id
     LEFT JOIN users c ON d.created_by   = c.id
     LEFT JOIN clients cl ON d.client_id   = cl.id
     WHERE d.id = $1`,
    [dealId],
  );

  if (!rows.length) return { allowed: false };

  const deal = rows[0];

  // Admin sees everything
  if (userRole === "admin") return { allowed: true, deal };

  // Manager sees their team's deals
  if (userRole === "manager") {
    const { rows: teamRows } = await query(
      `SELECT 1 FROM users
       WHERE id = $1 AND manager_id = $2`,
      [deal.assigned_to, userId],
    );
    // Also allow if manager is the assigned rep themselves
    const allowed =
      teamRows.length > 0 ||
      deal.assigned_to === userId ||
      deal.created_by === userId;
    return { allowed, deal };
  }

  // Sales rep sees only their own deals
  if (userRole === "scales_man") {
    const allowed = deal.assigned_to === userId || deal.created_by === userId;
    return { allowed, deal };
  }

  return { allowed: false };
}

// ── GET: fetch deal detail ────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: dealId } = await context.params;

  try {
    const { allowed, deal } = await canAccessDeal(
      dealId,
      session.user.id,
      session.user.role,
    );

    if (!allowed || !deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, deal });
  } catch (err) {
    console.error("Deal Detail GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── PATCH: update deal ────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: dealId } = await context.params;

  try {
    const { allowed, deal } = await canAccessDeal(
      dealId,
      session.user.id,
      session.user.role,
    );

    if (!allowed || !deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 },
      );
    }

    // Only assigned rep, their manager, or admin can edit
    const canEdit =
      session.user.role === "admin" ||
      deal.assigned_to === session.user.id ||
      deal.created_by === session.user.id ||
      session.user.role === "manager";

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json();

    const VALID_STAGES = [
      "prospect",
      "qualified",
      "demo",
      "negotiation",
      "closed",
    ];
    const VALID_STATUSES = ["active", "won", "lost", "on-hold"];

    // Validate stage
    if (body.stage && !VALID_STAGES.includes(body.stage)) {
      return NextResponse.json(
        { success: false, error: "Invalid stage" },
        { status: 400 },
      );
    }

    // Validate status
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    // Validate probability
    if (
      body.probability !== undefined &&
      (body.probability < 0 || body.probability > 100)
    ) {
      return NextResponse.json(
        { success: false, error: "Probability must be 0–100" },
        { status: 400 },
      );
    }

    // Build update dynamically — only update provided fields
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const allowed_fields = [
      "title",
      "company",
      "contact_person",
      "contact_email",
      "contact_phone",
      "value",
      "stage",
      "status",
      "probability",
      "expected_close_date",
      "description",
    ] as const;

    for (const field of allowed_fields) {
      if (body[field] !== undefined) {
        // Cast enum fields explicitly
        if (field === "stage") {
          updates.push(`stage = $${idx}::deal_stage`);
        } else if (field === "status") {
          updates.push(`status = $${idx}::deal_status`);
        } else {
          updates.push(`${field} = $${idx}`);
        }
        values.push(body[field] === "" ? null : body[field]);
        idx++;
      }
    }

    if (!updates.length) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    values.push(dealId);

    const { rows } = await query(
      `UPDATE deals
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING
         id, title, company, value, stage::text,
         status::text, probability, updated_at`,
      values,
    );

    // Log to user_activities
    const changedFields = Object.keys(body)
      .filter((k) => allowed_fields.includes(k as never))
      .join(", ");

    await query(
      `INSERT INTO user_activities
         (user_id, performed_by, activity_type, description, entity_type, entity_id)
       VALUES ($1, $2, 'deal_updated', $3, 'deal', $4)`,
      [
        deal.assigned_to ?? session.user.id,
        session.user.id,
        `Updated deal fields: ${changedFields}`,
        dealId,
      ],
    );

    // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
    // Check for stage and status changes
    const stageChanged = body.stage && body.stage !== deal.stage;
    const statusChanged = body.status && body.status !== deal.status;

    // Notify manager when rep changes stage
    if (
      stageChanged &&
      deal.assigned_to &&
      deal.assigned_to !== session.user.id
    ) {
      // Find the manager of the assigned rep
      const { rows: managerRows } = await query(
        `SELECT manager_id FROM users WHERE id = $1`,
        [deal.assigned_to],
      );
      const managerId = managerRows[0]?.manager_id;
      if (managerId) {
        await notifyDealStageChanged({
          managerId,
          repName: session.user?.name ?? "Your rep",
          dealTitle: deal.title as string,
          dealId: dealId,
          fromStage: deal.stage as string,
          toStage: body.stage,
        });
      }
    }

    // Notify manager when deal is won or lost or deal stage is changed
    if (statusChanged || stageChanged) {
      const { rows: managerRows } = await query(
        `SELECT u.manager_id, u.name
         FROM users u WHERE u.id = $1`,
        [deal.assigned_to ?? session.user.id],
      );
      const managerId = managerRows[0]?.manager_id;
      const repName = managerRows[0]?.name ?? "Your rep";

      if (managerId && stageChanged) {
        await notifyDealStageChanged({
          managerId,
          repName,
          dealTitle: deal.title as string,
          dealId,
          fromStage: deal.stage as string,
          toStage: body.stage,
        });
      }
      if (managerId && body.status === "won") {
        await notifyDealWon({
          managerId,
          repName,
          dealTitle: deal.title as string,
          dealId,
          dealValue: Number(deal.value),
          companyName: deal.company as string,
        });
      }
      if (managerId && body.status === "lost") {
        await notifyDealLost({
          managerId,
          repName,
          dealTitle: deal.title as string,
          dealId,
          companyName: deal.company as string,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Deal updated successfully",
      deal: rows[0],
    });
  } catch (err) {
    console.error("Deal Detail PATCH Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── DELETE: delete deal ───────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: dealId } = await context.params;

  try {
    const { allowed, deal } = await canAccessDeal(
      dealId,
      session.user.id,
      session.user.role,
    );

    if (!allowed || !deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 },
      );
    }

    // Only admin or the assigned rep can delete
    const canDelete =
      session.user.role === "admin" || deal.assigned_to === session.user.id;

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: "Only admin or the assigned rep can delete a deal",
        },
        { status: 403 },
      );
    }

    const { rows: managerRows } = await query(
      `SELECT manager_id
       FROM users
       WHERE id = $1`,
      [deal.assigned_to],
    );

    const managerId = managerRows[0]?.manager_id;

    await query(`DELETE FROM deals WHERE id = $1`, [dealId]);

    await query(
      `INSERT INTO user_activities
         (user_id, performed_by, activity_type, description, entity_type, entity_id)
       VALUES ($1, $2, 'deal_deleted', $3, 'deal', $4)`,
      [
        deal.assigned_to ?? session.user.id,
        session.user.id,
        `Deleted deal: ${deal.title} — ${deal.company}`,
        dealId,
      ],
    );

    if (managerId && managerId !== session.user.id) {
      await notifyDealDeleted({
        managerId,
        repName: session.user.name ?? "A team member",
        dealTitle: deal.title as string,
        companyName: deal.company as string,
        dealId,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (err) {
    console.error("Deal Detail DELETE Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
