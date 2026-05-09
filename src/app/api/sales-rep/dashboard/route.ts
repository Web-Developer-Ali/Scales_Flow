import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const REP_MONTH_TARGET = 10; // per-rep monthly deal target

function getUTCMonthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .substring(0, 10);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "scales_man") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const repId = session.user.id;
  const monthStart = getUTCMonthStart();

  try {
    const sql = `
      WITH
      -- Current month: this rep's won deals
      my_won AS (
        SELECT
          COALESCE(SUM(value), 0)                                         AS closed_value,
          COUNT(*)                                                         AS closed_count,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0)   AS avg_close_days
        FROM deals
        WHERE generated_month = $2
          AND status = 'won'
          AND assigned_to = $1
      ),

      -- Current month: this rep's active pipeline
      my_active AS (
        SELECT COALESCE(SUM(value), 0) AS pipeline_value
        FROM deals
        WHERE generated_month = $2
          AND status = 'active'
          AND assigned_to = $1
      ),

      -- Previous month (for deltas)
      prev_won AS (
        SELECT COALESCE(SUM(value), 0) AS prev_closed_value
        FROM deals
        WHERE generated_month = (DATE_TRUNC('month', $2::date) - INTERVAL '1 month')::date
          AND status = 'won'
          AND assigned_to = $1
      ),

      prev_active AS (
        SELECT COALESCE(SUM(value), 0) AS prev_pipeline
        FROM deals
        WHERE generated_month = (DATE_TRUNC('month', $2::date) - INTERVAL '1 month')::date
          AND status = 'active'
          AND assigned_to = $1
      ),

      -- Pipeline breakdown by stage (count + value per stage)
      my_stages AS (
        SELECT
          stage::text                   AS stage,
          COUNT(*)                      AS deal_count,
          COALESCE(SUM(value), 0)       AS stage_value
        FROM deals
        WHERE generated_month = $2
          AND status = 'active'
          AND assigned_to = $1
        GROUP BY stage
      ),

      -- Hot leads: active deals with probability >= 60
      hot_leads AS (
        SELECT COUNT(*) AS hot_count
        FROM deals
        WHERE generated_month = $2
          AND status = 'active'
          AND probability >= 60
          AND assigned_to = $1
      ),

      -- Recent deals: last 10 this rep's deals this month
      my_recent AS (
        SELECT
          d.id,
          d.title,
          d.company,
          d.contact_person                                         AS contact,
          d.value,
          d.stage::text,
          d.status::text,
          d.probability,
          d.created_at,
          GREATEST(
            EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0,
            0
          )                                                        AS days_in_stage
        FROM deals d
        WHERE d.generated_month = $2
          AND d.assigned_to = $1
        ORDER BY d.created_at DESC
        LIMIT 10
      ),

      -- Deals needing attention: active, high probability (>=60),
      -- but not updated in more than 5 days — stalled deals
      needs_attention AS (
        SELECT
          d.id,
          d.title,
          d.company,
          d.value,
          d.stage::text,
          d.probability,
          GREATEST(
            EXTRACT(EPOCH FROM (NOW() - d.updated_at)) / 86400.0,
            0
          )                AS days_stale,
          GREATEST(
            EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0,
            0
          )                AS days_in_stage
        FROM deals d
        WHERE d.assigned_to = $1
          AND d.status = 'active'
          AND d.probability >= 60
          AND d.updated_at < NOW() - INTERVAL '5 days'
        ORDER BY d.probability DESC, d.value DESC
        LIMIT 6
      ),

      -- Last 6 months deal counts (for trend chart)
      monthly_trend AS (
        SELECT
          TO_CHAR(generated_month, 'Mon') AS month_label,
          generated_month,
          COUNT(*) FILTER (WHERE status = 'won')    AS won_count,
          COUNT(*) FILTER (WHERE status = 'active') AS active_count
        FROM deals
        WHERE assigned_to = $1
          AND generated_month >= (DATE_TRUNC('month', $2::date) - INTERVAL '5 months')::date
          AND generated_month <= $2::date
        GROUP BY generated_month
        ORDER BY generated_month ASC
      )

      SELECT
        -- metrics
        mw.closed_value,
        mw.closed_count,
        mw.avg_close_days,
        ma.pipeline_value,
        pw.prev_closed_value,
        pa.prev_pipeline,
        hl.hot_count,

        -- JSON arrays
        (SELECT COALESCE(json_agg(s ORDER BY s.stage), '[]'::json)  FROM my_stages s)       AS stage_breakdown,
        (SELECT COALESCE(json_agg(r ORDER BY r.created_at DESC), '[]'::json) FROM my_recent r) AS recent_deals,
        (SELECT COALESCE(json_agg(n ORDER BY n.days_stale DESC), '[]'::json) FROM needs_attention n) AS needs_attention,
        (SELECT COALESCE(json_agg(t ORDER BY t.generated_month ASC), '[]'::json) FROM monthly_trend t) AS monthly_trend

      FROM my_won mw, my_active ma, prev_won pw, prev_active pa, hot_leads hl;
    `;

    const { rows } = await query(sql, [repId, monthStart]);
    const row = rows[0];

    const closedCount = Number(row.closed_count ?? 0);
    const pipelineValue = Number(row.pipeline_value ?? 0);
    const closedValue = Number(row.closed_value ?? 0);
    const prevPipeline = Number(row.prev_pipeline ?? 0);
    const prevClosed = Number(row.prev_closed_value ?? 0);

    return NextResponse.json({
      success: true,
      month: monthStart,
      metrics: {
        pipelineValue,
        closedValue,
        closedCount,
        avgCloseTime: Math.round(Number(row.avg_close_days ?? 0)),
        hotLeads: Number(row.hot_count ?? 0),
        target: REP_MONTH_TARGET,
        targetPercent: Math.round((closedCount / REP_MONTH_TARGET) * 100),
        pipelineDelta:
          prevPipeline > 0
            ? Math.round(((pipelineValue - prevPipeline) / prevPipeline) * 100)
            : null,
        closedDelta:
          prevClosed > 0
            ? Math.round(((closedValue - prevClosed) / prevClosed) * 100)
            : null,
      },
      stageBreakdown: row.stage_breakdown ?? [],
      recentDeals: row.recent_deals ?? [],
      needsAttention: row.needs_attention ?? [],
      monthlyTrend: row.monthly_trend ?? [],
    });
  } catch (err) {
    console.error("Sales Rep Dashboard API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
