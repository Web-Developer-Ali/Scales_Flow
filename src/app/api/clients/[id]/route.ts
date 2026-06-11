import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// ── Permission check ──────────────────────────────────────────────────────────
async function canAccessClient(
  clientId: string,
  userId: string,
  role: string,
): Promise<{ allowed: boolean; client?: Record<string, unknown> }> {
  const { rows } = await query(
    `SELECT
       c.id, c.company_name, c.industry, c.website, c.address,
       c.primary_contact_name, c.primary_contact_email, c.primary_contact_phone,
       c.status::text, c.notes,
       c.assigned_to, c.created_by,
       c.created_at, c.updated_at,
       u.name  AS assigned_to_name,
       u.email AS assigned_to_email,
       cb.name AS created_by_name
     FROM clients c
     LEFT JOIN users u  ON c.assigned_to = u.id
     LEFT JOIN users cb ON c.created_by  = cb.id
     WHERE c.id = $1`,
    [clientId],
  );

  if (!rows.length) return { allowed: false };

  const client = rows[0];

  if (role === "admin") return { allowed: true, client };

  if (role === "manager") {
    // Manager can access their own or their team's clients
    const { rows: teamRows } = await query(
      `SELECT 1 FROM users
       WHERE id = $1 AND manager_id = $2`,
      [client.assigned_to, userId],
    );
    const allowed =
      client.assigned_to === userId ||
      client.created_by === userId ||
      teamRows.length > 0;
    return { allowed, client };
  }

  if (role === "scales_man") {
    const allowed =
      client.assigned_to === userId || client.created_by === userId;
    return { allowed, client };
  }

  return { allowed: false };
}

// ── GET: fetch client detail + linked deals ───────────────────────────────────
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: clientId } = await context.params;

  try {
    const { allowed, client } = await canAccessClient(
      clientId,
      session.user.id,
      session.user.role,
    );

    if (!allowed || !client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    // Fetch linked deals + deal stats in one query
    const dealsResult = await query(
      `SELECT
         d.id,
         d.title,
         d.company,
         d.value,
         d.stage::text,
         d.status::text,
         d.probability,
         d.expected_close_date,
         d.created_at,
         d.updated_at,
         u.name AS assigned_to_name,
         GREATEST(
           EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0,
           0
         ) AS days_in_stage
       FROM deals d
       LEFT JOIN users u ON d.assigned_to = u.id
       WHERE d.client_id = $1
       ORDER BY d.created_at DESC`,
      [clientId],
    );

    const deals = dealsResult.rows;

    // Compute deal stats
    const totalDeals = deals.length;
    const activeDeals = deals.filter((d) => d.status === "active").length;
    const wonDeals = deals.filter((d) => d.status === "won").length;
    const totalRevenue = deals
      .filter((d) => d.status === "won")
      .reduce((sum, d) => sum + Number(d.value), 0);
    const totalPipeline = deals
      .filter((d) => d.status === "active")
      .reduce((sum, d) => sum + Number(d.value), 0);

    return NextResponse.json({
      success: true,
      client,
      deals,
      dealStats: {
        totalDeals,
        activeDeals,
        wonDeals,
        totalRevenue,
        totalPipeline,
      },
    });
  } catch (err) {
    console.error("Client Detail GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── PATCH: update client ──────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: clientId } = await context.params;

  try {
    const { allowed } = await canAccessClient(
      clientId,
      session.user.id,
      session.user.role,
    );

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    const body = await req.json();

    const ALLOWED_FIELDS = [
      "company_name",
      "industry",
      "website",
      "address",
      "primary_contact_name",
      "primary_contact_email",
      "primary_contact_phone",
      "status",
      "notes",
    ] as const;

    const VALID_STATUSES = ["prospect", "active", "inactive"];

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        if (field === "status") {
          updates.push(`status = $${idx}::client_status`);
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

    values.push(clientId);

    const { rows } = await query(
      `UPDATE clients
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING id, company_name, status, updated_at`,
      values,
    );

    return NextResponse.json({
      success: true,
      message: "Client updated",
      client: rows[0],
    });
  } catch (err) {
    console.error("Client Detail PATCH Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── DELETE: delete client ─────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: clientId } = await context.params;

  try {
    const { allowed, client } = await canAccessClient(
      clientId,
      session.user.id,
      session.user.role,
    );

    if (!allowed || !client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    // Only admin or the assigned rep can delete
    const canDelete =
      session.user.role === "admin" || client.assigned_to === session.user.id;

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: "Only admin or the assigned rep can delete a client",
        },
        { status: 403 },
      );
    }

    // Unlink deals before deleting
    await query(`UPDATE deals SET client_id = NULL WHERE client_id = $1`, [
      clientId,
    ]);

    await query(`DELETE FROM clients WHERE id = $1`, [clientId]);

    return NextResponse.json({
      success: true,
      message: "Client deleted",
    });
  } catch (err) {
    console.error("Client Detail DELETE Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
