import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { sendRegistrationOtp } from "@/lib/email/otp-service";

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; the first is the client
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return req.headers.get("x-real-ip") || null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Admin can only create manager or scales_man — never another admin
    if (!["manager", "scales_man"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || null;

    const { rows } = await query(
      `SELECT * FROM create_user_with_role($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        email.toLowerCase().trim(),
        password_hash,
        name.trim(),
        role,
        null, // p_company_name
        session.user.id, // p_created_by
        "credentials", // p_auth_provider
        null, // p_provider_id
        ipAddress, // p_ip_address
        userAgent, // p_user_agent
      ],
    );

    if (!rows?.length) {
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 },
      );
    }

    const { user_id, otp } = rows[0];

    if (!otp) {
      return NextResponse.json(
        { success: false, error: "Failed to generate OTP" },
        { status: 500 },
      );
    }

    const verificationLink = `${process.env.NEXTAUTH_URL}/otp-verification?email=${encodeURIComponent(email)}`;

    const emailResult = await sendRegistrationOtp(
      email,
      role,
      otp,
      verificationLink,
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User created. Verification OTP sent to their email.",
      userId: user_id,
      // ✅ OTP intentionally NOT returned — it was sent to user's email only
    });
  } catch (err) {
    console.error("Create User API Error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
