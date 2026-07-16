import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendPasswordResetOtp } from "@/lib/email/otp-service";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 },
      );
    }

    // Always return success even if user not found
    // This prevents email enumeration attacks
    const { rows } = await query(
      `SELECT id, name, role, is_active,
              reset_password_otp,
              reset_password_otp_expires_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()],
    );

    const user = rows[0];

    // Return success even if user doesn't exist (security)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If that email exists, a reset code has been sent.",
      });
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, message: "This account has been deactivated." },
        { status: 403 },
      );
    }

    // Rate limit: don't resend if existing OTP is still valid
    const now = new Date();
    if (user.reset_password_otp && user.reset_password_otp_expires_at) {
      const expiresAt = new Date(user.reset_password_otp_expires_at);
      if (!isNaN(expiresAt.getTime()) && expiresAt > now) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A reset code was already sent. Please check your email or wait before requesting another.",
          },
          { status: 429 },
        );
      }
    }

    // Generate new reset OTP — 10 minutes for everyone
    const { rows: updated } = await query(
      `UPDATE users
       SET
         reset_password_otp             = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
         reset_password_otp_expires_at  = NOW() + INTERVAL '10 minutes',
         updated_at                     = NOW()
       WHERE id = $1
       RETURNING reset_password_otp, name`,
      [user.id],
    );

    const otp = updated[0].reset_password_otp;
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?email=${encodeURIComponent(email.trim())}`;

    const emailResult = await sendPasswordResetOtp(
      email.trim(),
      otp,
      resetLink,
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to send reset email. Try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "If that email exists, a reset code has been sent.",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
