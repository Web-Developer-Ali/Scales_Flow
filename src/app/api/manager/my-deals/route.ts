import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "manager") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";
  const repId = searchParams.get("rep") ?? "all";
  const sort = searchParams.get("sort") ?? "created_at_desc";

  const managerId = session.user.id;

  try {
    // Whitelist sort options — never interpolate user input directly
    const ORDER_MAP: Record<string, string> = {
      created_at_desc: "b.created_at DESC",
      created_at_asc: "b.created_at ASC",
      value_desc: "b.value DESC",
      value_asc: "b.value ASC",
      probability_desc: "b.probability DESC",
      days_desc: "b.days_in_stage DESC",
      rep_asc: "b.rep_name ASC",
    };
    const ORDER = ORDER_MAP[sort] ?? "b.created_at DESC";

    // Build dynamic WHERE on top of the team filter
    const conditions: string[] = ["d.assigned_to IN (SELECT id FROM my_team)"];
    const params: unknown[] = [managerId];
    let paramIndex = 2;

    if (stage !== "all") {
      conditions.push(`d.stage = $${paramIndex}::deal_stage`);
      params.push(stage);
      paramIndex++;
    }

    if (status !== "all") {
      conditions.push(`d.status = $${paramIndex}::deal_status`);
      params.push(status);
      paramIndex++;
    }

    if (repId !== "all") {
      conditions.push(`d.assigned_to = $${paramIndex}`);
      params.push(repId);
      paramIndex++;
    }

    if (search.trim()) {
      conditions.push(
        `(d.company ILIKE $${paramIndex} OR d.contact_person ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`,
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const WHERE = conditions.join(" AND ");

    const sql = `
      WITH
      -- Manager's direct reports only
      my_team AS (
        SELECT id, name
        FROM users
        WHERE manager_id = $1
          AND role = 'scales_man'
          AND is_active = true
      ),

      base AS (
        SELECT
          d.id,
          d.title,
          d.company,
          d.contact_person,
          d.contact_email,
          d.value,
          d.stage::text,
          d.status::text,
          d.probability,
          d.expected_close_date,
          d.description,
          d.created_at,
          d.updated_at,
          d.assigned_to,
          u.name  AS rep_name,
          u.email AS rep_email,
          GREATEST(
            EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0,
            0
          ) AS days_in_stage
        FROM deals d
        LEFT JOIN users u ON d.assigned_to = u.id
        WHERE ${WHERE}
      ),

      -- Stats over filtered set
      stats AS (
        SELECT
          COUNT(*)                                       AS total_deals,
          COALESCE(SUM(value), 0)                        AS total_pipeline,
          COALESCE(AVG(probability), 0)                  AS avg_probability,
          COALESCE(SUM(value * probability / 100.0), 0)  AS expected_revenue,
          COUNT(*) FILTER (WHERE status = 'won')         AS won_count,
          COUNT(*) FILTER (WHERE status = 'active')      AS active_count,
          COUNT(*) FILTER (WHERE status = 'lost')        AS lost_count
        FROM base
      ),

      -- Per-rep summary (for the rep filter dropdown + rep stats)
      rep_summary AS (
        SELECT
          t.id,
          t.name,
          COUNT(d.id)                      AS total_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'active') AS active_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'won')    AS won_deals,
          COALESCE(SUM(d.value), 0)        AS pipeline_value
        FROM my_team t
        LEFT JOIN deals d
          ON d.assigned_to    = t.id
          AND d.created_at >= DATE_TRUNC('month', NOW())
        GROUP BY t.id, t.name
        ORDER BY pipeline_value DESC
      )

      SELECT
        (SELECT row_to_json(s)  FROM stats s)                                     AS stats,
        (SELECT COALESCE(json_agg(b ORDER BY ${ORDER}), '[]'::json) FROM base b)  AS deals,
        (SELECT COALESCE(json_agg(r ORDER BY r.pipeline_value DESC), '[]'::json)
         FROM rep_summary r)                                                        AS reps;
    `;

    const { rows } = await query(sql, params);
    const row = rows[0];

    return NextResponse.json({
      success: true,
      stats: {
        totalDeals: Number(row.stats?.total_deals ?? 0),
        totalPipeline: Number(row.stats?.total_pipeline ?? 0),
        avgProbability: Math.round(Number(row.stats?.avg_probability ?? 0)),
        expectedRevenue: Math.round(Number(row.stats?.expected_revenue ?? 0)),
        wonCount: Number(row.stats?.won_count ?? 0),
        activeCount: Number(row.stats?.active_count ?? 0),
        lostCount: Number(row.stats?.lost_count ?? 0),
      },
      deals: row.deals ?? [],
      reps: row.reps ?? [],
    });
  } catch (err) {
    console.error("Manager Deals API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
