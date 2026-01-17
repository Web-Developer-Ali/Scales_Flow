import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET(req: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // // check user role
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);

    // Pagination
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 10;
    const offset = (page - 1) * limit;

    // Base monthly filter
    const monthFilter = `
      generated_month = date_trunc('month', CURRENT_DATE)::date
    `;

    // 1️⃣ Fetch paginated deals
    const dealsSql = `
      SELECT 
        id,
        title,
        company,
        assignedTo,
        value,
        probability,
        expectedCloseDate,
        stage,
        status
      FROM deals
      WHERE ${monthFilter}
      ORDER BY createdAt DESC
      LIMIT $1 OFFSET $2;
    `;

    // 2️⃣ Fetch total deals count
    const totalSql = `
      SELECT COUNT(*) AS total
      FROM deals
      WHERE ${monthFilter};
    `;

    // 3️⃣ Fetch header metrics in *one optimized query*
    const metricsSql = `
      SELECT 
        COUNT(*) AS total_deals,
        SUM(CASE WHEN status != 'won' THEN value ELSE 0 END) AS pipeline_value,
        SUM(CASE WHEN status = 'won' THEN value ELSE 0 END) AS closed_value,
        AVG(probability) AS avg_probability
      FROM deals
      WHERE ${monthFilter};
    `;

    // Execute in parallel
    const [dealsResult, totalResult, metricsResult] = await Promise.all([
      query(dealsSql, [limit, offset]),
      query(totalSql),
      query(metricsSql),
    ]);

    const total = parseInt(totalResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    const metrics = metricsResult.rows[0];

    return NextResponse.json({
      success: true,
      page,
      totalPages,
      totalDeals: metrics.total_deals || 0,
      pipelineValue: metrics.pipeline_value || 0,
      closedValue: metrics.closed_value || 0,
      avgProbability: metrics.avg_probability || 0,
      deals: dealsResult.rows,
    });
  } catch (error) {
    console.error("Monthly Deals API Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
