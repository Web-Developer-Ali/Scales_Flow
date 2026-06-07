import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// ── GET: list clients ─────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "all";
  const industry = searchParams.get("industry") ?? "all";
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "created_at_desc";

  const role = session.user.role;
  const userId = session.user.id;

  try {
    const ORDER_MAP: Record<string, string> = {
      created_at_desc: "c.created_at DESC",
      created_at_asc: "c.created_at ASC",
      company_name_asc: "c.company_name ASC",
      company_name_desc: "c.company_name DESC",
      status_asc: "c.status ASC",
    };
    const ORDER = ORDER_MAP[sort] ?? "c.created_at DESC";

    // Build WHERE conditions based on role
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Role-based scoping
    if (role === "scales_man") {
      // Rep sees only their own clients
      conditions.push(`c.assigned_to = $${idx}`);
      params.push(userId);
      idx++;
    } else if (role === "manager") {
      // Manager sees their own + their team's clients
      conditions.push(`(
        c.assigned_to = $${idx}
        OR c.assigned_to IN (
          SELECT id FROM users
          WHERE manager_id = $${idx}
            AND role = 'scales_man'
            AND is_active = true
        )
      )`);
      params.push(userId);
      idx++;
    }
    // Admin sees all — no condition added

    if (status !== "all") {
      conditions.push(`c.status = $${idx}::client_status`);
      params.push(status);
      idx++;
    }

    if (industry !== "all" && industry.trim()) {
      conditions.push(`c.industry ILIKE $${idx}`);
      params.push(`%${industry.trim()}%`);
      idx++;
    }

    if (search.trim()) {
      conditions.push(`(
        c.company_name          ILIKE $${idx} OR
        c.primary_contact_name  ILIKE $${idx} OR
        c.primary_contact_email ILIKE $${idx}
      )`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    const WHERE =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      WITH client_list AS (
        SELECT
          c.id,
          c.company_name,
          c.industry,
          c.website,
          c.status::text,
          c.primary_contact_name,
          c.primary_contact_email,
          c.primary_contact_phone,
          c.notes,
          c.assigned_to,
          c.created_at,
          c.updated_at,
          -- Assigned rep name
          u.name  AS assigned_to_name,
          -- Deal stats per client
          COUNT(d.id)                                            AS total_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'active')        AS active_deals,
          COUNT(d.id) FILTER (WHERE d.status = 'won')           AS won_deals,
          COALESCE(SUM(d.value) FILTER (WHERE d.status = 'won'), 0) AS total_revenue
        FROM clients c
        LEFT JOIN users u  ON c.assigned_to = u.id
        LEFT JOIN deals d  ON d.client_id   = c.id
        ${WHERE}
        GROUP BY c.id, u.name
        ORDER BY ${ORDER}
      ),

      -- Summary stats over the full (unfiltered by search) result
      summary AS (
        SELECT
          COUNT(*)                                               AS total_clients,
          COUNT(*) FILTER (WHERE status = 'active')             AS active_clients,
          COUNT(*) FILTER (WHERE status = 'prospect')           AS prospect_clients,
          COUNT(*) FILTER (WHERE status = 'inactive')           AS inactive_clients
        FROM clients c
        ${
          // For summary, only apply role filter not search/status filters
          role === "scales_man"
            ? `WHERE c.assigned_to = '${userId}'`
            : role === "manager"
              ? `WHERE (c.assigned_to = '${userId}' OR c.assigned_to IN (SELECT id FROM users WHERE manager_id = '${userId}' AND role = 'scales_man' AND is_active = true))`
              : ""
        }
      ),

      -- All distinct industries for the filter dropdown
      industries AS (
        SELECT DISTINCT industry
        FROM clients
        WHERE industry IS NOT NULL
          AND industry <> ''
        ORDER BY industry ASC
      )

      SELECT
        (SELECT row_to_json(s) FROM summary s)                              AS summary,
        (SELECT COALESCE(json_agg(cl), '[]'::json) FROM client_list cl)    AS clients,
        (SELECT COALESCE(json_agg(i.industry), '[]'::json) FROM industries i) AS industries;
    `;

    const { rows } = await query(sql, params);
    const row = rows[0];

    return NextResponse.json({
      success: true,
      summary: {
        totalClients: Number(row.summary?.total_clients ?? 0),
        activeClients: Number(row.summary?.active_clients ?? 0),
        prospectClients: Number(row.summary?.prospect_clients ?? 0),
        inactiveClients: Number(row.summary?.inactive_clients ?? 0),
      },
      clients: row.clients ?? [],
      industries: row.industries ?? [],
    });
  } catch (err) {
    console.error("Clients List API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── POST: create client ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      company_name,
      industry,
      website,
      address,
      primary_contact_name,
      primary_contact_email,
      primary_contact_phone,
      status = "prospect",
      notes,
    } = body;

    if (!company_name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 },
      );
    }

    const VALID_STATUSES = ["prospect", "active", "inactive"];
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    const { rows } = await query(
      `INSERT INTO clients (
        company_name, industry, website, address,
        primary_contact_name, primary_contact_email, primary_contact_phone,
        status, notes,
        assigned_to, created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::client_status,$9,$10,$10)
      RETURNING id, company_name, status, created_at`,
      [
        company_name.trim(),
        industry?.trim() || null,
        website?.trim() || null,
        address?.trim() || null,
        primary_contact_name?.trim() || null,
        primary_contact_email?.trim().toLowerCase() || null,
        primary_contact_phone?.trim() || null,
        status,
        notes?.trim() || null,
        session.user.id,
      ],
    );

    // Log to user_activities
    await query(
      `INSERT INTO user_activities
         (user_id, performed_by, activity_type, description, entity_type, entity_id)
       VALUES ($1, $1, 'deal_created', $2, 'client', $3)`,
      [session.user.id, `Created client: ${rows[0].company_name}`, rows[0].id],
    );

    return NextResponse.json({
      success: true,
      message: "Client created successfully",
      client: rows[0],
    });
  } catch (err) {
    console.error("Create Client API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
