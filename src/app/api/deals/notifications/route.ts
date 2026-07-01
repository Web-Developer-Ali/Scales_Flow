import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// ── GET: fetch notifications for logged-in user ───────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  try {
    const WHERE = unreadOnly
      ? `WHERE user_id = $1 AND is_read = FALSE`
      : `WHERE user_id = $1`;

    const { rows } = await query(
      `SELECT
         id, type, title, message,
         entity_type, entity_id,
         is_read, read_at, created_at
       FROM notifications
       ${WHERE}
       ORDER BY created_at DESC
       LIMIT $2`,
      [session.user.id, limit],
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [session.user.id],
    );
    return NextResponse.json({
      success: true,
      notifications: rows,
      unreadCount: Number(countRows[0].unread_count),
    });
  } catch (err) {
    console.error("Notifications GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ── PATCH: mark one or all notifications as read ──────────────────────────────
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      // Mark every unread notification for this user as read
      await query(
        `UPDATE notifications
         SET is_read = TRUE, read_at = NOW()
         WHERE user_id = $1 AND is_read = FALSE`,
        [session.user.id],
      );
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (id) {
      // Mark a single notification as read
      // WHERE includes user_id to prevent reading other users' notifications
      const { rows } = await query(
        `UPDATE notifications
         SET is_read = TRUE, read_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [id, session.user.id],
      );

      if (!rows.length) {
        return NextResponse.json(
          { success: false, error: "Notification not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Provide id or markAllRead: true" },
      { status: 400 },
    );
  } catch (err) {
    console.error("Notifications PATCH Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
