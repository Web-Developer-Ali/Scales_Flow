import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const role = session.user.role;
  const userId = session.user.id;

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Role scoping — same as clients list
    if (role === "scales_man") {
      conditions.push(`c.assigned_to = $${idx}`);
      params.push(userId);
      idx++;
    } else if (role === "manager") {
      conditions.push(`(
        c.assigned_to = $${idx}
        OR c.assigned_to IN (
          SELECT id FROM users
          WHERE manager_id = $${idx}
            AND role      = 'scales_man'
            AND is_active = true
        )
      )`);
      params.push(userId);
      idx++;
    }

    if (search.trim()) {
      conditions.push(`c.company_name ILIKE $${idx}`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    const WHERE = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await query(
      `SELECT id, company_name, status::text, industry
       FROM clients c
       ${WHERE}
       ORDER BY company_name ASC
       LIMIT 20`,
      params,
    );

    return NextResponse.json({ success: true, clients: rows });
  } catch (err) {
    console.error("Client Search API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
