import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return req.headers.get("x-real-ip") || null;
}

async function logActivity(params: {
  userId: string;
  activityType: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  try {
    const {
      userId,
      activityType,
      description,
      entityType,
      entityId,
      ipAddress,
      userAgent,
    } = params;

    await query(
      `INSERT INTO user_activities
        (user_id, performed_by, activity_type, description, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        activityType,
        description ?? null,
        entityType ?? null,
        entityId ?? null,
        ipAddress,
        userAgent,
      ],
    );
  } catch (err) {
    // Never let logging failures break the main request
    console.error("Activity Log Error:", err);
  }
}

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 },
      );
    }

    // 1. Fetch user profile
    const { rows } = await query(
      `SELECT id, email_otp, email_otp_expires_at, is_verified
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email],
    );

    const profile = rows[0];

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 },
      );
    }

    if (profile.is_verified) {
      return NextResponse.json(
        { success: false, message: "Email already verified" },
        { status: 409 },
      );
    }

    // 2. OTP validation
    const now = new Date();

    if (!profile.email_otp || !profile.email_otp_expires_at) {
      return NextResponse.json(
        { success: false, message: "No active OTP found" },
        { status: 400 },
      );
    }

    if (profile.email_otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP code" },
        { status: 401 },
      );
    }

    const expiresAt = new Date(String(profile.email_otp_expires_at));
    if (isNaN(expiresAt.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP expiry timestamp" },
        { status: 400 },
      );
    }

    if (expiresAt < now) {
      return NextResponse.json(
        { success: false, message: "OTP has expired" },
        { status: 410 },
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
      [email],
    );

    // 4. Log activity — self-performed, no session exists yet at OTP stage
    await logActivity({
      userId: profile.id,
      activityType: "email_verified",
      description: `Email ${email} verified successfully`,
      entityType: "user",
      entityId: profile.id,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || null,
    });

    // 5. Success response
    return NextResponse.json({
      success: true,
      message: "Email successfully verified",
      verified_at: now.toISOString(),
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 },
    );
  }
}
