import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Summary stats
    const summaryQuery = `
      SELECT
        COUNT(*) AS total_team_members,
        COUNT(*) FILTER (WHERE role = 'manager') AS managers,
        COUNT(*) FILTER (WHERE role = 'sales_rep') AS sales_reps
      FROM users
      WHERE role IN ('manager', 'sales_rep');
    `;

    const {
      rows: [summary],
    } = await query(summaryQuery);

    // Team Members List
    const memberQuery = `
      SELECT 
        id,
        name,
        email,
        role,
        is_active,
        created_at::date AS join_date
      FROM users
      WHERE role IN ('manager', 'sales_rep')
      ORDER BY created_at ASC;
    `;

    const { rows } = await query(memberQuery);

    // Format rows for frontend
    const teamMembers = rows.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.is_active ? "active" : "inactive",
      joinDate: member.join_date,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalTeamMembers: Number(summary.total_team_members),
        managers: Number(summary.managers),
        salesReps: Number(summary.sales_reps),
      },
      teamMembers,
    });
  } catch (err) {
    console.error("User API Error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
