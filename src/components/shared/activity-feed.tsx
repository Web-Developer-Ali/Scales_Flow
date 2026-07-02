"use client";

import { useActivityFeed, ActivityTypeFilter } from "./use-activity-feed";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, RefreshCw } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const getInitials = (name: string | null) =>
  (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${val.toFixed(0)}`;
  return "$0";
}

// ── Activity config ────────────────────────────────────────────────────────────
const ACTIVITY_CONFIG: Record<
  string,
  {
    emoji: string;
    color: string;
    label: string;
  }
> = {
  deal_created: {
    emoji: "📋",
    color: "bg-blue-500/10 text-blue-500",
    label: "Deal Created",
  },
  deal_updated: {
    emoji: "✏️",
    color: "bg-amber-500/10 text-amber-500",
    label: "Deal Updated",
  },
  deal_deleted: {
    emoji: "🗑️",
    color: "bg-red-500/10 text-red-500",
    label: "Deal Deleted",
  },
  user_created: {
    emoji: "👤",
    color: "bg-emerald-500/10 text-emerald-500",
    label: "User Created",
  },
  user_blocked: {
    emoji: "🚫",
    color: "bg-red-500/10 text-red-500",
    label: "User Blocked",
  },
  user_unblocked: {
    emoji: "✅",
    color: "bg-emerald-500/10 text-emerald-500",
    label: "User Unblocked",
  },
  user_deleted: {
    emoji: "❌",
    color: "bg-red-500/10 text-red-500",
    label: "User Deleted",
  },
  team_assigned: {
    emoji: "🔗",
    color: "bg-purple-500/10 text-purple-500",
    label: "Team Assigned",
  },
};

// ── Build human-readable sentence from activity ────────────────────────────────
function buildActivityText(
  activity: ReturnType<typeof useActivityFeed>["activities"][0],
) {
  const type = activity.activity_type;

  const actor = [
    "user_created",
    "user_blocked",
    "user_unblocked",
    "user_deleted",
    "team_assigned",
  ].includes(type)
    ? (activity.performed_by_name ?? activity.user_name ?? "Someone")
    : (activity.user_name ?? "Someone");

  switch (type) {
    case "user_created":
      return {
        actor,
        action: "created new team member",
        subject: activity.affected_user_name,
        detail: null,
      };

    case "user_blocked":
      return {
        actor,
        action: "blocked",
        subject: activity.affected_user_name,
        detail: null,
      };

    case "user_unblocked":
      return {
        actor,
        action: "unblocked",
        subject: activity.affected_user_name,
        detail: null,
      };

    case "user_deleted":
      return {
        actor,
        action: "deleted team member",
        subject: activity.affected_user_name,
        detail: null,
      };

    case "team_assigned":
      return {
        actor,
        action: activity.description?.includes("Unassigned")
          ? "unassigned team member"
          : "assigned team member",
        subject: activity.affected_user_name,
        detail: null,
      };

    // deal activities stay unchanged
    case "deal_created":
      return {
        actor,
        action: "created a new deal",
        subject: activity.deal_title ?? activity.deal_company,
        detail: activity.deal_value
          ? formatAmount(Number(activity.deal_value))
          : null,
      };

    case "deal_updated":
      return {
        actor,
        action: "updated deal",
        subject: activity.deal_title ?? activity.deal_company,
        detail: null,
      };

    case "deal_deleted":
      return {
        actor,
        action: "deleted deal",
        subject: activity.deal_title ?? activity.deal_company,
        detail: null,
      };

    default:
      return {
        actor,
        action: activity.description ?? type.replace(/_/g, " "),
        subject: null,
        detail: null,
      };
  }
}

// ── Role color for avatar ──────────────────────────────────────────────────────
const ROLE_AVATAR: Record<string, string> = {
  admin: "bg-red-500/20 text-red-600",
  manager: "bg-amber-500/20 text-amber-600",
  scales_man: "bg-blue-500/20 text-blue-600",
};

// ── Type filter options ────────────────────────────────────────────────────────
const TYPE_FILTERS: { value: ActivityTypeFilter; label: string }[] = [
  { value: "all", label: "All Activity" },
  { value: "deal_created", label: "Deals Created" },
  { value: "deal_updated", label: "Deals Updated" },
  { value: "deal_deleted", label: "Deals Deleted" },
  { value: "user_created", label: "Users Created" },
  { value: "user_blocked", label: "Users Blocked" },
  { value: "user_unblocked", label: "Users Unblocked" },
  { value: "user_deleted", label: "Users Deleted" },
  { value: "team_assigned", label: "Team Assigned" },
];

// ── Props ──────────────────────────────────────────────────────────────────────
interface ActivityFeedProps {
  role: "admin" | "manager";
  // Route builder — each role navigates differently
  getEntityRoute?: (
    entityType: string | null,
    entityId: string | null,
  ) => string | null;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function ActivityFeed({ role, getEntityRoute }: ActivityFeedProps) {
  const router = useRouter();

  const {
    activities,
    total,
    loading,
    loadingMore,
    error,
    typeFilter,
    hasMore,
    setTypeFilter,
    loadMore,
    refetch,
  } = useActivityFeed();

  const handleClick = (activity: (typeof activities)[0]) => {
    if (!getEntityRoute) return;
    const route = getEntityRoute(activity.entity_type, activity.entity_id);
    if (route) router.push(route);
  };

  return (
    <div className="space-y-4">
      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{total} total events</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ActivityTypeFilter)}
          >
            <SelectTrigger className="w-44 h-8 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="h-8 gap-1.5 text-xs bg-transparent"
            disabled={loading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Feed ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-16 text-center rounded-lg bg-card border border-border">
          <p className="text-sm text-muted-foreground">
            {typeFilter === "all"
              ? "No activity yet."
              : `No "${typeFilter.replace(/_/g, " ")}" events yet.`}
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          {activities.map((activity, i) => {
            const config = ACTIVITY_CONFIG[activity.activity_type] ?? {
              emoji: "🔔",
              color: "bg-gray-500/10 text-gray-500",
              label: activity.activity_type,
            };
            const { actor, action, subject, detail } =
              buildActivityText(activity);
            const hasRoute = !!getEntityRoute?.(
              activity.entity_type,
              activity.entity_id,
            );

            return (
              <div
                key={activity.id}
                onClick={() => handleClick(activity)}
                className={`flex items-start gap-4 px-5 py-4
                  border-b border-border last:border-0
                  transition-colors
                  ${
                    hasRoute
                      ? "cursor-pointer hover:bg-secondary/30"
                      : "cursor-default hover:bg-secondary/10"
                  }`}
              >
                {/* Avatar */}
                <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                  <AvatarFallback
                    className={`text-xs font-semibold ${
                      ROLE_AVATAR[activity.user_role ?? ""] ??
                      "bg-gray-500/20 text-gray-500"
                    }`}
                  >
                    {getInitials(activity.user_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-semibold">{actor}</span>{" "}
                    <span className="text-muted-foreground">{action}</span>
                    {subject && (
                      <>
                        {" "}
                        <span className="font-medium text-foreground">
                          {subject}
                        </span>
                      </>
                    )}
                    {detail && (
                      <span className="text-emerald-600 font-semibold">
                        {" "}
                        · {detail}
                      </span>
                    )}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge
                      className={`text-xs px-1.5 py-0 h-5 ${config.color}`}
                    >
                      {config.emoji} {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(activity.created_at)}
                    </span>
                    {activity.performed_by &&
                      activity.performed_by !== activity.user_id && (
                        <span className="text-xs text-muted-foreground">
                          via {activity.performed_by_name}
                        </span>
                      )}
                  </div>
                </div>

                {/* Index number */}
                <span className="text-xs font-mono text-muted-foreground/40 flex-shrink-0 mt-1">
                  #{i + 1}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Load More ─────────────────────────────────────────────────── */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="gap-2 bg-transparent text-sm"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load More (${total - activities.length} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
