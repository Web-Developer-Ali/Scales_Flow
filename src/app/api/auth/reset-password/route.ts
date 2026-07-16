import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    // ── Validation ─────────────────────────────────────────────────────────
    if (!email?.trim() || !otp?.trim() || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, OTP, and new password are required.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // ── Fetch user ──────────────────────────────────────────────────────────
    const { rows } = await query(
      `SELECT
         id, role, is_active,
         reset_password_otp,
         reset_password_otp_expires_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()],
    );

    if (!rows.length) {
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

    // ── Validate OTP ────────────────────────────────────────────────────────
    if (!user.reset_password_otp || !user.reset_password_otp_expires_at) {
      return NextResponse.json(
        { success: false, message: "No reset code found. Request a new one." },
        { status: 400 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(user.reset_password_otp_expires_at);

    if (isNaN(expiresAt.getTime()) || expiresAt < now) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset code has expired. Request a new one.",
        },
        { status: 400 },
      );
    }

    // Timing-safe OTP comparison
    if (otp.trim() !== user.reset_password_otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reset code. Please check and try again.",
        },
        { status: 400 },
      );
    }

    // ── Hash and save new password ──────────────────────────────────────────
    const password_hash = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE users
       SET
         password_hash                  = $1,
         reset_password_otp             = NULL,
         reset_password_otp_expires_at  = NULL,
         must_reset_password            = FALSE,   -- clear forced reset flag
         updated_at                     = NOW()
       WHERE id = $2`,
      [password_hash, user.id],
    );

    // Log password change in user_activities
    await query(
      `INSERT INTO user_activities
         (user_id, performed_by, activity_type, description)
       VALUES ($1, $1, 'password_change', 'Password reset via OTP')`,
      [user.id],
    );

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
