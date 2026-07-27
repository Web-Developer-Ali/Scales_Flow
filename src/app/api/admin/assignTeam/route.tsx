import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function logActivity(params: {
  organizationId: string; // ← new required field
  userId: string;
  performedBy: string;
  activityType: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  req: Request;
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
      req,
    } = params;

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    await query(
      `INSERT INTO user_activities
        (organization_id, user_id, performed_by, activity_type,
         description, entity_type, entity_id, ip_address, user_agent)
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
    console.error("Activity Log Error:", err);
  }
}

export async function GET() {
  // Returns all managers + their currently assigned reps
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const organizationId = session.user.organizationId;

  try {
    const sql = `
      WITH managers AS (
        SELECT id, name, email
        FROM users
        WHERE organization_id = $1        -- ← org scope
          AND role = 'manager'
          AND is_active = true
        ORDER BY name ASC
      ),
      reps AS (
        SELECT id, name, email, manager_id, is_active
        FROM users
        WHERE organization_id = $1        -- ← org scope
          AND role = 'scales_man'
        ORDER BY name ASC
      )
      SELECT
        (SELECT COALESCE(json_agg(m), '[]'::json) FROM managers m) AS managers,
        (SELECT COALESCE(json_agg(r), '[]'::json) FROM reps r)     AS reps;
    `;

    const { rows } = await query(sql, [organizationId]);
    const row = rows[0];

    return NextResponse.json({
      success: true,
      managers: row.managers ?? [],
      reps: row.reps ?? [],
    });
  } catch (err) {
    console.error("Assign Team GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  // Assign or unassign a rep to/from a manager
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const organizationId = session.user.organizationId;

  try {
    const { repId, managerId } = await req.json();

    if (!repId) {
      return NextResponse.json(
        { success: false, error: "repId is required" },
        { status: 400 },
      );
    }

    // Validate rep belongs to THIS org and is a sales rep
    const { rows: repRows } = await query(
      `SELECT id, role FROM users
       WHERE id = $1 AND organization_id = $2`,
      [repId, organizationId],
    );

    if (!repRows.length || repRows[0].role !== "scales_man") {
      return NextResponse.json(
        { success: false, error: "Sales rep not found" },
        { status: 404 },
      );
    }

    let managerName: string | null = null;
    if (managerId) {
      // Validate manager belongs to THIS org
      const { rows: mgrRows } = await query(
        `SELECT id, role, name FROM users
         WHERE id = $1 AND organization_id = $2`,
        [managerId, organizationId],
      );

      if (!mgrRows.length || mgrRows[0].role !== "manager") {
        return NextResponse.json(
          { success: false, error: "Manager not found" },
          { status: 404 },
        );
      }
      managerName = mgrRows[0].name;
    }

    const { rows: updated } = await query(
      `UPDATE users
       SET manager_id = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING id, name, email, manager_id`,
      [managerId ?? null, repId, organizationId],
    );

    await logActivity({
      organizationId,
      userId: repId,
      performedBy: session.user.id,
      activityType: "team_assigned",
      description: managerId
        ? `Assigned to manager ${managerName ?? managerId}`
        : "Unassigned from manager",
      entityType: "user",
      entityId: repId,
      req,
    });

    return NextResponse.json({
      success: true,
      message: managerId
        ? "Sales rep assigned to manager"
        : "Sales rep unassigned",
      rep: updated[0],
    });
  } catch (err) {
    console.error("Assign Team PATCH Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
