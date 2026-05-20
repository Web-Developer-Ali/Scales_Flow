import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

function getUTCMonthStart(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString()
    .substring(0, 10);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const monthStart = getUTCMonthStart();

    const sql = `
      WITH
      -- Total pipeline = ALL active deals regardless of month
      -- This is what agencies care about: total open revenue right now
      total_pipeline AS (
        SELECT COALESCE(SUM(value), 0) AS pipeline
        FROM deals
        WHERE status = 'active'
      ),

      -- Deals won this calendar month
      monthly_won AS (
        SELECT
          COALESCE(SUM(value), 0)                                        AS closed_value,
          COUNT(*)                                                        AS closed_count,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0)  AS avg_close_days
        FROM deals
        WHERE generated_month = $1
          AND status = 'won'
      ),

      -- All deals created this month (for target: X closed out of Y created)
      monthly_created AS (
        SELECT COUNT(*) AS created_count
        FROM deals
        WHERE generated_month = $1
      ),

      -- Previous month pipeline (for delta)
      prev_active AS (
        SELECT COALESCE(SUM(value), 0) AS prev_pipeline
        FROM deals
        WHERE status = 'active'
          AND created_at < DATE_TRUNC('month', $1::date)
      ),

      -- Previous month won (for delta)
      prev_won AS (
        SELECT COALESCE(SUM(value), 0) AS prev_closed_value
        FROM deals
        WHERE generated_month = (DATE_TRUNC('month', $1::date) - INTERVAL '1 month')::date
          AND status = 'won'
      ),

      -- Pipeline by stage (all active deals, not just this month)
      stage_counts AS (
        SELECT
          stage::text AS stage,
          COUNT(*)    AS count
        FROM deals
        WHERE status = 'active'
        GROUP BY stage
      ),

      -- Team performance:
      -- closed_deals = won this month assigned to them
      -- total_assigned = all deals assigned to them this month
      -- This gives a real picture: "Ali closed 3 out of 8 deals this month"
      team_perf AS (
        SELECT
          u.id,
          u.name,
          COUNT(d.id)                                              AS total_assigned,
          COUNT(d.id) FILTER (WHERE d.status = 'won')             AS closed_deals,
          COALESCE(SUM(d.value) FILTER (WHERE d.status = 'won'), 0) AS total_value
        FROM users u
        LEFT JOIN deals d
          ON  d.assigned_to     = u.id
          AND d.generated_month = $1
        WHERE u.role IN ('manager', 'scales_man')
          AND u.is_active = true
        GROUP BY u.id, u.name
        ORDER BY closed_deals DESC, total_value DESC
        LIMIT 6
      ),

      -- Recent deals (all statuses, most recent first)
      recent AS (
        SELECT
          d.id,
          d.title,
          d.company,
          d.contact_person                                          AS contact,
          d.value,
          d.status::text,
          d.stage::text,
          d.probability,
          d.assigned_to,
          d.created_at,
          GREATEST(
            EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0,
            0
          ) AS days_in_stage
        FROM deals d
        ORDER BY d.created_at DESC
        LIMIT 10
      )

      SELECT
        tp.pipeline                AS total_pipeline,
        mw.closed_value,
        mw.closed_count,
        mw.avg_close_days,
        mc.created_count,
        pw.prev_closed_value,
        pa.prev_pipeline,

        (SELECT COALESCE(json_agg(s ORDER BY s.stage), '[]'::json)
         FROM stage_counts s)                                       AS pipeline_by_stage,

        (SELECT COALESCE(json_agg(t ORDER BY t.closed_deals DESC), '[]'::json)
         FROM team_perf t)                                          AS team_performance,

        (SELECT COALESCE(json_agg(r ORDER BY r.created_at DESC), '[]'::json)
         FROM recent r)                                             AS recent_deals

      FROM total_pipeline tp, monthly_won mw, monthly_created mc,
           prev_won pw, prev_active pa;
    `;

    const { rows } = await query(sql, [monthStart]);
    const row = rows[0];

    const closedCount = Number(row.closed_count ?? 0);
    const createdCount = Number(row.created_count ?? 0);
    const totalPipeline = Number(row.total_pipeline ?? 0);
    const closedValue = Number(row.closed_value ?? 0);
    const prevPipeline = Number(row.prev_pipeline ?? 0);
    const prevClosed = Number(row.prev_closed_value ?? 0);

    return NextResponse.json({
      success: true,
      month: monthStart,
      metrics: {
        totalPipeline,
        closedThisMonth: closedValue,
        avgCloseTime: Math.round(Number(row.avg_close_days ?? 0)),

        // Deal target = closed this month out of total created this month
        // Not a hardcoded number — real data
        targetProgress: {
          closed: closedCount,
          total: createdCount, // total deals created this month
          percent:
            createdCount > 0
              ? Math.round((closedCount / createdCount) * 100)
              : 0,
        },

        pipelineDelta:
          prevPipeline > 0
            ? Math.round(((totalPipeline - prevPipeline) / prevPipeline) * 100)
            : null,
        closedDelta:
          prevClosed > 0
            ? Math.round(((closedValue - prevClosed) / prevClosed) * 100)
            : null,
      },
      pipelineByStage: row.pipeline_by_stage ?? [],
      teamPerformance: row.team_performance ?? [],
      recentDeals: row.recent_deals ?? [],
    });
  } catch (err) {
    console.error("Dashboard API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
