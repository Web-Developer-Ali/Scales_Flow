import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { registrationSchema } from "@/lib/validation/registrationSchema";
import { pool } from "@/lib/db";
import { ZodError } from "zod";
import { sendRegistrationOtp } from "@/lib/email/otp-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registrationSchema.parse(body);
    const { email, password, name, companyName } = validatedData;

    // Hash password
    const passwordHash = await hash(password, 12);

    // Bootstrap first admin
    const role: "admin" = "admin";
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
      ]
    );

    const otp = result.rows[0]?.otp;

    if (!otp) {
      return NextResponse.json(
        { success: false, message: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    const verificationLink = `${process.env.NEXTAUTH_URL}/otp-verification?email=${encodeURIComponent(
      email
    )}`;

    // Send OTP email
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

    // ✅ Success response
    return NextResponse.json(
      {
        success: true,
        message: "Admin registered successfully. OTP sent to email.",
      },
      { status: 201 }
    );
  } catch (error: any) {
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
        { status: 400 }
      );
    }

    // Unique constraint
    if (error.code === "23505") {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 }
      );
    }

    // Role/permission errors from DB
    if (error.message?.includes("Only")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
