import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { sendEmail } from "@/lib/email/email-provider";

// ── GET: fetch current settings ───────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { rows } = await query(`SELECT * FROM email_settings LIMIT 1`);
    const settings = rows[0] ?? null;

    // Never return smtp_password or resend_api_key to the client
    // Return masked versions so UI can show "configured" without exposing secrets
    if (settings) {
      return NextResponse.json({
        success: true,
        settings: {
          ...settings,
          smtp_password: settings.smtp_password ? "••••••••" : null,
          resend_api_key: settings.resend_api_key ? "••••••••" : null,
        },
      });
    }

    return NextResponse.json({ success: true, settings: null });
  } catch (err) {
    console.error("Email Settings GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── PATCH: update settings ────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      enabled,
      provider,
      smtp_service,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_from,
      resend_api_key,
      resend_from,
      notify_deal_won,
      notify_deal_stalled,
      notify_monthly_target,
      notify_welcome_member,
    } = body;

    // Validate provider
    if (provider && !["nodemailer", "resend"].includes(provider)) {
      return NextResponse.json(
        { success: false, error: "Invalid provider" },
        { status: 400 },
      );
    }

    // Build update — only update fields that were sent
    // If smtp_password is "••••••••" (masked), skip it to preserve the existing value
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fields: Record<string, unknown> = {
      enabled,
      provider,
      smtp_service,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_from,
      resend_from,
      notify_deal_won,
      notify_deal_stalled,
      notify_monthly_target,
      notify_welcome_member,
    };

    // Only update password if a real value was sent (not the masked placeholder)
    if (smtp_password && smtp_password !== "••••••••") {
      fields.smtp_password = smtp_password;
    }
    if (resend_api_key && resend_api_key !== "••••••••") {
      fields.resend_api_key = resend_api_key;
    }

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        updates.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (!updates.length) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    // Add updated_by and updated_at
    updates.push(`updated_at = NOW()`, `updated_by = $${idx}`);
    values.push(session.user.id);

    await query(`UPDATE email_settings SET ${updates.join(", ")}`, values);

    return NextResponse.json({
      success: true,
      message: "Email settings saved",
    });
  } catch (err) {
    console.error("Email Settings PATCH Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── POST: send test email ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { testEmail } = await req.json();

    if (!testEmail?.trim()) {
      return NextResponse.json(
        { success: false, error: "testEmail is required" },
        { status: 400 },
      );
    }

    const ok = await sendEmail({
      to: testEmail,
      subject: "✅ SalesFlow — Email Test",
      html: `
        <div style="font-family:sans-serif;padding:32px;">
          <h2 style="color:#111;">Email is working! ✅</h2>
          <p style="color:#666;">Your SalesFlow email notifications are configured correctly.</p>
        </div>
      `,
    });

    if (ok) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail}`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to send test email. Check your credentials and try again.",
        },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("Test Email Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
