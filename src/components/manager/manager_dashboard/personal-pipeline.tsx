"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MyDeal } from "@/types/manager/dashboard";

interface Props {
  deals?: MyDeal[];
  totalPipeline?: number;
  isLoading?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-slate-500/10 text-slate-500",
  qualified: "bg-blue-500/10 text-blue-500",
  demo: "bg-cyan-500/10 text-cyan-500",
  negotiation: "bg-amber-500/10 text-amber-500",
  closed: "bg-emerald-500/10 text-emerald-500",
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function PersonalPipeline({
  deals = [],
  totalPipeline = 0,
  isLoading = false,
}: Props) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>My Pipeline</CardTitle>
        <CardDescription>Your active deals this month</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                Total Pipeline Value
              </p>
              <p className="text-xl font-bold text-primary mt-1">
                {formatCurrency(totalPipeline)}
              </p>
            </div>

            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active deals assigned to you this month.
              </p>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {deal.company}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(Number(deal.value))}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 ml-3">
                      <Badge
                        variant="outline"
                        className={
                          STAGE_COLORS[deal.stage] ??
                          "bg-gray-500/10 text-gray-500"
                        }
                      >
                        {capitalize(deal.stage)}
                      </Badge>
                      <span className="text-xs font-semibold text-primary">
                        {deal.probability}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
