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
import { TeamPerformanceProps } from "@/types/admin_dashboard_types";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export function TeamPerformance({
  data = [],
  isLoading = false,
}: TeamPerformanceProps) {
  const target = 10;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
        <CardDescription>Deals closed this quarter</CardDescription>
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
          ) : (
            <>
              {data.map((member) => {
                const percentage = (member.closed_deals / target) * 100;
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.closed_deals} / {target} deals
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
