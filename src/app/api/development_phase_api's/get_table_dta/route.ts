import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Whitelist of allowed tables for security
const ALLOWED_TABLES = [
  "users",
  "deals",
  "deal_activities",
  "deal_notes",
  "user_activities",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

export async function GET(request: NextRequest) {
  try {
    // Get table name from query parameter
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table");

    // Validate table name
    if (!tableName) {
      return NextResponse.json(
        { error: "Table name is required. Use ?table=users" },
        { status: 400 },
      );
    }

    // Check if table is allowed
    if (!ALLOWED_TABLES.includes(tableName as AllowedTable)) {
      return NextResponse.json(
        {
          error: "Invalid table name",
          allowed_tables: ALLOWED_TABLES,
        },
        { status: 400 },
      );
    }

    // Get optional limit parameter (default 100, max 1000)
    let limit = parseInt(searchParams.get("limit") || "100");
    limit = Math.min(Math.max(limit, 1), 1000);

    // Get optional order by parameter
    const orderBy = searchParams.get("order_by") || "created_at";
    const orderDir =
      searchParams.get("order_dir")?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Sanitize order by column to prevent SQL injection
    const safeOrderBy = orderBy.replace(/[^a-z0-9_]/gi, "");

    // Build and execute query
    const sql = `
            SELECT * 
            FROM ${tableName}
            ORDER BY ${safeOrderBy} ${orderDir}
            LIMIT $1
        `;

    const { rows } = await query(sql, [limit]);

    // Get row count
    const countResult = await query(`SELECT COUNT(*) FROM ${tableName}`);
    const totalCount = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      success: true,
      table: tableName,
      total_rows: totalCount,
      returned_rows: rows.length,
      limit: limit,
      data: rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch table data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
