import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { query } from "@/lib/db";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !session.user.role) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  // ✅ FIX HERE
  const { id: userIdToDelete } = await context.params;

  const currentUserId = session.user.id;
  const currentUserRole = session.user.role;

  try {
    const userCheckQuery = `
      SELECT id, created_by, role
      FROM users
      WHERE id = $1
    `;

    const { rows } = await query(userCheckQuery, [userIdToDelete]);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const targetUser = rows[0];

    let canDelete = false;

    if (currentUserRole === "admin") {
      canDelete = true;
    }

    if (
      currentUserRole === "manager" &&
      targetUser.created_by === currentUserId
    ) {
      canDelete = true;
    }

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (currentUserId === userIdToDelete) {
      return NextResponse.json(
        { success: false, error: "You cannot delete yourself" },
        { status: 400 },
      );
    }

    const deleteQuery = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id, email
    `;

    const { rows: deletedUser } = await query(deleteQuery, [userIdToDelete]);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      user: deletedUser[0],
    });
  } catch (err) {
    console.error("Delete User API Error:", err);

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
