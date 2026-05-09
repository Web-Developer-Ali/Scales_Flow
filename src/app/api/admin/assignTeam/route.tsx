import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  // Returns all managers + their currently assigned reps
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const sql = `
      WITH managers AS (
        SELECT id, name, email
        FROM users
        WHERE role = 'manager'
          AND is_active = true
        ORDER BY name ASC
      ),
      reps AS (
        SELECT
          id,
          name,
          email,
          manager_id,
          is_active
        FROM users
        WHERE role = 'scales_man'
        ORDER BY name ASC
      )
      SELECT
        (SELECT COALESCE(json_agg(m), '[]'::json) FROM managers m) AS managers,
        (SELECT COALESCE(json_agg(r), '[]'::json) FROM reps r)     AS reps;
    `;

    const { rows } = await query(sql);
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

  try {
    const body = await req.json();
    const { repId, managerId } = body;
    // managerId can be null → unassign

    if (!repId) {
      return NextResponse.json(
        { success: false, error: "repId is required" },
        { status: 400 },
      );
    }

    // Validate rep exists and is scales_man
    const { rows: repRows } = await query(
      `SELECT id, role FROM users WHERE id = $1`,
      [repId],
    );

    if (!repRows.length || repRows[0].role !== "scales_man") {
      return NextResponse.json(
        { success: false, error: "Sales rep not found" },
        { status: 404 },
      );
    }

    // If managerId provided, validate manager exists
    if (managerId) {
      const { rows: mgrRows } = await query(
        `SELECT id, role FROM users WHERE id = $1`,
        [managerId],
      );

      if (!mgrRows.length || mgrRows[0].role !== "manager") {
        return NextResponse.json(
          { success: false, error: "Manager not found" },
          { status: 404 },
        );
      }
    }

    // Update manager_id
    const { rows: updated } = await query(
      `UPDATE users
       SET manager_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, manager_id`,
      [managerId ?? null, repId],
    );

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
