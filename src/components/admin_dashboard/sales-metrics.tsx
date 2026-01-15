"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesMetricsProps } from "@/types/admin_dashboard_types";

export function SalesMetrics({
  totalPipeline = 0,
  closedThisMonth = 0,
  targetProgress = { closed: 0, target: 0, percent: 0 },
  avgCloseTime = 0,
  isLoading = false,
}: SalesMetricsProps) {
  const metrics = [
    {
      title: "Total Pipeline",
      value: `$${(totalPipeline / 1000000).toFixed(1)}M`,
      change: "+12%",
      icon: DollarSign,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Closed This Month",
      value: `$${(closedThisMonth / 1000).toFixed(0)}K`,
      change: "+8%",
      icon: TrendingUp,
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Deal Target",
      value: `${targetProgress.closed} / ${targetProgress.target}`,
      change: `${targetProgress.percent}%`,
      icon: Target,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Avg. Close Time",
      value: `${avgCloseTime} days`,
      change: "-3 days",
      icon: Clock,
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.change} from last month
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
