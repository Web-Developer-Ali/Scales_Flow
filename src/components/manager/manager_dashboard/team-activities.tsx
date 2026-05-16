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
import { Skeleton } from "@/components/ui/skeleton";
import { TeamRecentDeal } from "@/types/manager/dashboard";

interface Props {
  data?: TeamRecentDeal[];
  isLoading?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-slate-500/20 text-slate-400",
  qualified: "bg-blue-500/20 text-blue-400",
  demo: "bg-cyan-500/20 text-cyan-400",
  negotiation: "bg-amber-500/20 text-amber-400",
  closed: "bg-emerald-500/20 text-emerald-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-500",
  won: "bg-emerald-500/10 text-emerald-600",
  lost: "bg-red-500/10 text-red-500",
  "on-hold": "bg-gray-500/10 text-gray-500",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function TeamActivities({ data = [], isLoading = false }: Props) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Team Recent Deals</CardTitle>
        <CardDescription>
          Latest deals updated by your team this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No team deals this month yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Rep", "Company", "Value", "Stage", "Status", "Days"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`py-3 px-3 font-semibold text-muted-foreground ${
                          i === 5 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(deal.rep_name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">
                          {deal.rep_name ?? "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">
                      {deal.company}
                    </td>
                    <td className="py-3 px-3 font-semibold text-primary">
                      {formatCurrency(Number(deal.value))}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        className={
                          STAGE_COLORS[deal.stage] ??
                          "bg-gray-500/20 text-gray-400"
                        }
                      >
                        {capitalize(deal.stage)}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        className={
                          STATUS_COLORS[deal.status] ??
                          "bg-gray-500/10 text-gray-500"
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
