"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RepMetricsData } from "@/types/scales_man/dashboard";

interface Props {
  metrics?: RepMetricsData;
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

export function RepMetrics({ metrics, isLoading = false }: Props) {
  const pipelineFmt = formatDelta(metrics?.pipelineDelta);
  const closedFmt = formatDelta(metrics?.closedDelta);

  const cards = [
    {
      title: "My Pipeline",
      value: formatAmount(metrics?.pipelineValue ?? 0),
      change: pipelineFmt.label,
      positive: pipelineFmt.positive,
      icon: DollarSign,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Closed This Month",
      value: formatAmount(metrics?.closedValue ?? 0),
      change: closedFmt.label,
      positive: closedFmt.positive,
      icon: TrendingUp,
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "My Target",
      // Real: closed out of total created this month
      value: `${metrics?.closedCount ?? 0} / ${metrics?.totalCreated ?? 0}`,
      change:
        (metrics?.totalCreated ?? 0) > 0
          ? `${metrics?.targetPercent ?? 0}% of deals closed this month`
          : "No deals created yet",
      positive: (metrics?.targetPercent ?? 0) >= 50,
      icon: Target,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Hot Leads",
      value: `${metrics?.hotLeads ?? 0}`,
      change: "Deals with 60%+ probability",
      positive: true,
      icon: Zap,
      color: "bg-red-500/10 text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const DeltaIcon = card.positive ? TrendingUp : TrendingDown;
        return (
          <Card key={card.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {card.value}
                  </div>
                  <p
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      card.positive ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    <DeltaIcon className="w-3 h-3" />
                    {card.change}
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
