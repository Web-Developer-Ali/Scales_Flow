import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  // 🔐 Auth check
  if (!session || !session.user || !session.user.id || !session.user.role) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const { id: userId } = await context.params;

  const currentUserId = session.user.id;
  const currentUserRole = session.user.role;

  // ✅ Get action from query
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action"); // block | unblock

  if (!action || !["block", "unblock"].includes(action)) {
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  }

  try {
    // 1️⃣ Get user
    const userQuery = `
      SELECT id, created_by, role, is_active
      FROM users
      WHERE id = $1
    `;

    const { rows } = await query(userQuery, [userId]);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const targetUser = rows[0];

    // 2️⃣ Authorization
    let canUpdate = false;

    if (currentUserRole === "admin") {
      canUpdate = true;
    }

    if (
      currentUserRole === "manager" &&
      targetUser.created_by === currentUserId
    ) {
      canUpdate = true;
    }

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // 3️⃣ Prevent self block
    if (currentUserId === userId) {
      return NextResponse.json(
        { success: false, error: "You cannot block yourself" },
        { status: 400 },
      );
    }

    // 4️⃣ Manager restriction
    if (currentUserRole === "manager" && targetUser.role !== "scales_man") {
      return NextResponse.json(
        {
          success: false,
          error: "Managers can only manage sales users",
        },
        { status: 403 },
      );
    }

    // 5️⃣ Set status explicitly
    const newStatus = action === "unblock";

    const updateQuery = `
      UPDATE users
      SET is_active = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, is_active
    `;

    const { rows: updatedUser } = await query(updateQuery, [newStatus, userId]);

    return NextResponse.json({
      success: true,
      message:
        action === "block"
          ? "User blocked successfully"
          : "User unblocked successfully",
      user: updatedUser[0],
    });
  } catch (err) {
    console.error("Block/Unblock API Error:", err);

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
