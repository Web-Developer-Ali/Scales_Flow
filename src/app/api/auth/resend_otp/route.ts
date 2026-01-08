import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendRegistrationOtp } from "@/lib/email/otp-service";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }
    const { rows } = await query(
      `
      SELECT
        id,
        role,
        email_otp,
        email_otp_expires_at,
        is_verified
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.is_verified) {
      return NextResponse.json(
        { success: false, message: "Email already verified" },
        { status: 409 }
      );
    }

      // Prevent resend if OTP still valid
    const now = new Date();

    if (user.email_otp && user.email_otp_expires_at) {
      const expiresAt = new Date(user.email_otp_expires_at);

      if (!isNaN(expiresAt.getTime()) && expiresAt > now) {
        return NextResponse.json(
          {
            success: false,
            message: "Existing OTP is still valid. Please check your email.",
          },
          { status: 429 }
        );
      }
    }
     //  Regenerate OTP in DB (10 min for ALL roles)
       
     const { rows: updated } = await query(
      `
      UPDATE users
      SET
        email_otp = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
        email_otp_expires_at = NOW() + INTERVAL '10 minutes',
        updated_at = NOW()
      WHERE id = $1
      RETURNING email_otp, role
      `,
      [user.id]
    );

    const otp = updated[0].email_otp;
    const role = updated[0].role;

    // Send OTP email
      const verificationLink = `${process.env.NEXTAUTH_URL}/otp-verification?email=${encodeURIComponent(
      email
    )}`;

    const emailResult = await sendRegistrationOtp(
      email,
      role,
      otp,
      verificationLink
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: emailResult.message },
        { status: 500 }
      );
    }

         // Success
    return NextResponse.json(
      {
        success: true,
        message: "New OTP sent successfully. It will expire in 10 minutes.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to resend OTP" },
      { status: 500 }
    );
  }
}
