"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamPerformanceProps } from "@/types/admin/admin_dashboard_types";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const formatValue = (val: number): string => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${val.toFixed(0)}`;
  return "$0";
};

export function TeamPerformance({
  data = [],
  isLoading = false,
}: TeamPerformanceProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
        <CardDescription>Deals closed this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No team activity this month yet.
            </p>
          ) : (
            data.map((member) => {
              const total = Number(member.total_assigned) || 0;
              const closed = Number(member.closed_deals) || 0;
              const value = Number(member.total_value) || 0;
              const percentage =
                total > 0 ? Math.min((closed / total) * 100, 100) : 0;

              return (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {closed} / {total} deals
                          {value > 0 && (
                            <span className="ml-2 text-emerald-600 font-medium">
                              · {formatValue(value)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {total > 0 ? `${percentage.toFixed(0)}%` : "—"}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
