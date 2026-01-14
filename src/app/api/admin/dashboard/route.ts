import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Optional filters (user-controlled)
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");

    const data = await withTransaction(async (client) => {
      // SAFE dynamic filtering
      const conditions = [];
      const params = [];
      let count = 1;

      if (stage) {
        conditions.push(`d.stage = $${count++}`);
        params.push(stage);
      }
      if (status) {
        conditions.push(`d.status = $${count++}`);
        params.push(status);
      }

      const whereClause = conditions.length
        ? "AND " + conditions.join(" AND ")
        : "";

      // TOP SALES REPS SAFE QUERY
      const topSalesRepsQuery = `
        SELECT 
          u.id,
          u.name,
          COUNT(d.id) AS total_deals,
          SUM(d.amount) AS total_amount
        FROM deals d
        JOIN users u ON u.id = d.sales_rep_id
        WHERE d.created_at >= date_trunc('month', CURRENT_DATE)
          AND d.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
          ${whereClause}
        GROUP BY u.id, u.name
        ORDER BY total_amount DESC
        LIMIT 6;
      `;

      const topSalesReps = await client.query(topSalesRepsQuery, params);

      // RECENT DEALS SAFE QUERY
      const recentDealsQuery = `
        SELECT 
          d.id,
          d.title,
          d.amount,
          d.stage,
          d.status,
          d.created_at,
          u.name as owner
        FROM deals d
        JOIN users u ON u.id = d.sales_rep_id
        WHERE d.created_at >= date_trunc('month', CURRENT_DATE)
          AND d.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
          ${whereClause}
        ORDER BY d.created_at DESC
        LIMIT 10;
      `;

      const recentDeals = await client.query(recentDealsQuery, params);

      return {
        topSalesReps: topSalesReps.rows,
        recentDeals: recentDeals.rows,
      };
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
