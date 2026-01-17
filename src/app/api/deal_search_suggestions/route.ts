import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET(req: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // check user role
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("q")?.trim() || "";
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Don't hit DB unnecessarily
    if (search.length < 2) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    // Call database function
    const sql = `
      SELECT *
      FROM search_deals_suggestions($1, $2);
    `;

    const { rows } = await query(sql, [search, limit]);

    return NextResponse.json({
      success: true,
      suggestions: rows,
    });
  } catch (error) {
    console.error("Search Suggestions API Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
