"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesMetricsProps } from "@/types/admin/admin_dashboard_types";

function formatDelta(delta: number | null | undefined): {
  label: string;
  positive: boolean;
} {
  if (delta === null || delta === undefined) {
    return { label: "No prior month data", positive: true };
  }
  const sign = delta >= 0 ? "+" : "";
  return { label: `${sign}${delta}% from last month`, positive: delta >= 0 };
}

export function SalesMetrics({
  totalPipeline = 0,
  closedThisMonth = 0,
  targetProgress = { closed: 0, target: 0, percent: 0 },
  avgCloseTime = 0,
  pipelineDelta,
  closedDelta,
  isLoading = false,
}: SalesMetricsProps) {
  const pipelineFmt = formatDelta(pipelineDelta);
  const closedFmt = formatDelta(closedDelta);

  const metrics = [
    {
      title: "Total Pipeline",
      value: `$${(totalPipeline / 1_000_000).toFixed(1)}M`,
      change: pipelineFmt.label,
      positive: pipelineFmt.positive,
      icon: DollarSign,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Closed This Month",
      value: `$${(closedThisMonth / 1_000).toFixed(0)}K`,
      change: closedFmt.label,
      positive: closedFmt.positive,
      icon: TrendingUp,
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Deal Target",
      value: `${targetProgress.closed} / ${targetProgress.target}`,
      change: `${targetProgress.percent}% of monthly target`,
      positive: targetProgress.percent >= 50,
      icon: Target,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Avg. Close Time",
      value: `${avgCloseTime} days`,
      // No prior-month avg returned from API yet — neutral display
      change: "Days from open to won",
      positive: true,
      icon: Clock,
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
