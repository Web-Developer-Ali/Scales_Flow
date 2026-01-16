import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { sendRegistrationOtp } from "@/lib/email/otp-service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const creatorRole = session.user.role;

    if (!["admin"].includes(creatorRole)) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["admin", "manager", "scales_man"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const sql = `
      SELECT * FROM create_user_with_role(
        $1, $2, $3, $4, $5, $6
      );
    `;

    const values = [
      email.toLowerCase(),
      password_hash,
      name,
      role,
      null,
      session.user.id,
    ];

    const { rows } = await query(sql, values);

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to create user" },
        { status: 500 }
      );
    }

    const user_id = rows[0].id;
    const otp = rows[0].otp;

    if (!otp) {
      return NextResponse.json(
        { success: false, message: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    const verificationLink = `${
      process.env.NEXTAUTH_URL
    }/otp-verification?email=${encodeURIComponent(email)}`;

    const sendOtpEmail = await sendRegistrationOtp(
      email,
      role,
      otp,
      verificationLink
    );

    if (!sendOtpEmail.success) {
      return NextResponse.json(
        { success: false, message: sendOtpEmail.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "User created successfully and email verification OTP sent to user.",
      userId: user_id,
      otp: otp,
    });
  } catch (err) {
    console.error("Create User API Error:", err);

    let message = "Server error";
    if (err && typeof err === "object" && err !== null && "message" in err) {
      message =
        ((err as Record<string, unknown>).message as string) || "Server error";
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
