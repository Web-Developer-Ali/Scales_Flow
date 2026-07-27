import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { sendWelcomeEmail } from "@/lib/email/email-notifications";
import { clearRegistrationOtp } from "@/lib/email/Otp-db-helpers";

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip") || null;
}

// ── GET: list team members scoped to this admin's org ─────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const organizationId = session.user.organizationId;

  try {
    const sql = `
      WITH member_list AS (
        SELECT
          id,
          name,
          email,
          role,
          is_active,
          created_at::date AS join_date
        FROM users
        WHERE organization_id = $1          -- ← org scope
          AND role IN ('manager', 'scales_man')
        ORDER BY created_at ASC
      ),
      summary AS (
        SELECT
          COUNT(*)                                    AS total_team_members,
          COUNT(*) FILTER (WHERE role = 'manager')    AS managers,
          COUNT(*) FILTER (WHERE role = 'scales_man') AS scales_man
        FROM member_list
      )
      SELECT
        (SELECT row_to_json(s) FROM summary s)  AS summary,
        (SELECT json_agg(m) FROM member_list m) AS members;
    `;

    const { rows } = await query(sql, [organizationId]);
    const row = rows[0];

    const summaryRaw = row.summary ?? {
      total_team_members: 0,
      managers: 0,
      scales_man: 0,
    };

    const membersRaw: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      is_active: boolean;
      join_date: string;
    }> = row.members ?? [];

    const teamMembers = membersRaw.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role === "manager" ? "Manager" : "Sales Rep",
      status: m.is_active ? "active" : "blocked",
      joinDate: m.join_date,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalTeamMembers: Number(summaryRaw.total_team_members),
        managers: Number(summaryRaw.managers),
        salesReps: Number(summaryRaw.scales_man),
      },
      teamMembers,
    });
  } catch (err) {
    console.error("Team API Error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

// ── POST: create a new team member in this org ────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const organizationId = session.user.organizationId;

  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!["manager", "scales_man"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    const password_hash = await bcrypt.hash(password, 10);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || null;

    // create_user_with_role now takes organization_id as the first param
    const { rows } = await query(
      `SELECT * FROM create_user_with_role($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        organizationId, // $1 p_organization_id ← new first param
        email.toLowerCase().trim(), // $2 p_email
        password_hash, // $3 p_password_hash
        name.trim(), // $4 p_name
        role, // $5 p_role
        null, // $6 p_company_name
        session.user.id, // $7 p_created_by
        "credentials", // $8 p_auth_provider
        null, // $9 p_provider_id
        ipAddress, // $10 p_ip_address
        userAgent, // $11 p_user_agent
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

    const emailResult = await sendWelcomeEmail({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role,
      otp,
      createdByName: session.user.name ?? "Admin",
    });

    if (!emailResult.success) {
      await clearRegistrationOtp(user_id);
      return NextResponse.json(
        {
          success: false,
          error:
            "User created but verification email failed. Use Resend OTP once email is working.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User created. Verification OTP sent to their email.",
      userId: user_id,
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
