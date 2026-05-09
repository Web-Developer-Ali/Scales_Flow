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
import type { RepDeal } from "./use-rep-dashboard";

interface Props {
  data?: RepDeal[];
  isLoading?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-slate-500/20 text-slate-300",
  qualified: "bg-blue-500/20 text-blue-300",
  demo: "bg-cyan-500/20 text-cyan-300",
  negotiation: "bg-amber-500/20 text-amber-300",
  closed: "bg-emerald-500/20 text-emerald-300",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-400",
  won: "bg-emerald-500/10 text-emerald-400",
  lost: "bg-red-500/10 text-red-400",
  "on-hold": "bg-gray-500/10 text-gray-400",
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function RepRecentDeals({ data = [], isLoading = false }: Props) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>My Recent Deals</CardTitle>
        <CardDescription>Your latest deals this month</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No deals this month yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Company",
                    "Contact",
                    "Value",
                    "Stage",
                    "Status",
                    "Days",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`py-3 px-3 font-semibold text-muted-foreground ${
                        i === 5 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-medium text-foreground">
                      {deal.company}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {deal.contact ?? "—"}
                    </td>
                    <td className="py-3 px-3 font-semibold text-primary">
                      {formatCurrency(Number(deal.value))}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        className={
                          STAGE_COLORS[deal.stage] ??
                          "bg-gray-500/20 text-gray-300"
                        }
                      >
                        {capitalize(deal.stage)}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        className={
                          STATUS_COLORS[deal.status] ??
                          "bg-gray-500/10 text-gray-400"
                        }
                      >
                        {capitalize(deal.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground">
                      {Math.round(deal.days_in_stage)}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
