import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "scales_man") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const repId = session.user.id;

  try {
    const sql = `
      WITH
      -- Last 6 months of performance, including current month
      monthly_performance AS (
        SELECT
          TO_CHAR(generated_month, 'Mon YY')                        AS month_label,
          generated_month,
          COUNT(*)                                                   AS total_deals,
          COUNT(*) FILTER (WHERE status = 'won')                    AS won_deals,
          COUNT(*) FILTER (WHERE status = 'lost')                   AS lost_deals,
          COUNT(*) FILTER (WHERE status = 'active')                 AS active_deals,
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0)  AS revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0)  AS pipeline,
          COALESCE(AVG(value) FILTER (WHERE status = 'won'),    0)  AS avg_deal_size,
          ROUND(
            AVG(
              EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0
            ) FILTER (WHERE status = 'won')
          )                                                          AS avg_close_days,
          CASE
            WHEN COUNT(*) FILTER (WHERE status IN ('won','lost')) > 0
            THEN ROUND(
              COUNT(*) FILTER (WHERE status = 'won') * 100.0 /
              COUNT(*) FILTER (WHERE status IN ('won','lost'))
            )
            ELSE 0
          END                                                        AS win_rate
        FROM deals
        WHERE assigned_to       = $1
          AND generated_month  >= (DATE_TRUNC('month', NOW()) - INTERVAL '5 months')::date
          AND generated_month  <= DATE_TRUNC('month', NOW())::date
        GROUP BY generated_month
        ORDER BY generated_month ASC
      ),

      -- All-time summary
      all_time AS (
        SELECT
          COUNT(*)                                                  AS total_deals,
          COUNT(*) FILTER (WHERE status = 'won')                   AS total_won,
          COUNT(*) FILTER (WHERE status = 'lost')                  AS total_lost,
          COUNT(*) FILTER (WHERE status = 'active')                AS total_active,
          COALESCE(SUM(value) FILTER (WHERE status = 'won'),    0) AS total_revenue,
          COALESCE(SUM(value) FILTER (WHERE status = 'active'), 0) AS total_pipeline,
          COALESCE(AVG(value) FILTER (WHERE status = 'won'),    0) AS avg_deal_size,
          ROUND(
            COALESCE(
              AVG(
                EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0
              ) FILTER (WHERE status = 'won'), 0
            )
          )                                                         AS avg_close_days,
          CASE
            WHEN COUNT(*) FILTER (WHERE status IN ('won','lost')) > 0
            THEN ROUND(
              COUNT(*) FILTER (WHERE status = 'won') * 100.0 /
              COUNT(*) FILTER (WHERE status IN ('won','lost'))
            )
            ELSE 0
          END                                                       AS win_rate
        FROM deals
        WHERE assigned_to = $1
      ),

      -- Current month: closed vs total created (real target, not hardcoded)
      this_month AS (
        SELECT
          COUNT(*)                                AS total_created,
          COUNT(*) FILTER (WHERE status = 'won')  AS total_won,
          COALESCE(SUM(value) FILTER (WHERE status = 'won'), 0) AS revenue
        FROM deals
        WHERE assigned_to       = $1
          AND generated_month   = DATE_TRUNC('month', NOW())::date
      ),

      -- Stage breakdown for current active deals
      stage_breakdown AS (
        SELECT
          stage::text AS stage,
          COUNT(*)    AS count,
          COALESCE(SUM(value), 0) AS stage_value
        FROM deals
        WHERE assigned_to = $1
          AND status      = 'active'
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

      -- Best month (highest revenue, all time)
      best_month AS (
        SELECT
          TO_CHAR(generated_month, 'Mon YYYY') AS month_label,
          SUM(value) FILTER (WHERE status = 'won') AS revenue
        FROM deals
        WHERE assigned_to = $1
        GROUP BY generated_month
        HAVING SUM(value) FILTER (WHERE status = 'won') > 0
        ORDER BY revenue DESC
        LIMIT 1
      )

      SELECT
        (SELECT row_to_json(a)  FROM all_time a)                                AS all_time,
        (SELECT row_to_json(tm) FROM this_month tm)                             AS this_month,
        (SELECT row_to_json(bm) FROM best_month bm)                             AS best_month,
        (SELECT COALESCE(json_agg(m), '[]'::json) FROM monthly_performance m)   AS monthly_performance,
        (SELECT COALESCE(json_agg(s), '[]'::json) FROM stage_breakdown s)       AS stage_breakdown;
    `;

    const { rows } = await query(sql, [repId]);
    const row = rows[0];

    return NextResponse.json({
      success: true,
      allTime: row.all_time,
      thisMonth: row.this_month,
      bestMonth: row.best_month,
      monthlyPerformance: row.monthly_performance ?? [],
      stageBreakdown: row.stage_breakdown ?? [],
    });
  } catch (err) {
    console.error("Rep Performance API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
