import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendMonthlyTargetEmail } from "@/lib/email/email-notifications";
import { notifyMonthlyTarget } from "@/lib/notifications";

// Run this on the 15th of each month (mid-month check-in)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const monthLabel = now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
    .toISOString()
    .substring(0, 10);

  try {
    // Get all active reps with their current month stats
    const { rows: reps } = await query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(d.id)                                AS total_created,
        COUNT(d.id) FILTER (WHERE d.status = 'won') AS closed_deals
      FROM users u
      LEFT JOIN deals d
        ON d.assigned_to    = u.id
        AND d.generated_month = $1
      WHERE u.role      = 'scales_man'
        AND u.is_active = true
        AND u.email IS NOT NULL
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(d.id) > 0   -- only reps who have at least one deal this month
    `,
      [monthStart],
    );

    let notified = 0;

    for (const rep of reps) {
      const closedDeals = Number(rep.closed_deals);
      const totalCreated = Number(rep.total_created);
      const percent =
        totalCreated > 0 ? Math.round((closedDeals / totalCreated) * 100) : 0;

      // In-app notification
      await notifyMonthlyTarget({
        repId: rep.id,
        closedDeals,
        totalCreated,
        percent,
      });

      // Email notification
      await sendMonthlyTargetEmail({
        repEmail: rep.email,
        repName: rep.name,
        closedDeals,
        totalCreated,
        percent,
        monthLabel,
      });

      notified++;
    }

    return NextResponse.json({
      success: true,
      month: monthLabel,
      notified,
    });
  } catch (err) {
    console.error("Monthly Target Cron Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
