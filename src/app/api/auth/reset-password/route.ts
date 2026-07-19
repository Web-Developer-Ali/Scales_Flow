import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, newPassword, forced } = body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // ── Branch: forced reset (admin-created user, already verified) ────────
    if (forced) {
      return await handleForcedReset(newPassword);
    }

    // ── Branch: standard forgot-password reset (requires OTP) ─────────────
    if (!email?.trim() || !otp?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email and reset code are required." },
        { status: 400 },
      );
    }

    return await handleOtpReset(email.trim(), otp.trim(), newPassword);
  } catch (err) {
    console.error("Reset Password Error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

// ── Forced reset: user is authenticated, just update their password ───────────
async function handleForcedReset(newPassword: string) {
  // User must be logged in for forced reset
  // We get their identity from the session — no OTP needed
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Session expired. Please log in again.",
      },
      { status: 401 },
    );
  }

  // Verify this user actually has a forced reset pending
  // Prevents any logged-in user from hitting this endpoint
  const { rows } = await query(
    `SELECT id, must_reset_password FROM users WHERE id = $1`,
    [session.user.id],
  );

  if (!rows.length) {
    return NextResponse.json(
      { success: false, message: "User not found." },
      { status: 404 },
    );
  }

  if (!rows[0].must_reset_password) {
    return NextResponse.json(
      {
        success: false,
        message: "No password reset required for this account.",
      },
      { status: 400 },
    );
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  await query(
    `UPDATE users
     SET
       password_hash         = $1,
       must_reset_password   = FALSE,
       updated_at            = NOW()
     WHERE id = $2`,
    [password_hash, session.user.id],
  );

  await query(
    `INSERT INTO user_activities
       (user_id, performed_by, activity_type, description)
     VALUES ($1, $1, 'password_change', 'Set own password after admin-created account')`,
    [session.user.id],
  );

  return NextResponse.json({
    success: true,
    message: "Password set successfully. Welcome to SalesFlow!",
  });
}

// ── OTP reset: user forgot password, validate OTP then update ─────────────────
async function handleOtpReset(email: string, otp: string, newPassword: string) {
  const { rows } = await query(
    `SELECT
       id, is_active,
       reset_password_otp,
       reset_password_otp_expires_at
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  if (!rows.length) {
    // Don't reveal whether email exists
    return NextResponse.json(
      { success: false, message: "Invalid or expired reset code." },
      { status: 400 },
    );
  }

  const user = rows[0];

  if (!user.is_active) {
    return NextResponse.json(
      { success: false, message: "This account has been deactivated." },
      { status: 403 },
    );
  }

  if (!user.reset_password_otp || !user.reset_password_otp_expires_at) {
    return NextResponse.json(
      {
        success: false,
        message: "No reset code found. Please request a new one.",
      },
      { status: 400 },
    );
  }

  const now = new Date();
  const expiresAt = new Date(user.reset_password_otp_expires_at);

  if (isNaN(expiresAt.getTime()) || expiresAt < now) {
    return NextResponse.json(
      {
        success: false,
        message: "Reset otp code has expired. Please request a new one.",
      },
      { status: 400 },
    );
  }

  if (otp !== user.reset_password_otp) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid otp code. Please check and try again.",
      },
      { status: 400 },
    );
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  await query(
    `UPDATE users
     SET
       password_hash                 = $1,
       reset_password_otp            = NULL,
       reset_password_otp_expires_at = NULL,
       must_reset_password           = FALSE,
       updated_at                    = NOW()
     WHERE id = $2`,
    [password_hash, user.id],
  );

  await query(
    `INSERT INTO user_activities
       (user_id, performed_by, activity_type, description)
     VALUES ($1, $1, 'password_change', 'Password reset via forgot-password OTP')`,
    [user.id],
  );

  return NextResponse.json({
    success: true,
    message: "Password reset successfully. You can now log in.",
  });
}
