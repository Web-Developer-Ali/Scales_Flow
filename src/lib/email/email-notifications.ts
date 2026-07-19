import {
  sendEmail,
  sendCriticalEmail,
  getEmailSettings,
} from "./email-provider";
import {
  dealWonTemplate,
  dealStalledTemplate,
  welcomeTeamMemberTemplate,
  monthlyTargetTemplate,
} from "./templates";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ── 1. Deal Won → manager (non-critical) ────────────────────────────────────
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

// ── 2. Deal Stalled → rep (non-critical) ────────────────────────────────────
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

// ── 3. Welcome new team member (CRITICAL — carries the verification OTP) ───
// This previously checked `notify_welcome_member` and silently skipped the
// send if that admin preference was off — which meant a newly created user
// could be permanently unable to verify their account. A "notify"
// preference must never gate credential delivery, so this now always
// attempts the send via the critical path (retries + provider failover),
// and returns a result the caller can react to (e.g. to roll back the OTP
// row if delivery ultimately fails).
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role: string;
  otp: string;
  createdByName: string;
}): Promise<{ success: boolean; message: string }> {
  const verificationUrl = `${BASE_URL}/otp-verification?email=${encodeURIComponent(params.email)}`;

  const { subject, html } = welcomeTeamMemberTemplate({
    name: params.name,
    role: params.role,
    email: params.email,
    otp: params.otp,
    verificationUrl,
    createdByName: params.createdByName,
  });

  const result = await sendCriticalEmail({ to: params.email, subject, html });

  if (!result.success) {
    console.error(
      `[Email] Welcome/verification email to ${params.email} failed after ${result.attempts} attempt(s):`,
      result.error,
    );
  }

  return {
    success: result.success,
    message: result.success
      ? "Welcome email sent."
      : "We couldn't send the verification email right now. Please try again in a moment.",
  };
}

// ── 4. Monthly target reminder → rep (non-critical) ─────────────────────────
export async function sendMonthlyTargetEmail(params: {
  repEmail: string;
  repName: string;
  closedDeals: number;
  totalCreated: number;
  percent: number;
  monthLabel: string;
}): Promise<boolean> {
  const settings = await getEmailSettings();
  if (!settings.notify_monthly_target) {
    console.log(
      "[Email] Monthly target notifications disabled, skipping email for",
      params.repEmail,
    );
    return false;
  }

  const { subject, html } = monthlyTargetTemplate({
    repName: params.repName,
    closedDeals: params.closedDeals,
    totalCreated: params.totalCreated,
    percent: params.percent,
    monthLabel: params.monthLabel,
    dashboardUrl: `${BASE_URL}/scales_man/dashboard`,
  });

  return await sendEmail({ to: params.repEmail, subject, html });
}

// ── OTP email ─────────────────────────────────────────────────────────────────
export { sendRegistrationOtp, sendPasswordResetOtp } from "./otp-service";
