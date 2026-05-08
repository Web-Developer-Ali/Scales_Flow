import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const USER_ID = "68095286-eebd-4618-bd0c-0514403f7825";

export async function GET() {
  // 🔐 DEV ONLY API
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        success: false,
        error: "Not allowed in production",
      },
      { status: 403 },
    );
  }

  try {
    // ================================
    // USER INFO
    // ================================
    const userResult = await query(
      `
      SELECT
        id,
        name,
        email,
        role,
        company_name,
        created_at
      FROM users
      WHERE id = $1
      `,
      [USER_ID],
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    const user = userResult.rows[0];

    // ================================
    // TOTAL DEALS
    // ================================
    const totalDealsResult = await query(
      `
      SELECT COUNT(*) AS total_deals
      FROM deals
      WHERE assigned_to = $1
      `,
      [USER_ID],
    );

    // ================================
    // WON DEALS
    // ================================
    const wonDealsResult = await query(
      `
      SELECT
        COUNT(*) AS won_deals,
        COALESCE(SUM(value), 0) AS won_value
      FROM deals
      WHERE assigned_to = $1
        AND status = 'won'
      `,
      [USER_ID],
    );

    // ================================
    // LOST DEALS
    // ================================
    const lostDealsResult = await query(
      `
      SELECT
        COUNT(*) AS lost_deals,
        COALESCE(SUM(value), 0) AS lost_value
      FROM deals
      WHERE assigned_to = $1
        AND status = 'lost'
      `,
      [USER_ID],
    );

    // ================================
    // ACTIVE DEALS
    // ================================
    const activeDealsResult = await query(
      `
      SELECT
        COUNT(*) AS active_deals,
        COALESCE(SUM(value), 0) AS active_value
      FROM deals
      WHERE assigned_to = $1
        AND status = 'active'
      `,
      [USER_ID],
    );

    // ================================
    // DEALS BY STAGE
    // ================================
    const stageBreakdownResult = await query(
      `
      SELECT
        stage,
        COUNT(*) AS count,
        COALESCE(SUM(value), 0) AS total_value
      FROM deals
      WHERE assigned_to = $1
      GROUP BY stage
      ORDER BY count DESC
      `,
      [USER_ID],
    );

    // ================================
    // MONTHLY PERFORMANCE
    // ================================
    const monthlyPerformanceResult = await query(
      `
      SELECT
        generated_month,
        COUNT(*) AS total_deals,
        COALESCE(SUM(value), 0) AS total_value,
        COUNT(*) FILTER (WHERE status = 'won') AS won_deals,
        COUNT(*) FILTER (WHERE status = 'lost') AS lost_deals
      FROM deals
      WHERE assigned_to = $1
      GROUP BY generated_month
      ORDER BY generated_month DESC
      `,
      [USER_ID],
    );

    // ================================
    // RECENT DEALS
    // ================================
    const recentDealsResult = await query(
      `
      SELECT
        id,
        title,
        company,
        value,
        currency,
        status,
        stage,
        probability,
        expected_close_date,
        created_at,
        updated_at
      FROM deals
      WHERE assigned_to = $1
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [USER_ID],
    );

    // ================================
    // AVG CLOSE TIME
    // ================================
    const avgCloseTimeResult = await query(
      `
      SELECT
        AVG(EXTRACT(DAY FROM (updated_at - created_at)))
          AS avg_close_days
      FROM deals
      WHERE assigned_to = $1
        AND status = 'won'
      `,
      [USER_ID],
    );

    // ================================
    // BIGGEST DEAL
    // ================================
    const biggestDealResult = await query(
      `
      SELECT
        id,
        title,
        company,
        value,
        status,
        stage
      FROM deals
      WHERE assigned_to = $1
      ORDER BY value DESC
      LIMIT 1
      `,
      [USER_ID],
    );

    return NextResponse.json({
      success: true,

      user,

      metrics: {
        totalDeals: Number(totalDealsResult.rows[0]?.total_deals || 0),

        wonDeals: Number(wonDealsResult.rows[0]?.won_deals || 0),

        wonValue: Number(wonDealsResult.rows[0]?.won_value || 0),

        lostDeals: Number(lostDealsResult.rows[0]?.lost_deals || 0),

        lostValue: Number(lostDealsResult.rows[0]?.lost_value || 0),

        activeDeals: Number(activeDealsResult.rows[0]?.active_deals || 0),

        activeValue: Number(activeDealsResult.rows[0]?.active_value || 0),

        avgCloseDays: Math.round(
          Number(avgCloseTimeResult.rows[0]?.avg_close_days || 0),
        ),
      },

      biggestDeal: biggestDealResult.rows[0] || null,

      stageBreakdown: stageBreakdownResult.rows,

      monthlyPerformance: monthlyPerformanceResult.rows,

      recentDeals: recentDealsResult.rows,
    });
  } catch (err) {
    console.error("User Analytics API Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
