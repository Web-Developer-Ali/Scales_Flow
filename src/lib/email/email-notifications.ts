import { sendEmail, getEmailSettings } from "./email-provider";
import {
  dealWonTemplate,
  dealStalledTemplate,
  welcomeTeamMemberTemplate,
  monthlyTargetTemplate,
} from "./templates";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ── 1. Deal Won → manager ─────────────────────────────────────────────────────
export async function sendDealWonEmail(params: {
  managerEmail: string;
  managerName: string;
  repName: string;
  dealTitle: string;
  company: string;
  value: number;
  dealId: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.notify_deal_won) return;

  const { subject, html } = dealWonTemplate({
    managerName: params.managerName,
    repName: params.repName,
    dealTitle: params.dealTitle,
    company: params.company,
    value: params.value,
    dealUrl: `${BASE_URL}/scales_man/deal_details/${params.dealId}`,
  });

  await sendEmail({ to: params.managerEmail, subject, html });
}

// ── 2. Deal Stalled → rep ─────────────────────────────────────────────────────
export async function sendDealStalledEmail(params: {
  repEmail: string;
  repName: string;
  dealTitle: string;
  company: string;
  stage: string;
  daysStale: number;
  dealId: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.notify_deal_stalled) return;

  const { subject, html } = dealStalledTemplate({
    repName: params.repName,
    dealTitle: params.dealTitle,
    company: params.company,
    stage: params.stage,
    daysStale: params.daysStale,
    dealUrl: `${BASE_URL}/scales_man/deal_details/${params.dealId}`,
  });

  await sendEmail({ to: params.repEmail, subject, html });
}

// ── 3. Welcome new team member ────────────────────────────────────────────────
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role: string;
  otp: string;
  createdByName: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.notify_welcome_member) return;

  const verificationUrl = `${BASE_URL}/otp-verification?email=${encodeURIComponent(params.email)}`;

  const { subject, html } = welcomeTeamMemberTemplate({
    name: params.name,
    role: params.role,
    email: params.email,
    otp: params.otp,
    verificationUrl,
    createdByName: params.createdByName,
  });

  await sendEmail({ to: params.email, subject, html });
}

// ── 4. Monthly target reminder → rep ─────────────────────────────────────────
export async function sendMonthlyTargetEmail(params: {
  repEmail: string;
  repName: string;
  closedDeals: number;
  totalCreated: number;
  percent: number;
  monthLabel: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.notify_monthly_target) return;

  const { subject, html } = monthlyTargetTemplate({
    repName: params.repName,
    closedDeals: params.closedDeals,
    totalCreated: params.totalCreated,
    percent: params.percent,
    monthLabel: params.monthLabel,
    dashboardUrl: `${BASE_URL}/scales_man/dashboard`,
  });

  await sendEmail({ to: params.repEmail, subject, html });
}

// ── OTP email: always uses nodemailer directly ────────────────────────────────
// OTP is critical — it bypasses the enabled toggle so
// new users can always verify even if notifications are off
export { sendRegistrationOtp } from "./otp-service";
