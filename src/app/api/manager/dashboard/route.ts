import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const MONTH_TARGET = 20; // per-team target; tune later

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
      -- All sales reps that belong to this manager
      my_team AS (
        SELECT id, name
        FROM users
        WHERE created_by = $1
          AND role = 'scales_man'
          AND is_active = true
      ),

      -- Manager's own deals (assigned directly to them)
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

      my_active AS (
        SELECT COALESCE(SUM(value), 0) AS personal_pipeline
        FROM deals
        WHERE generated_month = $2
          AND status = 'active'
          AND assigned_to = $1
      ),

      -- Team deals (all reps under this manager)
      team_won AS (
        SELECT
          COALESCE(SUM(value), 0) AS team_closed_value,
          COUNT(*)                AS team_closed_count
        FROM deals
        WHERE generated_month = $2
          AND status = 'won'
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      team_active AS (
        SELECT COALESCE(SUM(value), 0) AS team_pipeline
        FROM deals
        WHERE generated_month = $2
          AND status = 'active'
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      -- Previous month deltas for team
      prev_team_won AS (
        SELECT COALESCE(SUM(value), 0) AS prev_team_closed
        FROM deals
        WHERE generated_month = (DATE_TRUNC('month', $2::date) - INTERVAL '1 month')::date
          AND status = 'won'
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      prev_team_active AS (
        SELECT COALESCE(SUM(value), 0) AS prev_team_pipeline
        FROM deals
        WHERE generated_month = (DATE_TRUNC('month', $2::date) - INTERVAL '1 month')::date
          AND status = 'active'
          AND assigned_to IN (SELECT id FROM my_team)
      ),

      -- Per-rep performance
      rep_performance AS (
        SELECT
          u.id,
          u.name,
          COUNT(d.id)               AS closed_deals,
          COALESCE(SUM(d.value), 0) AS total_value
        FROM my_team u
        LEFT JOIN deals d
          ON d.assigned_to    = u.id
         AND d.generated_month = $2
         AND d.status          = 'won'
        GROUP BY u.id, u.name
        ORDER BY total_value DESC
      ),

      -- Manager's own active deals (personal pipeline detail)
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
          AND d.assigned_to = $1
          AND d.status = 'active'
        ORDER BY d.value DESC
        LIMIT 8
      ),

      -- Recent team activity: latest deals movement across all team members
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
        -- personal metrics
        mw.closed_value         AS my_closed_value,
        mw.closed_count         AS my_closed_count,
        mw.avg_close_days       AS my_avg_close_days,
        ma.personal_pipeline,

        -- team metrics
        tw.team_closed_value,
        tw.team_closed_count,
        ta.team_pipeline,
        ptw.prev_team_closed,
        pta.prev_team_pipeline,

        -- team size
        (SELECT COUNT(*) FROM my_team) AS team_size,

        -- JSON arrays
        (SELECT COALESCE(json_agg(r ORDER BY r.total_value DESC), '[]'::json) FROM rep_performance r) AS rep_performance,
        (SELECT COALESCE(json_agg(m ORDER BY m.value DESC), '[]'::json)       FROM my_deals m)        AS my_deals,
        (SELECT COALESCE(json_agg(t ORDER BY t.updated_at DESC), '[]'::json)  FROM team_recent t)     AS team_recent

      FROM my_won mw, my_active ma, team_won tw, team_active ta,
           prev_team_won ptw, prev_team_active pta;
    `;

    const { rows } = await query(sql, [managerId, monthStart]);
    const row = rows[0];

    const teamClosedCount = Number(row.team_closed_count ?? 0);
    const teamPipeline = Number(row.team_pipeline ?? 0);
    const teamClosedValue = Number(row.team_closed_value ?? 0);
    const prevTeamPipeline = Number(row.prev_team_pipeline ?? 0);
    const prevTeamClosed = Number(row.prev_team_closed ?? 0);

    return NextResponse.json({
      success: true,
      month: monthStart,

      // What the manager personally is doing
      personal: {
        pipeline: Number(row.personal_pipeline ?? 0),
        closedValue: Number(row.my_closed_value ?? 0),
        closedCount: Number(row.my_closed_count ?? 0),
        avgCloseTime: Math.round(Number(row.my_avg_close_days ?? 0)),
        deals: row.my_deals ?? [],
      },

      // What the manager's team is doing
      team: {
        size: Number(row.team_size ?? 0),
        pipeline: teamPipeline,
        closedValue: teamClosedValue,
        closedCount: teamClosedCount,
        target: MONTH_TARGET,
        targetPercent: Math.round((teamClosedCount / MONTH_TARGET) * 100),
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
