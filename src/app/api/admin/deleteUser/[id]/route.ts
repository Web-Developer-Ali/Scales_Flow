import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { query } from "@/lib/db";

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

export async function DELETE(
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

  const { id: userIdToDelete } = await context.params;
  const currentUserId = session.user.id;
  const currentUserRole = session.user.role;

  if (currentUserId === userIdToDelete) {
    return NextResponse.json(
      { success: false, error: "You cannot delete yourself" },
      { status: 400 },
    );
  }

  try {
    const { rows } = await query(
      `SELECT id, created_by, role, email FROM users WHERE id = $1`,
      [userIdToDelete],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const target = rows[0];

    const canDelete =
      currentUserRole === "admin" ||
      (currentUserRole === "manager" &&
        target.created_by === currentUserId &&
        target.role === "scales_man"); // managers can only delete their own sales reps

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Log BEFORE deleting — user_activities.user_id has ON DELETE CASCADE,
    // so logging against the target after deletion would wipe the log row too.
    await logActivity({
      userId: currentUserId, // attribute the record to the actor, so it survives
      performedBy: currentUserId,
      activityType: "user_deleted",
      description: `Deleted user ${target.email} (id: ${userIdToDelete}, role: ${target.role})`,
      entityType: "user",
      entityId: userIdToDelete,
      req,
    });

    const { rows: deleted } = await query(
      `DELETE FROM users WHERE id = $1 RETURNING id, email`,
      [userIdToDelete],
    );

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      user: deleted[0],
    });
  } catch (err) {
    console.error("Delete User API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
