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
  const organizationId = session.user.organizationId;

  if (!["admin", "manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const type = searchParams.get("type") ?? "all";

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // ── Always scope to this org first ────────────────────────────────────────
    // This is the primary tenant isolation guard on this route.
    conditions.push(`ua.organization_id = $${idx}`);
    params.push(organizationId);
    idx++;

    // ── Role-based scope ──────────────────────────────────────────────────────
    // Admin: sees all activity within the org (org filter above is enough)
    // Manager: sees only their own team's activity + // app/api/activity-feed/route.tstheir own
    if (role === "manager") {
      conditions.push(`
        ua.user_id IN (
          SELECT id FROM users
          WHERE organization_id = $${idx - 1}   -- same org, already in params
            AND manager_id      = $${idx}
            AND role            = 'scales_man'
          UNION ALL
          SELECT $${idx}::uuid                   -- include the manager's own activity
        )
      `);
      params.push(userId);
      idx++;
    }

    // ── Optional activity type filter ─────────────────────────────────────────
    if (type !== "all") {
      conditions.push(`ua.activity_type = $${idx}::user_activity_type`);
      params.push(type);
      idx++;
    }

    const WHERE = `WHERE ${conditions.join(" AND ")}`;
    const limitIdx = idx;
    const offsetIdx = idx + 1;
    params.push(limit, offset);

    const sql = `
      SELECT
        ua.id,
        ua.activity_type,
        ua.description,
        ua.entity_type,
        ua.entity_id,
        ua.created_at,

        ua.user_id,
        u.name AS user_name,
        u.role AS user_role,

        ua.performed_by,
        p.name AS performed_by_name,

        -- Enrich with entity details — scoped to org to prevent cross-tenant leaks
        CASE
          WHEN ua.entity_type = 'deal'
          THEN (
            SELECT title FROM deals
            WHERE id = ua.entity_id
              AND organization_id = $1
          )
          ELSE NULL
        END AS deal_title,

        CASE
          WHEN ua.entity_type = 'deal'
          THEN (
            SELECT company FROM deals
            WHERE id = ua.entity_id
              AND organization_id = $1
          )
          ELSE NULL
        END AS deal_company,

        CASE
          WHEN ua.entity_type = 'deal'
          THEN (
            SELECT value FROM deals
            WHERE id = ua.entity_id
              AND organization_id = $1
          )
          ELSE NULL
        END AS deal_value,

        CASE
          WHEN ua.entity_type = 'client'
          THEN (
            SELECT company_name FROM clients
            WHERE id = ua.entity_id
              AND organization_id = $1
          )
          ELSE NULL
        END AS client_name,

        CASE
          WHEN ua.entity_type = 'user'
          THEN (
            SELECT name FROM users
            WHERE id = ua.entity_id
              AND organization_id = $1
          )
          ELSE NULL
        END AS affected_user_name

      FROM user_activities ua
      LEFT JOIN users u ON ua.user_id      = u.id
      LEFT JOIN users p ON ua.performed_by = p.id
      ${WHERE}
      ORDER BY ua.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    // Count query uses same WHERE but without limit/offset params
    const countSql = `
      SELECT COUNT(*) AS total
      FROM user_activities ua
      ${WHERE}
    `;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, -2)), // strip limit + offset
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
