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
  const organizationId = session.user.organizationId;

  const ORDER_MAP: Record<string, string> = {
    created_at_desc: "c.created_at DESC",
    created_at_asc: "c.created_at ASC",
    company_name_asc: "c.company_name ASC",
    company_name_desc: "c.company_name DESC",
    status_asc: "c.status ASC",
  };
  const ORDER = ORDER_MAP[sort] ?? "c.created_at DESC";

  try {
    // $1 is always organizationId — tenant isolation first
    // Role/filter params start at $2
    const conditions: string[] = ["c.organization_id = $1"];
    const params: unknown[] = [organizationId];
    let idx = 2;

    if (role === "scales_man") {
      conditions.push(`c.assigned_to = $${idx}`);
      params.push(userId);
      idx++;
    } else if (role === "manager") {
      conditions.push(`(
        c.assigned_to = $${idx}
        OR c.assigned_to IN (
          SELECT id FROM users
          WHERE organization_id = $1
            AND manager_id      = $${idx}
            AND role            = 'scales_man'
            AND is_active       = true
        )
      )`);
      params.push(userId);
      idx++;
    }
    // admin: org filter ($1) is sufficient

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

    const WHERE = `WHERE ${conditions.join(" AND ")}`;

    // Summary needs its own parameterised role scope — no string interpolation.
    // We build a separate param set for it so the CTE stays safe.
    // Simplest approach: use the same WHERE but strip search/status/industry
    // by building a role-only WHERE for the summary CTE.
    const summaryConditions: string[] = ["c.organization_id = $1"];
    const summaryParams: unknown[] = [organizationId];
    let sIdx = 2;

    if (role === "scales_man") {
      summaryConditions.push(`c.assigned_to = $${sIdx}`);
      summaryParams.push(userId);
      sIdx++;
    } else if (role === "manager") {
      summaryConditions.push(`(
        c.assigned_to = $${sIdx}
        OR c.assigned_to IN (
          SELECT id FROM users
          WHERE organization_id = $1
            AND manager_id      = $${sIdx}
            AND role            = 'scales_man'
            AND is_active       = true
        )
      )`);
      summaryParams.push(userId);
      sIdx++;
    }

    const SUMMARY_WHERE = `WHERE ${summaryConditions.join(" AND ")}`;

    // Run the main list query and summary + industries in parallel.
    // Two queries is cleaner and safer than one giant CTE with mixed param sets.
    const [mainResult, metaResult] = await Promise.all([
      query(
        `SELECT
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
           u.name AS assigned_to_name,
           COUNT(d.id)                                                AS total_deals,
           COUNT(d.id) FILTER (WHERE d.status = 'active')            AS active_deals,
           COUNT(d.id) FILTER (WHERE d.status = 'won')               AS won_deals,
           COALESCE(SUM(d.value) FILTER (WHERE d.status = 'won'), 0) AS total_revenue
         FROM clients c
         LEFT JOIN users u ON c.assigned_to = u.id
         LEFT JOIN deals d ON d.client_id   = c.id
         ${WHERE}
         GROUP BY c.id, u.name
         ORDER BY ${ORDER}`,
        params,
      ),
      query(
        `WITH
         summary AS (
           SELECT
             COUNT(*)                                     AS total_clients,
             COUNT(*) FILTER (WHERE status = 'active')   AS active_clients,
             COUNT(*) FILTER (WHERE status = 'prospect') AS prospect_clients,
             COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_clients
           FROM clients c
           ${SUMMARY_WHERE}
         ),
         -- Industries scoped to this org only
         industries AS (
           SELECT DISTINCT industry
           FROM clients
           WHERE organization_id = $1
             AND industry IS NOT NULL
             AND industry <> ''
           ORDER BY industry ASC
         )
         SELECT
           (SELECT row_to_json(s) FROM summary s)                         AS summary,
           (SELECT COALESCE(json_agg(i.industry), '[]'::json)
            FROM industries i)                                             AS industries`,
        summaryParams,
      ),
    ]);

    const meta = metaResult.rows[0];

    return NextResponse.json({
      success: true,
      summary: {
        totalClients: Number(meta.summary?.total_clients ?? 0),
        activeClients: Number(meta.summary?.active_clients ?? 0),
        prospectClients: Number(meta.summary?.prospect_clients ?? 0),
        inactiveClients: Number(meta.summary?.inactive_clients ?? 0),
      },
      clients: mainResult.rows,
      industries: meta.industries ?? [],
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

  const organizationId = session.user.organizationId;

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
        organization_id,
        company_name, industry, website, address,
        primary_contact_name, primary_contact_email, primary_contact_phone,
        status, notes,
        assigned_to, created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::client_status,$10,$11,$11)
      RETURNING id, company_name, status, created_at`,
      [
        organizationId, // $1
        company_name.trim(), // $2
        industry?.trim() || null, // $3
        website?.trim() || null, // $4
        address?.trim() || null, // $5
        primary_contact_name?.trim() || null, // $6
        primary_contact_email?.trim().toLowerCase() || null, // $7
        primary_contact_phone?.trim() || null, // $8
        status, // $9
        notes?.trim() || null, // $10
        session.user.id, // $11 assigned_to + created_by
      ],
    );

    await query(
      `INSERT INTO user_activities
         (organization_id, user_id, performed_by, activity_type, description, entity_type, entity_id)
       VALUES ($1, $2, $2, 'client_created', $3, 'client', $4)`,
      [
        organizationId,
        session.user.id,
        `Created client: ${rows[0].company_name}`,
        rows[0].id,
      ],
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
