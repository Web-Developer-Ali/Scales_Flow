import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { sendPasswordResetOtp } from "@/lib/email/otp-service";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: userId } = await context.params;

  try {
    const { rows } = await query(
      `UPDATE users
       SET
         must_reset_password           = TRUE,
         reset_password_otp            = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
         reset_password_otp_expires_at = NOW() + INTERVAL '24 hours',
         updated_at                    = NOW()
       WHERE id = $1
         AND role != 'admin'   -- admin cannot force-reset themselves
       RETURNING email, name, reset_password_otp`,
      [userId],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const { email, reset_password_otp: otp } = rows[0];
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?email=${encodeURIComponent(email)}&forced=true`;

    await sendPasswordResetOtp(email, otp, resetLink);

    return NextResponse.json({
      success: true,
      message: `Password reset forced and email sent to ${email}`,
    });
  } catch (err) {
    console.error("Force Reset Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
