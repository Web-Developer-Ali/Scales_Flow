import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { query } from "@/lib/db";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export type EmailProviderName = "nodemailer" | "resend";

export interface EmailSettings {
  enabled: boolean; // admin's "send notifications" master toggle (non-critical mail only)
  configured: boolean; // true if we actually have usable credentials for at least one provider
  provider: EmailProviderName; // preferred/primary provider
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

export interface SendResult {
  success: boolean;
  provider?: EmailProviderName;
  attempts: number;
  error?: string;
}

// Shape of a row from the `email_settings` table. It's a superset of
// EmailSettings (e.g. it also has `id`, timestamps, etc. we don't care
// about), so we type it as a partial overlay rather than `any`.
type EmailSettingsRow = Partial<EmailSettings> & Record<string, unknown>;

// ── Settings loader ────────────────────────────────────────────────────────────
// Priority: DB credentials → ENV credentials → not configured.
//
// IMPORTANT: `enabled` (the admin's notification on/off toggle) and
// `configured` (do we actually have usable credentials) are now separate.
// Previously, if an admin flipped the DB "enabled" switch off, the app fell
// back to ENV entirely and ignored valid DB credentials — which meant a
// notification preference could silently break critical mail (OTP, password
// resets). `configured` is computed independent of that toggle so critical
// sends can always use whatever credentials actually exist.

const SETTINGS_CACHE_TTL_MS = 30_000;
let settingsCache: { value: EmailSettings; expiresAt: number } | null = null;

export async function getEmailSettings(
  forceRefresh = false,
): Promise<EmailSettings> {
  if (!forceRefresh && settingsCache && settingsCache.expiresAt > Date.now()) {
    return settingsCache.value;
  }
  const settings = await loadEmailSettings();
  settingsCache = {
    value: settings,
    expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
  };
  return settings;
}

// Call this after an admin updates email settings via the UI so the next
// send doesn't use a stale cached config.
export function invalidateEmailSettingsCache(): void {
  settingsCache = null;
}

async function loadEmailSettings(): Promise<EmailSettings> {
  let dbRow: EmailSettingsRow | null = null;
  try {
    const { rows } = await query(`SELECT * FROM email_settings LIMIT 1`);
    if (rows.length) dbRow = rows[0] as EmailSettingsRow;
  } catch {
    // DB not available or table doesn't exist yet — fall through to ENV
  }

  const envSettings = buildSettingsFromEnv();

  const dbHasCreds =
    dbRow && ((dbRow.smtp_user && dbRow.smtp_password) || dbRow.resend_api_key);

  // Prefer DB-configured credentials whenever they exist, even if the
  // admin's notification toggle is off.
  const merged: EmailSettings = dbHasCreds
    ? { ...envSettings, ...dbRow }
    : envSettings;

  const smtpConfigured = !!(merged.smtp_user && merged.smtp_password);
  const resendConfigured = !!merged.resend_api_key;

  return {
    ...merged,
    enabled: dbRow ? !!dbRow.enabled : envSettings.enabled,
    configured: smtpConfigured || resendConfigured,
  };
}

function buildSettingsFromEnv(): EmailSettings {
  const provider = (process.env.EMAIL_PROVIDER ??
    "nodemailer") as EmailProviderName;

  const smtp_user = process.env.GMAIL_USER ?? process.env.SMTP_USER ?? null;
  const smtp_password =
    process.env.GMAIL_PASSWORD ?? process.env.SMTP_PASS ?? null;
  const resend_api_key = process.env.RESEND_API_KEY ?? null;

  return {
    enabled:
      provider === "nodemailer"
        ? !!(smtp_user && smtp_password)
        : !!resend_api_key,
    configured: !!(smtp_user && smtp_password) || !!resend_api_key,
    provider,

    smtp_service: process.env.SMTP_SERVICE ?? "gmail",
    smtp_host: process.env.SMTP_HOST ?? null,
    smtp_port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : null,
    smtp_user,
    smtp_password,
    smtp_from:
      process.env.SMTP_FROM ??
      `SalesFlow <${smtp_user ?? "no-reply@salesflow.com"}>`,

    resend_api_key,
    resend_from:
      process.env.RESEND_FROM ?? "SalesFlow <notifications@yourdomain.com>",

    notify_deal_won: true,
    notify_deal_stalled: true,
    notify_monthly_target: true,
    notify_welcome_member: true,
  };
}

// ── Retry / timeout machinery ───────────────────────────────────────────────────
const DEFAULT_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [500, 1500, 4000]; // backoff schedule between attempts

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

// Minimal shape we care about from a thrown error, without assuming it's
// an actual Error instance (nodemailer/Resend errors sometimes attach a
// `code` field that isn't part of the standard Error type).
interface ErrorLike {
  message?: unknown;
  code?: unknown;
  name?: unknown;
}

function isErrorLike(err: unknown): err is ErrorLike {
  return typeof err === "object" && err !== null;
}

// Different libraries surface an error "kind" under different fields —
// nodemailer generally uses `code` (e.g. "EAUTH", "ETIMEDOUT"), the Resend
// SDK uses `name` (e.g. "validation_error"). We normalize to whichever is
// present so downstream logic doesn't need to know which library threw.
function getErrorDetails(err: unknown): { message: string; code: string } {
  if (isErrorLike(err)) {
    const message = typeof err.message === "string" ? err.message : String(err);
    const code =
      typeof err.code === "string"
        ? err.code
        : typeof err.name === "string"
          ? err.name
          : "";
    return { message, code };
  }
  return { message: String(err), code: "" };
}

// Auth/config problems won't be fixed by retrying — fail fast on those so we
// don't burn attempts (and delay the user) on a doomed send. Everything else
// (timeouts, connection resets, 5xx, rate limits) is treated as transient.
function isRetryableError(err: unknown): boolean {
  const { message, code } = getErrorDetails(err);
  const msg = message.toLowerCase();
  const codeLower = code.toLowerCase();

  const nonRetryableHints = [
    "missing credentials",
    "missing api key",
    "invalid login",
    "invalid api key",
    "eauth",
    "401",
    "403",
  ];
  if (nonRetryableHints.some((h) => msg.includes(h) || codeLower.includes(h)))
    return false;

  return true;
}

// ── Provider senders (throw on failure so the retry wrapper can react) ─────────
async function sendViaNodemailer(
  payload: EmailPayload,
  settings: EmailSettings,
): Promise<void> {
  if (!settings.smtp_user || !settings.smtp_password) {
    throw Object.assign(new Error("Nodemailer: missing credentials"), {
      code: "EAUTH",
    });
  }

  const transportConfig: SMTPTransport.Options =
    settings.smtp_service === "gmail"
      ? {
          service: "gmail",
          auth: { user: settings.smtp_user, pass: settings.smtp_password },
        }
      : {
          host: settings.smtp_host!,
          port: settings.smtp_port ?? 587,
          secure: (settings.smtp_port ?? 587) === 465,
          auth: { user: settings.smtp_user, pass: settings.smtp_password },
          connectionTimeout: DEFAULT_TIMEOUT_MS,
          socketTimeout: DEFAULT_TIMEOUT_MS,
        };

  const transporter = nodemailer.createTransport(transportConfig);

  await withTimeout(
    transporter.sendMail({
      from: settings.smtp_from ?? settings.smtp_user,
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
    DEFAULT_TIMEOUT_MS,
    "Nodemailer send",
  );
}

async function sendViaResend(
  payload: EmailPayload,
  settings: EmailSettings,
): Promise<void> {
  if (!settings.resend_api_key) {
    throw Object.assign(new Error("Resend: missing API key"), {
      code: "EAUTH",
    });
  }

  const { Resend } = await import("resend");
  const resend = new Resend(settings.resend_api_key);

  const { error } = await withTimeout(
    resend.emails.send({
      from: settings.resend_from ?? "SalesFlow <onboarding@resend.dev>",
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
    DEFAULT_TIMEOUT_MS,
    "Resend send",
  );

  if (error) {
    // The Resend SDK's error type varies by version; treat it as an
    // ErrorLike rather than assuming a specific shape.
    const { message, code } = getErrorDetails(error);
    throw Object.assign(new Error(message || "Resend API error"), {
      code: code || "RESEND_ERROR",
    });
  }
}

async function sendViaProvider(
  provider: EmailProviderName,
  payload: EmailPayload,
  settings: EmailSettings,
): Promise<void> {
  return provider === "resend"
    ? sendViaResend(payload, settings)
    : sendViaNodemailer(payload, settings);
}

function getAvailableProviders(settings: EmailSettings): EmailProviderName[] {
  const smtpOk = !!(settings.smtp_user && settings.smtp_password);
  const resendOk = !!settings.resend_api_key;

  const providers: EmailProviderName[] = [];
  const ordered: EmailProviderName[] =
    settings.provider === "resend"
      ? ["resend", "nodemailer"]
      : ["nodemailer", "resend"];

  for (const p of ordered) {
    if (p === "nodemailer" && smtpOk) providers.push(p);
    if (p === "resend" && resendOk) providers.push(p);
  }
  return providers;
}

interface SendOptions {
  maxAttemptsPerProvider: number;
  allowFailover: boolean;
}

async function sendWithRetryAndFailover(
  payload: EmailPayload,
  settings: EmailSettings,
  opts: SendOptions,
): Promise<SendResult> {
  const providers = getAvailableProviders(settings);
  if (!providers.length) {
    return {
      success: false,
      attempts: 0,
      error: "No email provider configured",
    };
  }

  const providersToTry = opts.allowFailover ? providers : providers.slice(0, 1);
  let totalAttempts = 0;
  let lastError = "";

  for (const provider of providersToTry) {
    for (let attempt = 1; attempt <= opts.maxAttemptsPerProvider; attempt++) {
      totalAttempts++;
      try {
        await sendViaProvider(provider, payload, settings);
        console.log(
          `[Email] Sent via ${provider} (attempt ${attempt}) — "${payload.subject}"`,
        );
        return { success: true, provider, attempts: totalAttempts };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(
          `[Email] ${provider} attempt ${attempt}/${opts.maxAttemptsPerProvider} failed for "${payload.subject}":`,
          lastError,
        );

        const retryable = isRetryableError(err);
        if (!retryable || attempt === opts.maxAttemptsPerProvider) break;

        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 4000);
      }
    }
    // exhausted this provider — loop tries the next one if failover is allowed
  }

  return {
    success: false,
    attempts: totalAttempts,
    error: lastError || "Unknown send failure",
  };
}

// ── Public send functions ───────────────────────────────────────────────────────

// Non-critical notifications (deal won, deal stalled, monthly target, etc).
// Respects the admin's "enabled" toggle. Light retry, no provider failover —
// losing one of these isn't a broken user flow, it's a missed nice-to-have.
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const settings = await getEmailSettings();

  if (!settings.enabled) {
    console.log("[Email] Notifications disabled — skipping:", payload.subject);
    return false;
  }

  const result = await sendWithRetryAndFailover(payload, settings, {
    maxAttemptsPerProvider: 2,
    allowFailover: false,
  });

  return result.success;
}

// Critical mail: OTPs, password resets, welcome/invite emails carrying a
// verification code. This deliberately IGNORES the admin notification
// toggle — only whether mail is actually configured — and retries hard
// with failover to a second provider if one is available. A user being
// unable to verify their account or reset their password is a broken
// product, not a missed notification.
export async function sendCriticalEmail(
  payload: EmailPayload,
): Promise<SendResult> {
  const settings = await getEmailSettings();

  if (!settings.configured) {
    console.error(
      "[Email] CRITICAL send blocked — no provider configured:",
      payload.subject,
    );
    return {
      success: false,
      attempts: 0,
      error: "Email delivery is not configured.",
    };
  }

  return sendWithRetryAndFailover(payload, settings, {
    maxAttemptsPerProvider: 4,
    allowFailover: true,
  });
}
