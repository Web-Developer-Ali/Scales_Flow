"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { NeedsAttentionDeal } from "@/types/scales_man/dashboard";

interface Props {
  data?: NeedsAttentionDeal[];
  isLoading?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-slate-500/10 text-slate-400",
  qualified: "bg-blue-500/10 text-blue-400",
  demo: "bg-cyan-500/10 text-cyan-400",
  negotiation: "bg-amber-500/10 text-amber-400",
  closed: "bg-emerald-500/10 text-emerald-400",
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function getStalenessColor(days: number) {
  if (days >= 14) return "text-red-500";
  if (days >= 7) return "text-amber-500";
  return "text-blue-500";
}

export function NeedsAttention({ data = [], isLoading = false }: Props) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Needs Attention
        </CardTitle>
        <CardDescription>
          High-value deals with no activity in 5+ days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-foreground">
              All caught up!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No stalled deals right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((deal) => (
              <div
                key={deal.id}
                className="p-3 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {deal.company}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {deal.title}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary whitespace-nowrap">
                    {formatCurrency(Number(deal.value))}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      STAGE_COLORS[deal.stage] ?? "bg-gray-500/10 text-gray-400"
                    }
                  >
                    {capitalize(deal.stage)}
                  </Badge>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {deal.probability}% prob
                    </span>
                    <span
                      className={`font-semibold ${getStalenessColor(deal.days_stale)}`}
                    >
                      {Math.round(deal.days_stale)}d stale
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
