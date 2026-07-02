import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = session.user.role;
  const userId = session.user.id;

  // Only admin and manager can see the activity feed
  if (!["admin", "manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const type = searchParams.get("type") ?? "all"; // filter by activity type

  try {
    // Build WHERE based on role
    // Admin sees all activity
    // Manager sees only their team's activity
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (role === "manager") {
      // Activities where the user_id is the manager's team member
      conditions.push(`
        ua.user_id IN (
          SELECT id FROM users
          WHERE manager_id = $${idx}
            AND role       = 'scales_man'
          UNION ALL
          SELECT $${idx}::uuid  -- include manager's own activity
        )
      `);
      params.push(userId);
      idx++;
    }

    if (type !== "all") {
      conditions.push(`ua.activity_type = $${idx}::user_activity_type`);
      params.push(type);
      idx++;
    }

    const WHERE = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Limit and offset params
    params.push(limit, offset);
    const limitIdx = idx;
    const offsetIdx = idx + 1;

    const sql = `
      SELECT
        ua.id,
        ua.activity_type,
        ua.description,
        ua.entity_type,
        ua.entity_id,
        ua.created_at,

        -- Who the activity belongs to
        ua.user_id,
        u.name  AS user_name,
        u.role  AS user_role,

        -- Who performed it (admin/manager acting on behalf)
        ua.performed_by,
        p.name  AS performed_by_name,

        -- Entity detail: enrich with deal/client/user name
        CASE
          WHEN ua.entity_type = 'deal'
          THEN (SELECT title FROM deals WHERE id = ua.entity_id)
          ELSE NULL
        END AS deal_title,

        CASE
          WHEN ua.entity_type = 'deal'
          THEN (SELECT company FROM deals WHERE id = ua.entity_id)
          ELSE NULL
        END AS deal_company,

        CASE
          WHEN ua.entity_type = 'deal'
          THEN (SELECT value FROM deals WHERE id = ua.entity_id)
          ELSE NULL
        END AS deal_value,

        CASE
          WHEN ua.entity_type = 'client'
          THEN (SELECT company_name FROM clients WHERE id = ua.entity_id)
          ELSE NULL
        END AS client_name,

        CASE
          WHEN ua.entity_type = 'user'
          THEN (SELECT name FROM users WHERE id = ua.entity_id)
          ELSE NULL
        END AS affected_user_name

      FROM user_activities ua
      LEFT JOIN users u ON ua.user_id      = u.id
      LEFT JOIN users p ON ua.performed_by = p.id
      ${WHERE}
      ORDER BY ua.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    // Total count for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM user_activities ua
      ${WHERE}
    `;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, -2)), // exclude limit/offset
    ]);
    return NextResponse.json({
      success: true,
      activities: rows,
      total: Number(countRows[0].total),
      limit,
      offset,
    });
  } catch (err) {
    console.error("Activity Feed API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
