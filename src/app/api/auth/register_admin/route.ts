import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { registrationSchema } from "@/lib/validation/registrationSchema";
import { pool } from "@/lib/db";
import { sendRegistrationOtp } from "@/lib/email/otp-service";
import { clearRegistrationOtp } from "@/lib/email/Otp-db-helpers";

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip") || null;
}

function getClientUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent") || null;
}

function getBaseUrl(request: NextRequest): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(request.url).origin
  );
}

function isDuplicateKeyError(
  error: unknown,
): error is { code?: string; message?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { email, password, name, companyName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();
    const normalizedCompanyName = companyName.trim();

    const passwordHash = await hash(password, 12);
    const role = "admin";
    const createdBy = null;

    const organizationName =
      normalizedCompanyName || `${normalizedName}'s Organization`;
    const ipAddress = getClientIp(request);
    const userAgent = getClientUserAgent(request);

    await client.query("BEGIN");

    let slug = organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      slug = "organization";
    }

    let finalSlug = slug;
    let counter = 1;

    while (true) {
      const exists = await client.query(
        `SELECT 1 FROM organizations WHERE slug = $1 LIMIT 1`,
        [finalSlug],
      );

      if (exists.rowCount === 0) {
        break;
      }

      counter += 1;
      finalSlug = `${slug}-${counter}`;
    }

    const organizationResult = await client.query(
      `
        INSERT INTO organizations (
          name,
          slug,
          plan,
          trial_ends_at
        )
        VALUES (
          $1,
          $2,
          'trial',
          NOW() + INTERVAL '14 days'
        )
        RETURNING id
      `,
      [organizationName, finalSlug],
    );

    const organizationId = organizationResult.rows[0]?.id;

    if (!organizationId) {
      throw new Error("Failed to create organization");
    }

    const result = await client.query(
      `
        SELECT *
        FROM create_user_with_role(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
      `,
      [
        organizationId,
        normalizedEmail,
        passwordHash,
        normalizedName,
        role,
        normalizedCompanyName || null,
        createdBy,
        "credentials",
        null,
        ipAddress,
        userAgent,
      ],
    );

    const userId = result.rows[0]?.user_id;
    const otp = result.rows[0]?.otp;

    if (!otp) {
      throw new Error("Failed to generate OTP");
    }

    await client.query("COMMIT");

    const verificationLink = `${getBaseUrl(request)}/otp-verification?email=${encodeURIComponent(normalizedEmail)}`;

    const sendOtpEmail = await sendRegistrationOtp(
      normalizedEmail,
      role,
      otp,
      verificationLink,
    );

    if (!sendOtpEmail.success) {
      if (userId) {
        await clearRegistrationOtp(userId);
      }

      return NextResponse.json(
        { success: false, message: sendOtpEmail.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin registered successfully. OTP sent to email.",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback failures; the original error is more important.
    }

    console.error("Admin registration error:", error);

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message.includes("Only")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("Failed to generate OTP")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration completed but verification email could not be prepared",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
