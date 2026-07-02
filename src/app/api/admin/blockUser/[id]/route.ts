import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

async function logActivity(params: {
  userId: string;
  performedBy: string;
  activityType: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  req: Request;
}) {
  try {
    const {
      userId,
      performedBy,
      activityType,
      description,
      entityType,
      entityId,
      req,
    } = params;

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    await query(
      `INSERT INTO user_activities
        (user_id, performed_by, activity_type, description, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        performedBy,
        activityType,
        description ?? null,
        entityType ?? null,
        entityId ?? null,
        ipAddress,
        userAgent,
      ],
    );
  } catch (err) {
    console.error("Activity Log Error:", err);
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const { id: userId } = await context.params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!action || !["block", "unblock"].includes(action)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Use ?action=block or ?action=unblock",
      },
      { status: 400 },
    );
  }

  const currentUserId = session.user.id;
  const currentUserRole = session.user.role;

  if (currentUserId === userId) {
    return NextResponse.json(
      { success: false, error: "You cannot block/unblock yourself" },
      { status: 400 },
    );
  }

  try {
    const { rows } = await query(
      `SELECT id, created_by, role, email FROM users WHERE id = $1`,
      [userId],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const target = rows[0];

    const canUpdate =
      currentUserRole === "admin" ||
      (currentUserRole === "manager" && target.created_by === currentUserId);

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (currentUserRole === "manager" && target.role !== "scales_man") {
      return NextResponse.json(
        { success: false, error: "Managers can only manage sales reps" },
        { status: 403 },
      );
    }

    const { rows: updated } = await query(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, is_active`,
      [action === "unblock", userId],
    );

    // Log activity (does not block/fail the response)
    await logActivity({
      userId,
      performedBy: currentUserId,
      activityType: action === "block" ? "user_blocked" : "user_unblocked",
      description:
        action === "block"
          ? `User ${target.email} was blocked`
          : `User ${target.email} was unblocked`,
      entityType: "user",
      entityId: userId,
      req,
    });

    return NextResponse.json({
      success: true,
      message:
        action === "block"
          ? "User blocked successfully"
          : "User unblocked successfully",
      user: updated[0],
    });
  } catch (err) {
    console.error("Block/Unblock API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
