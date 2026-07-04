import nodemailer from "nodemailer";
import { query } from "@/lib/db";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export interface EmailSettings {
  enabled: boolean;
  provider: "nodemailer" | "resend";
  smtp_service: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from: string | null;
  resend_api_key: string | null;
  resend_from: string | null;
  notify_deal_won: boolean;
  notify_deal_stalled: boolean;
  notify_monthly_target: boolean;
  notify_welcome_member: boolean;
}

// ── Settings loader ────────────────────────────────────────────────────────────
// Priority: DB settings → ENV variables → disabled
// This means:
//   1. If admin has configured settings in DB, use those
//   2. If not, fall back to .env (for self-hosted / dev use)
//   3. If neither, email is disabled

export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const { rows } = await query(`SELECT * FROM email_settings LIMIT 1`);

    if (rows.length && rows[0].enabled) {
      // DB settings take priority — admin configured these in the UI
      return rows[0] as EmailSettings;
    }
  } catch {
    // DB not available or table doesn't exist yet — fall through to ENV
  }

  // Fall back to environment variables
  // This is the zero-config path for self-hosters and local dev
  return buildSettingsFromEnv();
}

function buildSettingsFromEnv(): EmailSettings {
  const provider = (process.env.EMAIL_PROVIDER ?? "nodemailer") as
    | "nodemailer"
    | "resend";

  const enabled =
    provider === "nodemailer"
      ? !!(process.env.GMAIL_USER && process.env.GMAIL_PASSWORD)
      : !!process.env.RESEND_API_KEY;

  return {
    enabled,
    provider,

    // Nodemailer / Gmail
    smtp_service: process.env.SMTP_SERVICE ?? "gmail",
    smtp_host: process.env.SMTP_HOST ?? null,
    smtp_port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : null,
    smtp_user: process.env.GMAIL_USER ?? process.env.SMTP_USER ?? null,
    smtp_password: process.env.GMAIL_PASSWORD ?? process.env.SMTP_PASS ?? null,
    smtp_from:
      process.env.SMTP_FROM ??
      `SalesFlow <${process.env.GMAIL_USER ?? "no-reply@salesflow.com"}>`,

    // Resend
    resend_api_key: process.env.RESEND_API_KEY ?? null,
    resend_from:
      process.env.RESEND_FROM ?? "SalesFlow <notifications@yourdomain.com>",

    // All notification types on by default when env-configured
    notify_deal_won: true,
    notify_deal_stalled: true,
    notify_monthly_target: true,
    notify_welcome_member: true,
  };
}

// ── Core send function ─────────────────────────────────────────────────────────
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const settings = await getEmailSettings();

  if (!settings.enabled) {
    console.log("[Email] Disabled — skipping:", payload.subject);
    return false;
  }

  try {
    if (settings.provider === "resend") {
      return await sendViaResend(payload, settings);
    } else {
      return await sendViaNodemailer(payload, settings);
    }
  } catch (err) {
    // Email is always non-critical — log but never throw
    console.error("[Email] Send failed:", err);
    return false;
  }
}

// ── Nodemailer (Gmail or custom SMTP) ─────────────────────────────────────────
async function sendViaNodemailer(
  payload: EmailPayload,
  settings: EmailSettings,
): Promise<boolean> {
  if (!settings.smtp_user || !settings.smtp_password) {
    console.warn("[Email] Nodemailer: missing credentials");
    return false;
  }

  const transportConfig =
    settings.smtp_service === "gmail"
      ? {
          service: "gmail",
          auth: {
            user: settings.smtp_user,
            pass: settings.smtp_password,
          },
        }
      : {
          // Custom SMTP (SendGrid, Mailgun, self-hosted, etc.)
          host: settings.smtp_host!,
          port: settings.smtp_port ?? 587,
          secure: (settings.smtp_port ?? 587) === 465,
          auth: {
            user: settings.smtp_user,
            pass: settings.smtp_password,
          },
        };

  const transporter = nodemailer.createTransport(transportConfig);

  await transporter.sendMail({
    from: settings.smtp_from ?? settings.smtp_user,
    to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  console.log("[Email] Sent via Nodemailer:", payload.subject);
  return true;
}

// ── Resend ─────────────────────────────────────────────────────────────────────
async function sendViaResend(
  payload: EmailPayload,
  settings: EmailSettings,
): Promise<boolean> {
  if (!settings.resend_api_key) {
    console.warn("[Email] Resend: missing API key");
    return false;
  }

  // Dynamic import — Resend is optional dependency
  const { Resend } = await import("resend");
  const resend = new Resend(settings.resend_api_key);

  const { error } = await resend.emails.send({
    from: settings.resend_from ?? "SalesFlow <onboarding@resend.dev>",
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
  });

  if (error) {
    console.error("[Email] Resend error:", error);
    return false;
  }

  console.log("[Email] Sent via Resend:", payload.subject);
  return true;
}
