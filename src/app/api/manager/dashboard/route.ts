import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

function getUTCMonthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .substring(0, 10);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "manager") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const managerId = session.user.id;
  const monthStart = getUTCMonthStart();

  try {
    const sql = `
      WITH
      -- All active sales reps under this manager
      my_team AS (
        SELECT id, name
        FROM users
        WHERE manager_id = $1
          AND role       = 'scales_man'
          AND is_active  = true
      ),

      -- Manager's own won deals this month
      my_won AS (
        SELECT
          COALESCE(SUM(value), 0)                                        AS closed_value,
          COUNT(*)                                                        AS closed_count,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0)  AS avg_close_days
        FROM deals
        WHERE generated_month = $2
          AND status           = 'won'
          AND assigned_to      = $1
      ),

      -- Manager's own active deals this month
      my_active AS (
        SELECT COALESCE(SUM(value), 0) AS personal_pipeline
        FROM deals
        WHERE generated_month = $2
          AND status           = 'active'
          AND assigned_to      = $1
      ),

      -- Team won deals this month
      team_won AS (
        SELECT
          COALESCE(SUM(value), 0) AS team_closed_value,
          COUNT(*)                AS team_closed_count
        FROM deals
        WHERE generated_month = $2
          AND status           = 'won'
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      -- Team active deals this month
      team_active AS (
        SELECT COALESCE(SUM(value), 0) AS team_pipeline
        FROM deals
        WHERE generated_month = $2
          AND status           = 'active'
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      -- Total deals created for the team this month (target denominator)
      team_created AS (
        SELECT COUNT(*) AS team_created_count
        FROM deals
        WHERE generated_month = $2
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      -- Previous month deltas
      prev_team_won AS (
        SELECT COALESCE(SUM(value), 0) AS prev_team_closed
        FROM deals
        WHERE generated_month = (DATE_TRUNC('month', $2::date) - INTERVAL '1 month')::date
          AND status           = 'won'
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      prev_team_active AS (
        SELECT COALESCE(SUM(value), 0) AS prev_team_pipeline
        FROM deals
        WHERE generated_month = (DATE_TRUNC('month', $2::date) - INTERVAL '1 month')::date
          AND status           = 'active'
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      -- Per-rep performance:
      -- total_assigned = all deals assigned to them this month
      -- closed_deals   = won deals assigned to them this month
      rep_performance AS (
        SELECT
          u.id,
          u.name,
          COUNT(d.id)                                                AS total_assigned,
          COUNT(d.id) FILTER (WHERE d.status = 'won')               AS closed_deals,
          COALESCE(SUM(d.value) FILTER (WHERE d.status = 'won'), 0) AS total_value
        FROM my_team u
        LEFT JOIN deals d
          ON  d.assigned_to     = u.id
          AND d.generated_month = $2
        GROUP BY u.id, u.name
        ORDER BY closed_deals DESC, total_value DESC
      ),

      -- Manager's own active deals detail
      my_deals AS (
        SELECT
          d.id,
          d.title,
          d.company,
          d.value,
          d.stage::text,
          d.probability,
          d.status::text,
          d.created_at,
          GREATEST(
            EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0,
            0
          ) AS days_in_stage
        FROM deals d
        WHERE d.generated_month = $2
          AND d.assigned_to      = $1
          AND d.status           = 'active'
        ORDER BY d.value DESC
        LIMIT 8
      ),

      -- Recent team deals
      team_recent AS (
        SELECT
          d.id,
          d.company,
          d.contact_person AS contact,
          d.value,
          d.stage::text,
          d.status::text,
          d.probability,
          d.assigned_to,
          u.name AS rep_name,
          d.created_at,
          d.updated_at,
          GREATEST(
            EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0,
            0
          ) AS days_in_stage
        FROM deals d
        LEFT JOIN users u ON d.assigned_to = u.id
        WHERE d.generated_month = $2
          AND d.assigned_to IN (SELECT id FROM my_team)
        ORDER BY d.updated_at DESC
        LIMIT 10
      )

      SELECT
        mw.closed_value       AS my_closed_value,
        mw.closed_count       AS my_closed_count,
        mw.avg_close_days     AS my_avg_close_days,
        ma.personal_pipeline,

        tw.team_closed_value,
        tw.team_closed_count,
        ta.team_pipeline,
        tc.team_created_count,
        ptw.prev_team_closed,
        pta.prev_team_pipeline,

        (SELECT COUNT(*) FROM my_team) AS team_size,

        (SELECT COALESCE(json_agg(r ORDER BY r.closed_deals DESC), '[]'::json)
         FROM rep_performance r)                                         AS rep_performance,

        (SELECT COALESCE(json_agg(m ORDER BY m.value DESC), '[]'::json)
         FROM my_deals m)                                                AS my_deals,

        (SELECT COALESCE(json_agg(t ORDER BY t.updated_at DESC), '[]'::json)
         FROM team_recent t)                                             AS team_recent

      FROM my_won mw, my_active ma, team_won tw, team_active ta,
           team_created tc, prev_team_won ptw, prev_team_active pta;
    `;

    const { rows } = await query(sql, [managerId, monthStart]);
    const row = rows[0];

    const teamClosedCount = Number(row.team_closed_count ?? 0);
    const teamCreatedCount = Number(row.team_created_count ?? 0);
    const teamPipeline = Number(row.team_pipeline ?? 0);
    const teamClosedValue = Number(row.team_closed_value ?? 0);
    const prevTeamPipeline = Number(row.prev_team_pipeline ?? 0);
    const prevTeamClosed = Number(row.prev_team_closed ?? 0);

    return NextResponse.json({
      success: true,
      month: monthStart,

      personal: {
        pipeline: Number(row.personal_pipeline ?? 0),
        closedValue: Number(row.my_closed_value ?? 0),
        closedCount: Number(row.my_closed_count ?? 0),
        avgCloseTime: Math.round(Number(row.my_avg_close_days ?? 0)),
        deals: row.my_deals ?? [],
      },

      team: {
        size: Number(row.team_size ?? 0),
        pipeline: teamPipeline,
        closedValue: teamClosedValue,
        closedCount: teamClosedCount,

        // Real target: closed out of total created this month
        // No more hardcoded 20
        totalCreated: teamCreatedCount,
        targetPercent:
          teamCreatedCount > 0
            ? Math.round((teamClosedCount / teamCreatedCount) * 100)
            : 0,

        pipelineDelta:
          prevTeamPipeline > 0
            ? Math.round(
                ((teamPipeline - prevTeamPipeline) / prevTeamPipeline) * 100,
              )
            : null,
        closedDelta:
          prevTeamClosed > 0
            ? Math.round(
                ((teamClosedValue - prevTeamClosed) / prevTeamClosed) * 100,
              )
            : null,
      },

      repPerformance: row.rep_performance ?? [],
      teamRecent: row.team_recent ?? [],
    });
  } catch (err) {
    console.error("Manager Dashboard API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
