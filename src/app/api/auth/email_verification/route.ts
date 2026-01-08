import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // 1. Fetch user profile
    const { rows } = await query(
      `SELECT email_otp, email_otp_expires_at, is_verified
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    const profile = rows[0];

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 }
      );
    }

    if (profile.is_verified) {
      return NextResponse.json(
        { success: false, message: "Email already verified" },
        { status: 409 }
      );
    }

    // 2. OTP validation
    const now = new Date();

    if (!profile.email_otp || !profile.email_otp_expires_at) {
      return NextResponse.json(
        { success: false, message: "No active OTP found" },
        { status: 400 }
      );
    }

    if (profile.email_otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP code" },
        { status: 401 }
      );
    }

    const expiresAt = new Date(String(profile.email_otp_expires_at));
    if (isNaN(expiresAt.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP expiry timestamp" },
        { status: 400 }
      );
    }

    if (expiresAt < now) {
      return NextResponse.json(
        { success: false, message: "OTP has expired" },
        { status: 410 }
      );
    }

    // 3. Mark email as verified
    await query(
      `UPDATE users
       SET is_verified = true,
           email_otp = NULL,
           email_otp_expires_at = NULL,
           updated_at = NOW()
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    // 4. Success response
    return NextResponse.json({
      success: true,
      message: "Email successfully verified",
      verified_at: now.toISOString(),
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
