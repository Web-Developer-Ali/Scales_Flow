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
import { DealPipelineProps } from "@/types/admin/admin_dashboard_types";

const STAGE_COLORS: Record<string, string> = {
  prospect: "#9333ea",
  qualified: "#3b82f6",
  demo: "#06b6d4",
  negotiation: "#f59e0b",
  closed: "#10b981",
};

// Matches your DB enum exactly (lowercase)
const STAGE_GROUPS = {
  Prospect: ["prospect"],
  Active: ["qualified", "demo"],
  Closing: ["negotiation"],
};

// Capitalize first letter for display only
const formatStageLabel = (stage: string) =>
  stage.charAt(0).toUpperCase() + stage.slice(1);

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
                <XAxis
                  dataKey="stage"
                  stroke="var(--muted-foreground)"
                  tickFormatter={formatStageLabel}
                />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                  labelFormatter={(label) => formatStageLabel(String(label))}
                />
                <Legend formatter={formatStageLabel} />
                <Bar dataKey="count" name="Deal Count" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STAGE_COLORS[entry.stage] ?? "#6b7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {(Object.entries(STAGE_GROUPS) as [string, string[]][]).map(
                ([label, stages]) => {
                  const count = data
                    .filter((d) => stages.includes(d.stage))
                    .reduce((sum, d) => sum + Number(d.count), 0);
                  return (
                    <div
                      key={label}
                      className="p-4 rounded-lg bg-secondary/50 border border-border"
                    >
                      <p className="text-xs text-muted-foreground font-medium">
                        {label}
                      </p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {count}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
