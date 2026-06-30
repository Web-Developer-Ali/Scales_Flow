import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "manager") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const managerId = session.user.id;

  try {
    const sql = `
      WITH
      -- All reps under this manager + the manager themselves
      my_team AS (
        SELECT id, name, role
        FROM users
        WHERE manager_id = $1
          AND role       = 'scales_man'
          AND is_active  = true

        UNION ALL

        SELECT id, name, role
        FROM users
        WHERE id = $1
      ),

      -- 1. Revenue by month — last 12 months (team only)
      monthly_revenue AS (
        SELECT
          TO_CHAR(generated_month, 'Mon YY')                        AS month_label,
          generated_month,
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0)  AS won_revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0)  AS pipeline_value,
          COUNT(*)                                                   AS total_deals,
          COUNT(*) FILTER (WHERE status = 'won')                    AS won_deals,
          COUNT(*) FILTER (WHERE status = 'lost')                   AS lost_deals
        FROM deals
        WHERE assigned_to IN (SELECT id FROM my_team)
          AND generated_month >= (DATE_TRUNC('month', NOW()) - INTERVAL '11 months')::date
          AND generated_month <= DATE_TRUNC('month', NOW())::date
        GROUP BY generated_month
        ORDER BY generated_month ASC
      ),

      -- 2. Rep-by-rep comparison (team members only, not the manager)
      rep_comparison AS (
        SELECT
          u.id,
          u.name,
          u.role,
          COUNT(d.id)                                                 AS total_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'won')                AS won_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'lost')               AS lost_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'active')             AS active_deals,
          COALESCE(SUM(d.value) FILTER (WHERE d.status = 'won'),  0) AS total_revenue,
          COALESCE(SUM(d.value) FILTER (WHERE d.status = 'active'),0) AS pipeline_value,
          -- Avg close time: days from created to won
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) / 86400.0
            ) FILTER (WHERE d.status = 'won')
          )                                                           AS avg_close_days,
          -- Win rate: won / (won + lost)
          CASE
            WHEN COUNT(d.id) FILTER (WHERE d.status IN ('won','lost')) > 0
            THEN ROUND(
              COUNT(d.id) FILTER (WHERE d.status = 'won') * 100.0 /
              COUNT(d.id) FILTER (WHERE d.status IN ('won','lost'))
            )
            ELSE 0
          END                                                         AS win_rate
        FROM my_team u
        LEFT JOIN deals d ON d.assigned_to = u.id
        GROUP BY u.id, u.name, u.role
        ORDER BY total_revenue DESC
      ),

      -- 3. Deal conversion funnel (team only)
      funnel AS (
        SELECT
          stage::text AS stage,
          COUNT(*)    AS total,
          COUNT(*) FILTER (WHERE status = 'won')    AS won,
          COUNT(*) FILTER (WHERE status = 'active') AS active,
          COUNT(*) FILTER (WHERE status = 'lost')   AS lost
        FROM deals
        WHERE assigned_to IN (SELECT id FROM my_team)
        GROUP BY stage
        ORDER BY
          CASE stage::text
            WHEN 'prospect'    THEN 1
            WHEN 'qualified'   THEN 2
            WHEN 'demo'        THEN 3
            WHEN 'negotiation' THEN 4
            WHEN 'closed'      THEN 5
          END
      ),

      -- 4. Overall summary (team only)
      summary AS (
        SELECT
          COUNT(*)                                                   AS total_deals,
          COUNT(*) FILTER (WHERE status = 'won')                    AS total_won,
          COUNT(*) FILTER (WHERE status = 'lost')                   AS total_lost,
          COUNT(*) FILTER (WHERE status = 'active')                 AS total_active,
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0)  AS total_revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0)  AS total_pipeline,
          COALESCE(AVG(value) FILTER (WHERE status = 'won'),    0)  AS avg_deal_size,
          COALESCE(
            ROUND(
              AVG(
                EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0
              ) FILTER (WHERE status = 'won')
            ), 0
          )                                                          AS avg_close_days,
          CASE
            WHEN COUNT(*) FILTER (WHERE status IN ('won','lost')) > 0
            THEN ROUND(
              COUNT(*) FILTER (WHERE status = 'won') * 100.0 /
              COUNT(*) FILTER (WHERE status IN ('won','lost'))
            )
            ELSE 0
          END                                                        AS overall_win_rate
        FROM deals
        WHERE assigned_to IN (SELECT id FROM my_team)
      ),

      -- 5. Pipeline health by stage (active deals, team only)
      pipeline_health AS (
        SELECT
          stage::text                              AS stage,
          COUNT(*)                                 AS deal_count,
          COALESCE(SUM(value), 0)                  AS stage_value,
          ROUND(AVG(
            EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
          ))                                       AS avg_days_in_stage
        FROM deals
        WHERE status      = 'active'
          AND assigned_to IN (SELECT id FROM my_team)
        GROUP BY stage
        ORDER BY
          CASE stage::text
            WHEN 'prospect'    THEN 1
            WHEN 'qualified'   THEN 2
            WHEN 'demo'        THEN 3
            WHEN 'negotiation' THEN 4
            WHEN 'closed'      THEN 5
          END
      ),

      -- 6. This month vs last month (team only)
      this_month AS (
        SELECT
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0) AS revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0) AS pipeline,
          COUNT(*) FILTER (WHERE status = 'won')                   AS won_count,
          COUNT(*)                                                  AS total_count
        FROM deals
        WHERE assigned_to   IN (SELECT id FROM my_team)
          AND generated_month = DATE_TRUNC('month', NOW())::date
      ),

      last_month AS (
        SELECT
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0) AS revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0) AS pipeline,
          COUNT(*) FILTER (WHERE status = 'won')                   AS won_count
        FROM deals
        WHERE assigned_to   IN (SELECT id FROM my_team)
          AND generated_month = (DATE_TRUNC('month', NOW()) - INTERVAL '1 month')::date
      ),

      -- 7. Who is closing fastest this month
      fastest_closers AS (
        SELECT
          u.id,
          u.name,
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) / 86400.0
            )
          ) AS avg_close_days,
          COUNT(d.id) AS won_this_month
        FROM my_team u
        INNER JOIN deals d
          ON d.assigned_to     = u.id
         AND d.status          = 'won'
         AND d.generated_month = DATE_TRUNC('month', NOW())::date
        GROUP BY u.id, u.name
        HAVING COUNT(d.id) > 0
        ORDER BY avg_close_days ASC
        LIMIT 6
      )

      SELECT
        (SELECT row_to_json(s)  FROM summary s)                                        AS summary,
        (SELECT row_to_json(tm) FROM this_month tm)                                    AS this_month,
        (SELECT row_to_json(lm) FROM last_month lm)                                    AS last_month,
        (SELECT COALESCE(json_agg(r), '[]'::json) FROM monthly_revenue r)              AS monthly_revenue,
        (SELECT COALESCE(json_agg(rc), '[]'::json) FROM rep_comparison rc)             AS rep_comparison,
        (SELECT COALESCE(json_agg(f),  '[]'::json) FROM funnel f)                      AS funnel,
        (SELECT COALESCE(json_agg(ph), '[]'::json) FROM pipeline_health ph)            AS pipeline_health,
        (SELECT COALESCE(json_agg(fc), '[]'::json) FROM fastest_closers fc)            AS fastest_closers,
        (SELECT COUNT(*) FROM my_team)                                                 AS team_size;
    `;

    const { rows } = await query(sql, [managerId]);
    const row = rows[0];

    return NextResponse.json({
      success: true,
      teamSize: Number(row.team_size ?? 0),
      summary: row.summary,
      thisMonth: row.this_month,
      lastMonth: row.last_month,
      monthlyRevenue: row.monthly_revenue ?? [],
      repComparison: row.rep_comparison ?? [],
      funnel: row.funnel ?? [],
      pipelineHealth: row.pipeline_health ?? [],
      fastestClosers: row.fastest_closers ?? [],
    });
  } catch (err) {
    console.error("Manager Reports API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
