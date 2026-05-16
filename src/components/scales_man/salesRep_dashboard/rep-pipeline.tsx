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
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { StageBreakdown, MonthlyTrend } from "./use-rep-dashboard";

interface Props {
  stageBreakdown?: StageBreakdown[];
  monthlyTrend?: MonthlyTrend[];
  isLoading?: boolean;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const STAGE_COLORS: Record<string, string> = {
  prospect: "#64748b",
  qualified: "#3b82f6",
  demo: "#06b6d4",
  negotiation: "#f59e0b",
  closed: "#10b981",
};

export function RepPipeline({
  stageBreakdown = [],
  monthlyTrend = [],
  isLoading = false,
}: Props) {
  // Recharts needs plain objects with display labels
  const stageData = stageBreakdown.map((s) => ({
    stage: capitalize(s.stage),
    deals: Number(s.deal_count),
    value: Number(s.stage_value),
    fill: STAGE_COLORS[s.stage] ?? "#6b7280",
  }));

  const trendData = monthlyTrend.map((t) => ({
    month: t.month_label,
    Won: Number(t.won_count),
    Active: Number(t.active_count),
  }));

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Your Pipeline by Stage</CardTitle>
        <CardDescription>
          Active deals at each stage of your sales cycle
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full h-[250px]" />
        ) : stageData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No active deals this month yet.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="stage"
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
              />
              <Bar
                dataKey="deals"
                name="Deal Count"
                radius={[8, 8, 0, 0]}
                // Per-bar color from our STAGE_COLORS map
                fill="#3b82f6"
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Monthly trend — last 6 months */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            6-Month Performance Trend
          </h3>
          {isLoading ? (
            <Skeleton className="w-full h-[200px]" />
          ) : trendData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Not enough history yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Won"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Active"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
