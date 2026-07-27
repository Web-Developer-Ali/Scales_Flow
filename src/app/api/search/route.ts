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
  const q = searchParams.get("q")?.trim() ?? "";
  const role = session.user.role;
  const userId = session.user.id;
  const organizationId = session.user.organizationId;

  if (q.length < 2) {
    return NextResponse.json({ success: true, deals: [], clients: [] });
  }

  try {
    // ── DEALS ─────────────────────────────────────────────────────────────────
    // $1 = search pattern   $2 = organizationId
    // Role-specific params start at $3
    const dealConditions: string[] = [
      // text match
      `(d.company ILIKE $1 OR d.contact_person ILIKE $1 OR d.title ILIKE $1)`,
      // org isolation — always required
      `d.organization_id = $2`,
    ];
    const dealParams: unknown[] = [`%${q}%`, organizationId];
    let dIdx = 3;

    if (role === "scales_man") {
      dealConditions.push(`d.assigned_to = $${dIdx}`);
      dealParams.push(userId);
      dIdx++;
    } else if (role === "manager") {
      // Manager sees their own deals + their direct reports' deals
      // Both user subqueries also org-scoped
      dealConditions.push(`
        d.assigned_to IN (
          SELECT id FROM users
          WHERE organization_id = $2
            AND manager_id      = $${dIdx}
            AND role            = 'scales_man'
          UNION ALL
          SELECT $${dIdx}::uuid
        )
      `);
      dealParams.push(userId);
      dIdx++;
    }
    // admin: org filter ($2) is the only scope needed

    const dealWhere = `WHERE ${dealConditions.join(" AND ")}`;

    // ── CLIENTS ───────────────────────────────────────────────────────────────
    // $1 = search pattern   $2 = organizationId
    // Role-specific params start at $3
    const clientConditions: string[] = [
      `(c.company_name ILIKE $1 OR c.primary_contact_name ILIKE $1 OR c.primary_contact_email ILIKE $1)`,
      `c.organization_id = $2`,
    ];
    const clientParams: unknown[] = [`%${q}%`, organizationId];
    let cIdx = 3;

    if (role === "scales_man") {
      clientConditions.push(`c.assigned_to = $${cIdx}`);
      clientParams.push(userId);
      cIdx++;
    } else if (role === "manager") {
      clientConditions.push(`(
        c.assigned_to = $${cIdx}
        OR c.assigned_to IN (
          SELECT id FROM users
          WHERE organization_id = $2
            AND manager_id      = $${cIdx}
            AND role            = 'scales_man'
        )
      )`);
      clientParams.push(userId);
      cIdx++;
    }

    const clientWhere = `WHERE ${clientConditions.join(" AND ")}`;

    // Run both searches in parallel
    const [dealResults, clientResults] = await Promise.all([
      query(
        `SELECT
           d.id,
           d.title,
           d.company,
           d.contact_person,
           d.value,
           d.stage::text,
           d.status::text,
           d.probability,
           u.name AS assigned_to_name
         FROM deals d
         LEFT JOIN users u ON d.assigned_to = u.id
         ${dealWhere}
         ORDER BY d.updated_at DESC
         LIMIT 6`,
        dealParams,
      ),
      query(
        `SELECT
           c.id,
           c.company_name,
           c.primary_contact_name,
           c.primary_contact_email,
           c.status::text,
           c.industry,
           u.name AS assigned_to_name
         FROM clients c
         LEFT JOIN users u ON c.assigned_to = u.id
         ${clientWhere}
         ORDER BY c.updated_at DESC
         LIMIT 6`,
        clientParams,
      ),
    ]);

    return NextResponse.json({
      success: true,
      deals: dealResults.rows,
      clients: clientResults.rows,
    });
  } catch (err) {
    console.error("Search API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
