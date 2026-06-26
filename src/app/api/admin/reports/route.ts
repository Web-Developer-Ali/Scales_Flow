import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const sql = `
      WITH
      -- 1. Revenue by month — last 12 months
      monthly_revenue AS (
        SELECT
          TO_CHAR(generated_month, 'Mon YY')        AS month_label,
          generated_month,
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0) AS won_revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0) AS pipeline_value,
          COUNT(*)                                                   AS total_deals,
          COUNT(*) FILTER (WHERE status = 'won')                    AS won_deals,
          COUNT(*) FILTER (WHERE status = 'lost')                   AS lost_deals
        FROM deals
        WHERE generated_month >= (DATE_TRUNC('month', NOW()) - INTERVAL '11 months')::date
          AND generated_month <= DATE_TRUNC('month', NOW())::date
        GROUP BY generated_month
        ORDER BY generated_month ASC
      ),

      -- 2. Top performing reps (by closed value, all time)
      top_reps AS (
        SELECT
          u.id,
          u.name,
          u.role,
          COUNT(d.id)                                               AS total_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'won')              AS won_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'lost')             AS lost_deals,
          COALESCE(SUM(d.value) FILTER (WHERE d.status = 'won'), 0) AS total_revenue,
          COALESCE(SUM(d.value) FILTER (WHERE d.status = 'active'), 0) AS pipeline_value,
          -- Avg close time in days for won deals
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) / 86400.0
            ) FILTER (WHERE d.status = 'won')
          ) AS avg_close_days,
          -- Win rate
          CASE
            WHEN COUNT(d.id) FILTER (WHERE d.status IN ('won','lost')) > 0
            THEN ROUND(
              COUNT(d.id) FILTER (WHERE d.status = 'won') * 100.0 /
              COUNT(d.id) FILTER (WHERE d.status IN ('won','lost'))
            )
            ELSE 0
          END AS win_rate
        FROM users u
        LEFT JOIN deals d ON d.assigned_to = u.id
        WHERE u.role IN ('manager', 'scales_man')
          AND u.is_active = true
        GROUP BY u.id, u.name, u.role
        ORDER BY total_revenue DESC
        LIMIT 10
      ),

      -- 3. Deal conversion funnel (prospect → won)
      funnel AS (
        SELECT
          stage::text AS stage,
          COUNT(*)    AS total,
          COUNT(*) FILTER (WHERE status = 'won')    AS won,
          COUNT(*) FILTER (WHERE status = 'active') AS active,
          COUNT(*) FILTER (WHERE status = 'lost')   AS lost
        FROM deals
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

      -- 4. Overall summary stats
      summary AS (
        SELECT
          COUNT(*)                                                    AS total_deals,
          COUNT(*) FILTER (WHERE status = 'won')                     AS total_won,
          COUNT(*) FILTER (WHERE status = 'lost')                    AS total_lost,
          COUNT(*) FILTER (WHERE status = 'active')                  AS total_active,
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0)   AS total_revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0)   AS total_pipeline,
          COALESCE(AVG(value) FILTER (WHERE status = 'won'),    0)   AS avg_deal_size,
          COALESCE(
            ROUND(
              AVG(
                EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0
              ) FILTER (WHERE status = 'won')
            ), 0
          )                                                           AS avg_close_days,
          -- Overall win rate
          CASE
            WHEN COUNT(*) FILTER (WHERE status IN ('won','lost')) > 0
            THEN ROUND(
              COUNT(*) FILTER (WHERE status = 'won') * 100.0 /
              COUNT(*) FILTER (WHERE status IN ('won','lost'))
            )
            ELSE 0
          END                                                         AS overall_win_rate
        FROM deals
      ),

      -- 5. Pipeline health by stage (active deals only)
      pipeline_health AS (
        SELECT
          stage::text                             AS stage,
          COUNT(*)                                AS deal_count,
          COALESCE(SUM(value), 0)                 AS stage_value,
          ROUND(AVG(
            EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
          ))                                      AS avg_days_in_stage
        FROM deals
        WHERE status = 'active'
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

      -- 6. This month vs last month
      this_month AS (
        SELECT
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0) AS revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0) AS pipeline,
          COUNT(*) FILTER (WHERE status = 'won')                   AS won_count,
          COUNT(*)                                                  AS total_count
        FROM deals
        WHERE generated_month = DATE_TRUNC('month', NOW())::date
      ),
      last_month AS (
        SELECT
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0) AS revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0) AS pipeline,
          COUNT(*) FILTER (WHERE status = 'won')                   AS won_count
        FROM deals
        WHERE generated_month = (DATE_TRUNC('month', NOW()) - INTERVAL '1 month')::date
      )

      SELECT
        (SELECT row_to_json(s)  FROM summary s)                                           AS summary,
        (SELECT row_to_json(tm) FROM this_month tm)                                       AS this_month,
        (SELECT row_to_json(lm) FROM last_month lm)                                       AS last_month,
        (SELECT COALESCE(json_agg(r), '[]'::json) FROM monthly_revenue r)                 AS monthly_revenue,
        (SELECT COALESCE(json_agg(t), '[]'::json) FROM top_reps t)                       AS top_reps,
        (SELECT COALESCE(json_agg(f), '[]'::json) FROM funnel f)                         AS funnel,
        (SELECT COALESCE(json_agg(p), '[]'::json) FROM pipeline_health p)                AS pipeline_health;
    `;

    const { rows } = await query(sql);
    const row = rows[0];

    return NextResponse.json({
      success: true,
      summary: row.summary,
      thisMonth: row.this_month,
      lastMonth: row.last_month,
      monthlyRevenue: row.monthly_revenue ?? [],
      topReps: row.top_reps ?? [],
      funnel: row.funnel ?? [],
      pipelineHealth: row.pipeline_health ?? [],
    });
  } catch (err) {
    console.error("Admin Reports API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
