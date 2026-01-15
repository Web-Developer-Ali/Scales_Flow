"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { DealPipelineProps } from "@/types/admin_dashboard_types";

const colors = [
  "#9333ea",
  "#3b82f6",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
];

export function DealPipeline({
  data = [],
  isLoading = false,
}: DealPipelineProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Deal Pipeline</CardTitle>
        <CardDescription>
          Deals by stage from first contact to closed sale
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full h-[300px]" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="stage" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: `1px solid var(--border)`,
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                />
                <Legend />
                <Bar dataKey="count" name="Deal Count" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {["Prospect", "Active", "Closing"].map((label, idx) => {
                const counts = {
                  Prospect:
                    data.find((d) => d.stage === "Prospect")?.count || 0,
                  Active: data
                    .filter((d) =>
                      ["Qualified", "Demo", "Proposal"].includes(d.stage)
                    )
                    .reduce((sum, d) => sum + d.count, 0),
                  Closing: data
                    .filter((d) => ["Negotiation"].includes(d.stage))
                    .reduce((sum, d) => sum + d.count, 0),
                };
                return (
                  <div
                    key={label}
                    className="p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <p className="text-xs text-muted-foreground font-medium">
                      {label}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-1">
                      {counts[label as keyof typeof counts]}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
