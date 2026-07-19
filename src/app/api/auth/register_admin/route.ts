import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { registrationSchema } from "@/lib/validation/registrationSchema";
import { pool } from "@/lib/db";
import { ZodError } from "zod";
import { sendRegistrationOtp } from "@/lib/email/otp-service";
import { clearRegistrationOtp } from "@/lib/email/Otp-db-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registrationSchema.parse(body);
    const { email, password, name, companyName } = validatedData;

    // Hash password
    const passwordHash = await hash(password, 12);

    // Bootstrap first admin
    const role = "admin";
    const createdBy = null;

    // Call DB function
    const result = await pool.query(
      `
      SELECT * FROM create_user_with_role(
        $1, -- email
        $2, -- password_hash
        $3, -- name
        $4, -- role
        $5, -- company_name
        $6  -- created_by
      )
      `,
      [
        email.toLowerCase(),
        passwordHash,
        name,
        role,
        companyName || null,
        createdBy,
      ],
    );

    // NOTE: assumes create_user_with_role returns both user_id and otp, as
    // it does in the admin "create team member" route. If your version of
    // this function only returns `otp`, add a `user_id` column to its
    // RETURNS TABLE so rollback below has something to target.
    const userId = result.rows[0]?.user_id;
    const otp = result.rows[0]?.otp;

    if (!otp) {
      return NextResponse.json(
        { success: false, message: "Failed to generate OTP" },
        { status: 500 },
      );
    }

    const verificationLink = `${process.env.NEXTAUTH_URL}/otp-verification?email=${encodeURIComponent(
      email,
    )}`;

    // Send OTP email
    const sendOtpEmail = await sendRegistrationOtp(
      email,
      role,
      otp,
      verificationLink,
    );

    if (!sendOtpEmail.success) {
      // Delivery ultimately failed after retries/failover. Clear the OTP
      // (if we have a user id to target) so a subsequent resend isn't
      // blocked by a rate-limit guard protecting a code that never arrived.
      if (userId) await clearRegistrationOtp(userId);

      return NextResponse.json(
        { success: false, message: sendOtpEmail.message },
        { status: 500 },
      );
    }

    // ✅ Success response
    return NextResponse.json(
      {
        success: true,
        message: "Admin registered successfully. OTP sent to email.",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Admin registration error:", error);

    // Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    // PostgreSQL errors
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 },
      );
    }

    // Role/permission errors
    if (error instanceof Error && error.message.includes("Only")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 },
    );
  }
}
