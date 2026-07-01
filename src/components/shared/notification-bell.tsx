"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "./use-notifications";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, CheckCheck, X } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
  deal_assigned: "📋",
  deal_stage_changed: "🔄",
  deal_won: "🎉",
  deal_lost: "❌",
  deal_stalled: "⚠️",
  monthly_target_reminder: "🎯",
  team_member_created: "👤",
  deal_commented: "💬",
};

// ── Route builder ─────────────────────────────────────────────────────────────
function getEntityRoute(
  entityType: string | null,
  entityId: string | null,
  role: string,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "deal") {
    return role === "scales_man"
      ? `/scales_man/deal_details/${entityId}`
      : `/scales_man/deal_details/${entityId}`;
  }
  if (entityType === "user") {
    return role === "admin" ? `/admin/team` : null;
  }
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function NotificationBell({ role }: { role: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = async (n: (typeof notifications)[0]) => {
    if (!n.is_read) await markRead(n.id);
    const route = getEntityRoute(n.entity_type, n.entity_id, role);
    if (route) {
      router.push(route);
      setOpen(false);
    }
  };

  return (
    <div ref={dropRef} className="relative">
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500/10 text-red-500 font-medium px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  All read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const hasRoute = !!getEntityRoute(
                    n.entity_type,
                    n.entity_id,
                    role,
                  );
                  return (
                    <li key={n.id}>
                      <div
                        onClick={() => hasRoute && handleClick(n)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3
                          border-b border-border last:border-0 transition-colors
                          ${
                            n.is_read
                              ? "bg-card hover:bg-secondary/30"
                              : "bg-primary/5 hover:bg-primary/10"
                          }
                          ${hasRoute ? "cursor-pointer" : "cursor-default"}`}
                        role={hasRoute ? "button" : "presentation"}
                        tabIndex={hasRoute ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (
                            hasRoute &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            handleClick(n);
                          }
                        }}
                      >
                        {/* Type icon */}
                        <span className="text-base flex-shrink-0 mt-0.5">
                          {TYPE_ICONS[n.type] ?? "🔔"}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-xs font-semibold leading-snug ${
                                n.is_read
                                  ? "text-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {n.title}
                            </p>
                            {/* Unread dot */}
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {n.message}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>

                        {/* Mark read button */}
                        {!n.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(n.id);
                            }}
                            className="flex-shrink-0 p-1 rounded hover:bg-secondary transition-colors mt-0.5"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-secondary/20">
              <p className="text-xs text-muted-foreground text-center">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
