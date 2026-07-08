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
import { RecentDealsProps } from "@/types/admin/admin_dashboard_types";

// Keys match DB enum (lowercase)
const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-slate-500/20 text-slate-300",
  qualified: "bg-blue-500/20 text-blue-300",
  demo: "bg-cyan-500/20 text-cyan-300",
  negotiation: "bg-orange-500/20 text-orange-300",
  closed: "bg-emerald-500/20 text-emerald-300",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatStageLabel = (stage: string) =>
  stage.charAt(0).toUpperCase() + stage.slice(1);

export function RecentDeals({
  data = [],
  isLoading = false,
}: RecentDealsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Recent Deals</CardTitle>
        <CardDescription>Active deals in the pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Company",
                      "Contact",
                      "Deal Value",
                      "Stage",
                      "Probability",
                      "Days",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`py-3 px-4 font-semibold text-muted-foreground ${
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
                      <td className="py-4 px-4 font-medium text-foreground">
                        {deal.company}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {deal.contact ?? "—"}
                      </td>
                      <td className="py-4 px-4 font-semibold text-primary">
                        {formatCurrency(Number(deal.value))}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={
                            STAGE_COLORS[deal.stage] ??
                            "bg-gray-500/20 text-gray-300"
                          }
                        >
                          {formatStageLabel(deal.stage)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary rounded-full h-1.5">
                            <div
                              className="bg-accent h-full rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {deal.probability}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-muted-foreground">
                        {/* API returns days_in_stage (snake_case) */}
                        {Math.round(deal.days_in_stage ?? 0)}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* <div className="mt-6 flex justify-center">
              <Button
                onClick={() => route.push("/deals/get_allDeals")}
                variant="ghost"
                className="gap-2"
              >
                View All Deals <ChevronRight className="w-4 h-4" />
              </Button>
            </div> */}
          </>
        )}
      </CardContent>
    </Card>
  );
}
