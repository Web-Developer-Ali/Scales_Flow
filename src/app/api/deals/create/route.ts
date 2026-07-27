import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { notifyDealAssigned } from "@/lib/notifications";
import { sendDealStalledEmail } from "@/lib/email/email-notifications";

const VALID_STAGES = [
  "prospect",
  "qualified",
  "demo",
  "negotiation",
  "closed",
] as const;

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return req.headers.get("x-real-ip") || null;
}

async function logActivity(params: {
  organizationId: string;
  userId: string;
  performedBy: string;
  activityType: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  try {
    const {
      organizationId,
      userId,
      performedBy,
      activityType,
      description,
      entityType,
      entityId,
      ipAddress,
      userAgent,
    } = params;

    await query(
      `INSERT INTO user_activities
         (organization_id, user_id, performed_by, activity_type, description, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        organizationId,
        userId,
        performedBy,
        activityType,
        description ?? null,
        entityType ?? null,
        entityId ?? null,
        ipAddress,
        userAgent,
      ],
    );
  } catch (err) {
    // Never let logging failures break the main request
    console.error("Activity Log Error:", err);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.id ||
    !["scales_man", "manager"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const organizationId = session.user.organizationId;

  try {
    const body = await req.json();

    const {
      title,
      company,
      contact_person,
      contact_email,
      contact_phone,
      value,
      stage,
      probability,
      expected_close_date,
      description,
      currency = "USD",
      client_id = null,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!company?.trim()) {
      return NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 },
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Deal title is required" },
        { status: 400 },
      );
    }

    if (!contact_email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Contact email is required" },
        { status: 400 },
      );
    }

    const dealValue = parseFloat(value);
    if (isNaN(dealValue) || dealValue <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid deal value is required" },
        { status: 400 },
      );
    }

    const dealProbability = parseInt(probability);
    if (
      isNaN(dealProbability) ||
      dealProbability < 0 ||
      dealProbability > 100
    ) {
      return NextResponse.json(
        { success: false, error: "Probability must be between 0 and 100" },
        { status: 400 },
      );
    }

    const dealStage = stage?.toLowerCase();
    if (!VALID_STAGES.includes(dealStage)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ── client_id validation — scoped to org ──────────────────────────────────
    // Prevents attaching a client from another agency via UUID guessing
    if (client_id) {
      const { rows: clientRows } = await query(
        `SELECT id FROM clients
         WHERE id              = $1
           AND organization_id = $2
           AND (assigned_to = $3 OR created_by = $3)`,
        [client_id, organizationId, session.user.id],
      );
      if (!clientRows.length) {
        return NextResponse.json(
          { success: false, error: "Invalid client" },
          { status: 400 },
        );
      }
    }

    // ── Insert — organization_id now included ─────────────────────────────────
    const { rows } = await query(
      `INSERT INTO deals (
        organization_id,
        title,
        company,
        contact_person,
        contact_email,
        contact_phone,
        value,
        currency,
        stage,
        status,
        probability,
        expected_close_date,
        description,
        client_id,
        assigned_to,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        'active',
        $10,$11,$12,$13,$14,$15
      )
      RETURNING
        id, title, company, value, stage, status,
        probability, created_at`,
      [
        organizationId, // $1
        title.trim(), // $2
        company.trim(), // $3
        contact_person?.trim() || null, // $4
        contact_email.trim().toLowerCase(), // $5
        contact_phone?.trim() || null, // $6
        dealValue, // $7
        currency, // $8
        dealStage, // $9
        dealProbability, // $10
        expected_close_date || null, // $11
        description?.trim() || null, // $12
        client_id, // $13
        session.user.id, // $14 assigned_to
        session.user.id, // $15 created_by
      ],
    );

    const deal = rows[0];

    // ── Activity log ──────────────────────────────────────────────────────────
    await logActivity({
      organizationId,
      userId: session.user.id,
      performedBy: session.user.id,
      activityType: "deal_created",
      description: `Created deal: ${deal.title} for ${deal.company}`,
      entityType: "deal",
      entityId: deal.id,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent") || null,
    });

    // ── Notification — manager lookup scoped to org ───────────────────────────
    const { rows: userRows } = await query(
      `SELECT id, name, manager_id, role
       FROM users
       WHERE id = $1 AND organization_id = $2`,
      [session.user.id, organizationId],
    );

    const currentUser = userRows[0];
    const managerId = currentUser?.manager_id;

    if (managerId) {
      await notifyDealAssigned({
        managerId,
        dealTitle: deal.title,
        dealId: deal.id,
        companyName: deal.company,
      });
    } else {
      console.log(
        `Notification skipped: user ${session.user.id} has no manager assigned`,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Deal created successfully",
      deal,
    });
  } catch (err) {
    console.error("Create Deal API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
