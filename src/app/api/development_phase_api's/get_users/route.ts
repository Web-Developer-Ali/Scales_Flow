import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  // 🚨 HARD BLOCK IN PRODUCTION
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Not allowed in production" },
      { status: 403 },
    );
  }

  try {
    const { rows } = await query(
      `
      SELECT * FROM "user_activities";
    `,
    );

    return NextResponse.json({
      success: true,
      count: rows.length,
      users: rows,
    });
  } catch (error) {
    console.error("DEV USERS API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
