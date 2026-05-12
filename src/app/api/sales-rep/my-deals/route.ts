import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "scales_man") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "created_at_desc";

  const repId = session.user.id;

  try {
    // Build dynamic WHERE clauses safely
    const conditions: string[] = ["d.assigned_to = $1"];
    const params: unknown[] = [repId];
    let paramIndex = 2;

    if (stage !== "all") {
      conditions.push(`d.stage = $${paramIndex}::deal_stage`);
      params.push(stage);
      paramIndex++;
    }

    if (status !== "all") {
      conditions.push(`d.status = $${paramIndex}::deal_status`);
      params.push(status);
      paramIndex++;
    }

    if (search.trim()) {
      conditions.push(
        `(d.company ILIKE $${paramIndex} OR d.contact_person ILIKE $${paramIndex})`,
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const WHERE = conditions.join(" AND ");

    // Sort mapping — whitelist to prevent injection
    const ORDER_MAP: Record<string, string> = {
      created_at_desc: "b.created_at DESC",
      created_at_asc: "b.created_at ASC",
      value_desc: "b.value DESC",
      value_asc: "b.value ASC",
      probability_desc: "b.probability DESC",
      days_desc: "b.days_in_stage DESC", // already computed in base CTE
    };
    const ORDER = ORDER_MAP[sort] ?? "d.created_at DESC";

    const sql = `
    WITH base AS (
      SELECT
        d.id,
        d.title,
        d.company,
        d.contact_person,
        d.contact_email,
        d.value,
        d.stage::text,
        d.status::text,
        d.probability,
        d.expected_close_date,
        d.description,
        d.created_at,
        d.updated_at,
        GREATEST(
          EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400.0,
          0
        ) AS days_in_stage
      FROM deals d
      WHERE ${WHERE}
    ),
  
    stats AS (
      SELECT
        COUNT(*)                                       AS total_deals,
        COALESCE(SUM(value), 0)                        AS total_pipeline,
        COALESCE(AVG(probability), 0)                  AS avg_probability,
        COALESCE(SUM(value * probability / 100.0), 0)  AS expected_revenue,
        COUNT(*) FILTER (WHERE status = 'won')         AS won_count,
        COUNT(*) FILTER (WHERE status = 'active')      AS active_count
      FROM base
    )
  
    SELECT
      (SELECT row_to_json(s) FROM stats s)                                     AS stats,
      (SELECT COALESCE(json_agg(b ORDER BY ${ORDER}), '[]'::json) FROM base b) AS deals;
  `;

    const { rows } = await query(sql, params);
    const row = rows[0];

    return NextResponse.json({
      success: true,
      stats: {
        totalDeals: Number(row.stats?.total_deals ?? 0),
        totalPipeline: Number(row.stats?.total_pipeline ?? 0),
        avgProbability: Math.round(Number(row.stats?.avg_probability ?? 0)),
        expectedRevenue: Math.round(Number(row.stats?.expected_revenue ?? 0)),
        wonCount: Number(row.stats?.won_count ?? 0),
        activeCount: Number(row.stats?.active_count ?? 0),
      },
      deals: row.deals ?? [],
    });
  } catch (err) {
    console.error("Deals List API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
