import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Single query — summary + members in one round-trip
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
        WHERE role IN ('manager', 'scales_man')
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
        (SELECT row_to_json(s) FROM summary s)                       AS summary,
        (SELECT json_agg(m) FROM member_list m)                      AS members;
    `;

    const { rows } = await query(sql);
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
