import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import bcrypt from "bcryptjs";

// ── GET: fetch profile + login history ───────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { rows: userRows } = await query(
      `SELECT
         id, name, email, role, company_name,
         is_active, is_verified, login_count,
         last_login_at, created_at
       FROM users
       WHERE id = $1`,
      [session.user.id],
    );

    if (!userRows.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Last 10 login events from user_activities
    const { rows: loginHistory } = await query(
      `SELECT
         id, activity_type, description,
         ip_address, user_agent, created_at
       FROM user_activities
       WHERE user_id       = $1
         AND activity_type = 'login'
       ORDER BY created_at DESC
       LIMIT 10`,
      [session.user.id],
    );

    return NextResponse.json({
      success: true,
      user: userRows[0],
      loginHistory,
    });
  } catch (err) {
    console.error("Profile GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── PATCH: update profile or change password ──────────────────────────────────
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, company_name, currentPassword, newPassword } = body;

    // ── Password change ────────────────────────────────────────────────────
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required" },
          { status: 400 },
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: "New password must be at least 8 characters",
          },
          { status: 400 },
        );
      }

      // Verify current password
      const { rows } = await query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [session.user.id],
      );

      const valid = await bcrypt.compare(
        currentPassword,
        rows[0].password_hash,
      );
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await query(
        `UPDATE users
         SET password_hash = $1, updated_at = NOW()
         WHERE id = $2`,
        [newHash, session.user.id],
      );

      // Log password change
      await query(
        `INSERT INTO user_activities
           (user_id, performed_by, activity_type, description)
         VALUES ($1, $1, 'password_change', 'Password changed successfully')`,
        [session.user.id],
      );

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    // ── Profile update ────────────────────────────────────────────────────
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name?.trim()) {
      updates.push(`name = $${idx}`);
      values.push(name.trim());
      idx++;
    }

    if (company_name !== undefined) {
      updates.push(`company_name = $${idx}`);
      values.push(company_name?.trim() || null);
      idx++;
    }

    if (!updates.length) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    values.push(session.user.id);
    await query(
      `UPDATE users
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${idx}`,
      values,
    );

    // Log profile update
    await query(
      `INSERT INTO user_activities
         (user_id, performed_by, activity_type, description)
       VALUES ($1, $1, 'profile_update', 'Profile information updated')`,
      [session.user.id],
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("Profile PATCH Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
