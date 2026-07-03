// ── Shared layout wrapper ──────────────────────────────────────────────────────
function emailLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SalesFlow</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">

          <!-- Header -->
          <tr>
            <td style="background:#000000;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#ffffff;width:32px;height:32px;border-radius:6px;text-align:center;vertical-align:middle;">
                    <span style="font-size:16px;line-height:32px;">📊</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">SalesFlow</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #e5e5e5;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999999;">
                SalesFlow CRM · This is an automated notification.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Reusable parts ─────────────────────────────────────────────────────────────
function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.4px;">${text}</h1>`;
}

function subtext(text: string): string {
  return `<p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.5;">${text}</p>`;
}

function infoBox(rows: { label: string; value: string }[]): string {
  const items = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#666666;white-space:nowrap;border-bottom:1px solid #f0f0f0;">
          ${r.label}
        </td>
        <td style="padding:10px 16px;font-size:13px;color:#111111;font-weight:500;border-bottom:1px solid #f0f0f0;text-align:right;">
          ${r.value}
        </td>
      </tr>`,
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;margin-bottom:24px;overflow:hidden;">
      ${items}
    </table>`;
}

function ctaButton(text: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#000000;border-radius:6px;">
          <a href="${url}"
            style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.1px;">
            ${text} →
          </a>
        </td>
      </tr>
    </table>`;
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;background:${color}20;color:${color};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;letter-spacing:0.3px;">${text}</span>`;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}

// ── Template 1: Deal Won ───────────────────────────────────────────────────────
export function dealWonTemplate(params: {
  managerName: string;
  repName: string;
  dealTitle: string;
  company: string;
  value: number;
  dealUrl: string;
}): { subject: string; html: string } {
  const subject = `🎉 Deal Won — ${params.company} ${formatCurrency(params.value)}`;

  const html = emailLayout(
    `
    ${heading("A deal just closed! 🎉")}
    ${subtext(`${params.repName} won a new deal. Here are the details:`)}

    ${infoBox([
      { label: "Deal", value: params.dealTitle },
      { label: "Company", value: params.company },
      { label: "Value", value: formatCurrency(params.value) },
      { label: "Closed by", value: params.repName },
    ])}

    ${ctaButton("View Deal", params.dealUrl)}

    <p style="margin:0;font-size:13px;color:#999999;">
      Great work from ${params.repName}! Make sure to update the client record.
    </p>
    `,
    `${params.repName} just closed ${params.company} for ${formatCurrency(params.value)}`,
  );

  return { subject, html };
}

// ── Template 2: Deal Stalled ──────────────────────────────────────────────────
export function dealStalledTemplate(params: {
  repName: string;
  dealTitle: string;
  company: string;
  stage: string;
  daysStale: number;
  dealUrl: string;
}): { subject: string; html: string } {
  const subject = `⚠️ Deal Needs Attention — ${params.company} (${params.daysStale} days)`;

  const html = emailLayout(
    `
    ${heading("A deal needs your attention")}
    ${subtext(`This deal has been sitting in <strong>${params.stage}</strong> for <strong>${params.daysStale} days</strong> without any updates.`)}

    ${infoBox([
      { label: "Deal", value: params.dealTitle },
      { label: "Company", value: params.company },
      { label: "Stage", value: params.stage },
      { label: "Days Stale", value: `${params.daysStale} days` },
    ])}

    ${ctaButton("Update Deal Now", params.dealUrl)}

    <p style="margin:0;font-size:13px;color:#999999;">
      Deals that go untouched for too long are at risk of being lost.
      Take action to keep this one moving.
    </p>
    `,
    `${params.company} has been in ${params.stage} for ${params.daysStale} days`,
  );

  return { subject, html };
}

// ── Template 3: Welcome New Team Member ───────────────────────────────────────
export function welcomeTeamMemberTemplate(params: {
  name: string;
  role: string;
  email: string;
  otp: string;
  verificationUrl: string;
  createdByName: string;
}): { subject: string; html: string } {
  const roleLabel =
    params.role === "manager" ? "Manager" : "Sales Representative";

  const subject = `Welcome to SalesFlow, ${params.name}!`;

  const html = emailLayout(
    `
    ${heading(`Welcome, ${params.name}! 👋`)}
    ${subtext(`${params.createdByName} has added you to SalesFlow as a <strong>${roleLabel}</strong>. Verify your email to get started.`)}

    <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;color:#666666;font-weight:500;">
        YOUR VERIFICATION CODE
      </p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#111111;letter-spacing:8px;font-family:monospace;">
        ${params.otp}
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#999999;">
        This code expires in 24 hours
      </p>
    </div>

    ${ctaButton("Verify Email & Get Started", params.verificationUrl)}

    ${infoBox([
      { label: "Email", value: params.email },
      { label: "Role", value: roleLabel },
      { label: "Added by", value: params.createdByName },
    ])}

    <p style="margin:0;font-size:13px;color:#999999;">
      If you weren't expecting this invitation, you can safely ignore this email.
    </p>
    `,
    `You've been added to SalesFlow as ${roleLabel}`,
  );

  return { subject, html };
}

// ── Template 4: Monthly Target Reminder ───────────────────────────────────────
export function monthlyTargetTemplate(params: {
  repName: string;
  closedDeals: number;
  totalCreated: number;
  percent: number;
  monthLabel: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const isOnTrack = params.percent >= 50;
  const subject = `${isOnTrack ? "🎯" : "📊"} ${params.monthLabel} Target Update — ${params.percent}% closed`;

  const html = emailLayout(
    `
    ${heading(`${params.monthLabel} Performance Check-in`)}
    ${subtext(
      isOnTrack
        ? `Great progress, ${params.repName}! You're on track this month. Keep pushing!`
        : `Hey ${params.repName}, here's how your ${params.monthLabel} is looking so far.`,
    )}

    <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#666666;font-weight:500;">DEALS CLOSED THIS MONTH</p>
      <p style="margin:0 0 16px;font-size:40px;font-weight:700;color:#111111;line-height:1;">
        ${params.closedDeals}
        <span style="font-size:20px;color:#999999;font-weight:400;">/ ${params.totalCreated}</span>
      </p>

      <!-- Progress bar -->
      <div style="background:#e5e5e5;border-radius:99px;height:8px;overflow:hidden;margin-bottom:8px;">
        <div style="background:${isOnTrack ? "#10b981" : "#f59e0b"};width:${Math.min(params.percent, 100)}%;height:100%;border-radius:99px;"></div>
      </div>
      <p style="margin:0;font-size:13px;color:${isOnTrack ? "#10b981" : "#f59e0b"};font-weight:600;">
        ${params.percent}% close rate this month
      </p>
    </div>

    ${ctaButton("View My Pipeline", params.dashboardUrl)}

    <p style="margin:0;font-size:13px;color:#999999;">
      ${
        isOnTrack
          ? "You're doing great. Stay focused and close out the month strong!"
          : "There's still time to push more deals through the pipeline. Log in and take action."
      }
    </p>
    `,
    `${params.closedDeals}/${params.totalCreated} deals closed — ${params.percent}% this month`,
  );

  return { subject, html };
}
