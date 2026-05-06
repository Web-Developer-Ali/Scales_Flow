import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { query } from "@/lib/db";

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
      `SELECT id, created_by, role FROM users WHERE id = $1`,
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
