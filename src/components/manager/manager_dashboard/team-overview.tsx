"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RepPerformance } from "@/types/manager/dashboard";

interface Props {
  data?: RepPerformance[];
  isLoading?: boolean;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

// Smart formatter — no $0 for small values
function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${val.toFixed(0)}`;
  return "$0";
}

function getStatus(closed: number, total: number) {
  if (total === 0)
    return { label: "No Deals", className: "bg-gray-500/10 text-gray-500" };
  const pct = (closed / total) * 100;
  if (pct >= 100)
    return {
      label: "Exceeding",
      className: "bg-emerald-500/10 text-emerald-600",
    };
  if (pct >= 60)
    return { label: "On Track", className: "bg-blue-500/10 text-blue-600" };
  return { label: "At Risk", className: "bg-red-500/10 text-red-600" };
}

export function TeamOverview({ data = [], isLoading = false }: Props) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Team Overview</CardTitle>
        <CardDescription>
          Direct reports — deals closed vs total assigned this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No team members yet. Ask your admin to assign sales reps to you.
          </p>
        ) : (
          <div className="space-y-6">
            {data.map((rep) => {
              const total = Number(rep.total_assigned) || 0;
              const closed = Number(rep.closed_deals) || 0;
              const value = Number(rep.total_value) || 0;
              const pct = total > 0 ? Math.min((closed / total) * 100, 100) : 0;
              const status = getStatus(closed, total);

              return (
                <div
                  key={rep.id}
                  className="space-y-3 pb-4 border-b border-border last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                          {getInitials(rep.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {rep.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAmount(value)} revenue
                        </p>
                      </div>
                    </div>
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {/* Real: closed / total assigned this month */}
                        {closed} / {total} deals
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {total > 0 ? `${pct.toFixed(0)}%` : "—"}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
