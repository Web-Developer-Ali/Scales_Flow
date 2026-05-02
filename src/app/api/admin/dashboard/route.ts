import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.id ||
    session.user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // First day of current month
    const now = new Date();
    now.setDate(1);
    const monthStart = now.toISOString().substring(0, 10);

    // 1️⃣ TOTAL PIPELINE VALUE (all active deals this month)
    const totalPipelineQuery = `
      SELECT COALESCE(SUM(value), 0) AS total_pipeline
      FROM deals
      WHERE generated_month = $1
        AND status = 'active';
    `;

    const {
      rows: [pipeline],
    } = await query(totalPipelineQuery, [monthStart]);

    // 2️⃣ CLOSED THIS MONTH (value of closed deals)
    const closedThisMonthQuery = `
      SELECT COALESCE(SUM(value), 0) AS closed_value
      FROM deals
      WHERE generated_month = $1
        AND status = 'won';
    `;

    const {
      rows: [closed],
    } = await query(closedThisMonthQuery, [monthStart]);

    // 3️⃣ DEAL TARGET PROGRESS
    const targetQuery = `
      SELECT COUNT(*) AS closed_count
      FROM deals
      WHERE generated_month = $1
        AND status = 'won';
    `;

    const {
      rows: [target],
    } = await query(targetQuery, [monthStart]);

    const MONTH_TARGET = 50; // You can store in DB later
    const targetProgress = {
      closed: Number(target.closed_count),
      target: MONTH_TARGET,
      percent: Math.round((Number(target.closed_count) / MONTH_TARGET) * 100),
    };

    // 4️⃣ AVG CLOSE TIME
    const avgCloseTimeQuery = `
      SELECT AVG(EXTRACT(day FROM (updatedAt - createdAt))) AS avg_close_days
      FROM deals
      WHERE generated_month = $1
        AND status = 'won';
    `;

    const {
      rows: [avgClose],
    } = await query(avgCloseTimeQuery, [monthStart]);

    // 5️⃣ DEAL PIPELINE BY STAGE
    const pipelineByStageQuery = `
      SELECT stage, COUNT(*) AS count
      FROM deals
      WHERE generated_month = $1
      GROUP BY stage
      ORDER BY stage;
    `;

    const pipelineByStage = await query(pipelineByStageQuery, [monthStart]);

    // 6️⃣ TEAM PERFORMANCE (TOP 6)
    const teamPerformanceQuery = `
      SELECT 
        u.id,
        u.name,
        COUNT(d.id) AS closed_deals,
        COALESCE(SUM(d.value), 0) AS total_value
      FROM users u
      LEFT JOIN deals d 
        ON d.assignedTo = u.id
       AND d.generated_month = $1
       AND d.status = 'won'
      GROUP BY u.id
      ORDER BY total_value DESC
      LIMIT 6;
    `;

    const teamPerformance = await query(teamPerformanceQuery, [monthStart]);

    // 7️⃣ RECENT DEALS
    const recentDealsQuery = `
      SELECT 
        id,
        title,
        company,
        value,
        status,
        stage,
        assignedTo,
        createdAt
      FROM deals
      WHERE generated_month = $1
      ORDER BY createdAt DESC
      LIMIT 10;
    `;

    const recentDeals = await query(recentDealsQuery, [monthStart]);

    // FINAL RETURN
    return NextResponse.json({
      success: true,
      month: monthStart,
      metrics: {
        totalPipeline: Number(pipeline.total_pipeline),
        closedThisMonth: Number(closed.closed_value),
        targetProgress,
        avgCloseTime: Number(avgClose.avg_close_days) || 0,
      },
      pipelineByStage: pipelineByStage.rows,
      teamPerformance: teamPerformance.rows,
      recentDeals: recentDeals.rows,
    });
  } catch (err) {
    console.error("Dashboard API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
