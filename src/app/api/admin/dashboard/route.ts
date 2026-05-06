import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

const MONTH_TARGET = 50; // Move to env var or DB settings table when ready

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

    // ─── Single round-trip via CTEs ─────────────────────────────────────────
    // All 7 original queries collapsed into one. PostgreSQL executes CTEs
    const sql = `
    WITH
    -- Step 1: current month won deals
    monthly_won AS (
      SELECT
        COALESCE(SUM(value), 0)                                       AS closed_value,
        COUNT(*)                                                       AS closed_count,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0) AS avg_close_days
      FROM deals
      WHERE generated_month = $1
        AND status = 'won'
    ),
  
    -- Step 2: current month active deals
    monthly_active AS (
      SELECT COALESCE(SUM(value), 0) AS total_pipeline
      FROM deals
      WHERE generated_month = $1
        AND status = 'active'
    ),
  
    -- Step 3: previous month (for deltas) — split into two CTEs, no FILTER
    prev_won AS (
      SELECT COALESCE(SUM(value), 0) AS prev_closed_value
      FROM deals
      WHERE generated_month = (DATE_TRUNC('month', $1::date) - INTERVAL '1 month')::date
        AND status = 'won'
    ),
  
    prev_active AS (
      SELECT COALESCE(SUM(value), 0) AS prev_pipeline
      FROM deals
      WHERE generated_month = (DATE_TRUNC('month', $1::date) - INTERVAL '1 month')::date
        AND status = 'active'
    ),
  
    -- Step 4: pipeline by stage
    stage_counts AS (
      SELECT stage::text AS stage, COUNT(*) AS count
      FROM deals
      WHERE generated_month = $1
      GROUP BY stage
    ),
  
    -- Step 5: team performance top 6 (no admin, correct role name)
    team_perf AS (
      SELECT
        u.id,
        u.name,
        COUNT(d.id)               AS closed_deals,
        COALESCE(SUM(d.value), 0) AS total_value
      FROM users u
      LEFT JOIN deals d
        ON  d.assigned_to     = u.id
        AND d.generated_month = $1
        AND d.status          = 'won'
      WHERE u.role IN ('manager', 'scales_man')
      GROUP BY u.id, u.name
      ORDER BY total_value DESC
      LIMIT 6
    ),
  
    -- Step 6: recent deals
    recent AS (
      SELECT
        d.id,
        d.title,
        d.company,
        d.contact_person                                         AS contact,
        d.value,
        d.status::text,
        d.stage::text,
        d.probability,
        d.assigned_to,
        d.created_at,
        EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0   AS days_in_stage
      FROM deals d
      WHERE d.generated_month = $1
      ORDER BY d.created_at DESC
      LIMIT 10
    )
  
    SELECT
      ma.total_pipeline,
      mw.closed_value,
      mw.closed_count,
      mw.avg_close_days,
      pw.prev_closed_value,
      pa.prev_pipeline,
  
      (SELECT COALESCE(json_agg(s ORDER BY s.stage), '[]'::json)              FROM stage_counts s) AS pipeline_by_stage,
      (SELECT COALESCE(json_agg(t ORDER BY t.total_value DESC), '[]'::json)   FROM team_perf t)    AS team_performance,
      (SELECT COALESCE(json_agg(r ORDER BY r.created_at DESC), '[]'::json)    FROM recent r)       AS recent_deals
  
    FROM monthly_active ma, monthly_won mw, prev_won pw, prev_active pa;
  `;

    const { rows } = await query(sql, [monthStart]);
    const row = rows[0];
    const closedCount = Number(row.closed_count ?? 0);

    const totalPipeline = Number(row.total_pipeline ?? 0);
    const closedThisMonth = Number(row.closed_value ?? 0);
    const prevPipeline = Number(row.prev_pipeline ?? 0);
    const prevClosed = Number(row.prev_closed_value ?? 0);

    return NextResponse.json({
      success: true,
      month: monthStart,
      metrics: {
        totalPipeline,
        closedThisMonth,
        avgCloseTime: Math.round(Number(row.avg_close_days ?? 0)),
        targetProgress: {
          closed: closedCount,
          target: MONTH_TARGET,
          percent: Math.round((closedCount / MONTH_TARGET) * 100),
        },
        pipelineDelta:
          prevPipeline > 0
            ? Math.round(((totalPipeline - prevPipeline) / prevPipeline) * 100)
            : null,
        closedDelta:
          prevClosed > 0
            ? Math.round(((closedThisMonth - prevClosed) / prevClosed) * 100)
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
