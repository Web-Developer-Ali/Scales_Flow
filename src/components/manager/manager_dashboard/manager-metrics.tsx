"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Target, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ManagerDashboardData } from "@/types/manager/dashboard";

interface Props {
  personal?: ManagerDashboardData["personal"];
  team?: ManagerDashboardData["team"];
  isLoading?: boolean;
}

// Smart formatter — never shows $0K for small values
function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${val.toFixed(0)}`;
  return "$0";
}

function formatDelta(delta: number | null | undefined) {
  if (delta === null || delta === undefined)
    return { label: "No prior data", positive: true };
  return {
    label: `${delta >= 0 ? "+" : ""}${delta}% vs last month`,
    positive: delta >= 0,
  };
}

export function ManagerMetrics({ personal, team, isLoading = false }: Props) {
  const pipelineFmt = formatDelta(team?.pipelineDelta);
  const closedFmt = formatDelta(team?.closedDelta);

  const metrics = [
    {
      title: "Team Pipeline",
      value: formatAmount(team?.pipeline ?? 0),
      change: pipelineFmt.label,
      positive: pipelineFmt.positive,
      icon: TrendingUp,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Direct Reports",
      value: `${team?.size ?? 0}`,
      change: `${team?.closedCount ?? 0} deal${(team?.closedCount ?? 0) !== 1 ? "s" : ""} closed this month`,
      positive: true,
      icon: Users,
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Team Target",
      // closed out of total created this month — real numbers, no hardcoded 20
      value: `${team?.closedCount ?? 0} / ${team?.totalCreated ?? 0}`,
      change:
        (team?.totalCreated ?? 0) > 0
          ? `${team?.targetPercent ?? 0}% of deals closed this month`
          : "No deals created yet",
      positive: (team?.targetPercent ?? 0) >= 50,
      icon: Target,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "My Pipeline",
      value: formatAmount(personal?.pipeline ?? 0),
      change: `${personal?.closedCount ?? 0} deal${(personal?.closedCount ?? 0) !== 1 ? "s" : ""} closed personally`,
      positive: true,
      icon: Zap,
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const DeltaIcon = metric.positive ? TrendingUp : TrendingDown;
        return (
          <Card key={metric.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {metric.value}
                  </div>
                  <p
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      metric.positive ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    <DeltaIcon className="w-3 h-3" />
                    {metric.change}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
