import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  // 🚨 HARD BLOCK IN PRODUCTION
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Not allowed in production" },
      { status: 403 }
    );
  }

  try {
    const { rows } = await query(
      `
      SELECT
        id,

        -- Authentication
        email,
        password_hash,

        -- Profile
        name,
        company_name,

        -- Roles & hierarchy
        role,
        created_by,

        -- OTP: Email verification
        email_otp,
        email_otp_expires_at,

        -- OTP: Password reset
        reset_password_otp,
        reset_password_otp_expires_at,

        -- Authentication tracking
        last_login_at,
        login_count,
        failed_login_attempts,
        last_failed_login_at,

        -- Account status
        is_active,
        is_verified,

        -- Timestamps
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    return NextResponse.json({
      success: true,
      count: rows.length,
      users: rows,
    });
  } catch (error) {
    console.error("DEV USERS API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
