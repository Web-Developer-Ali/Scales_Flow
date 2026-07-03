import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendDealStalledEmail } from "@/lib/email/email-notifications";
import { notifyDealStalled } from "@/lib/notifications";

// Protect with a secret so only your cron job can call it
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all active deals not updated in 7+ days
    // that haven't already received a stall notification today
    const { rows: stalledDeals } = await query(`
      SELECT
        d.id,
        d.title,
        d.company,
        d.stage::text,
        d.probability,
        ROUND(
          EXTRACT(EPOCH FROM (NOW() - d.updated_at)) / 86400.0
        ) AS days_stale,
        d.assigned_to,
        u.name  AS rep_name,
        u.email AS rep_email
      FROM deals d
      LEFT JOIN users u ON d.assigned_to = u.id
      WHERE d.status      = 'active'
        AND d.updated_at  < NOW() - INTERVAL '7 days'
        AND u.is_active   = true
        AND u.email IS NOT NULL
        -- Don't re-notify if we already sent one in the last 7 days
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.entity_id   = d.id
            AND n.type        = 'deal_stalled'
            AND n.created_at  > NOW() - INTERVAL '7 days'
        )
      ORDER BY days_stale DESC
    `);

    let notified = 0;

    for (const deal of stalledDeals) {
      const daysStale = Number(deal.days_stale);

      // In-app notification
      await notifyDealStalled({
        repId: deal.assigned_to,
        dealTitle: deal.title,
        dealId: deal.id,
        daysStale,
        stage: deal.stage,
      });

      // Email notification
      await sendDealStalledEmail({
        repEmail: deal.rep_email,
        repName: deal.rep_name,
        dealTitle: deal.title,
        company: deal.company,
        stage: deal.stage,
        daysStale,
        dealId: deal.id,
      });

      notified++;
    }

    return NextResponse.json({
      success: true,
      checked: stalledDeals.length,
      notified,
    });
  } catch (err) {
    console.error("Stalled Deal Cron Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
