import { sendEmail } from "./send-email";
import {
  dealWonTemplate,
  dealStalledTemplate,
  welcomeTeamMemberTemplate,
  monthlyTargetTemplate,
} from "./templates";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ── 1. Deal Won → notify manager ──────────────────────────────────────────────
export async function sendDealWonEmail(params: {
  managerEmail: string;
  managerName: string;
  repName: string;
  dealTitle: string;
  company: string;
  value: number;
  dealId: string;
}) {
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

// ── 2. Deal Stalled → notify rep ─────────────────────────────────────────────
export async function sendDealStalledEmail(params: {
  repEmail: string;
  repName: string;
  dealTitle: string;
  company: string;
  stage: string;
  daysStale: number;
  dealId: string;
}) {
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

// ── 3. New team member → welcome email ────────────────────────────────────────
// This replaces / extends your existing sendRegistrationOtp
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role: string;
  otp: string;
  createdByName: string;
}) {
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
