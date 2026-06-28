"use client";

import { useAdminReports } from "@/components/admin/reports/use-admin-reports";
import { exportToCSV } from "@/lib/export-csv";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Download,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  BarChart3,
  Percent,
} from "lucide-react";
import { AdminNavbar } from "@/components/admin/navbar";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${Number(val).toFixed(0)}`;
  return "$0";
}

function delta(
  current: number,
  prev: number,
): {
  pct: number | null;
  positive: boolean;
} {
  if (!prev) return { pct: null, positive: true };
  const pct = Math.round(((current - prev) / prev) * 100);
  return { pct, positive: pct >= 0 };
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const STAGE_COLORS: Record<string, string> = {
  prospect: "#64748b",
  qualified: "#3b82f6",
  demo: "#06b6d4",
  negotiation: "#f59e0b",
  closed: "#10b981",
};

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor,
  loading,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  loading?: boolean;
}) {
  return (
    <div className="p-5 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-28" />
      ) : (
        <>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  sub,
  onExport,
}: {
  title: string;
  sub?: string;
  onExport?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {onExport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-2 bg-transparent text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function AdminReportsClient() {
  const { data, loading, error } = useAdminReports();

  // ── CSV Exports ──────────────────────────────────────────────────────────────
  const exportMonthlyRevenue = () => {
    if (!data?.monthlyRevenue) return;
    exportToCSV(
      data.monthlyRevenue.map((m) => ({
        Month: m.month_label,
        "Won Revenue": m.won_revenue,
        Pipeline: m.pipeline_value,
        "Total Deals": m.total_deals,
        "Won Deals": m.won_deals,
        "Lost Deals": m.lost_deals,
      })),
      "salesflow-monthly-revenue",
    );
  };

  const exportTopReps = () => {
    if (!data?.topReps) return;
    exportToCSV(
      data.topReps.map((r) => ({
        Name: r.name,
        Role: r.role,
        "Total Deals": r.total_deals,
        "Won Deals": r.won_deals,
        "Lost Deals": r.lost_deals,
        "Total Revenue": r.total_revenue,
        "Pipeline Value": r.pipeline_value,
        "Win Rate %": r.win_rate,
        "Avg Close Days": r.avg_close_days ?? "—",
      })),
      "salesflow-rep-performance",
    );
  };

  const exportFunnel = () => {
    if (!data?.funnel) return;
    exportToCSV(
      data.funnel.map((f) => ({
        Stage: f.stage,
        Total: f.total,
        Won: f.won,
        Active: f.active,
        Lost: f.lost,
        "Conversion %": f.total > 0 ? Math.round((f.won / f.total) * 100) : 0,
      })),
      "salesflow-deal-funnel",
    );
  };

  const exportPipeline = () => {
    if (!data?.pipelineHealth) return;
    exportToCSV(
      data.pipelineHealth.map((p) => ({
        Stage: p.stage,
        "Deal Count": p.deal_count,
        "Stage Value": p.stage_value,
        "Avg Days": p.avg_days_in_stage,
      })),
      "salesflow-pipeline-health",
    );
  };

  // Month-on-month deltas
  const revenueDelta = delta(
    Number(data?.thisMonth.revenue ?? 0),
    Number(data?.lastMonth.revenue ?? 0),
  );
  const pipelineDelta = delta(
    Number(data?.thisMonth.pipeline ?? 0),
    Number(data?.lastMonth.pipeline ?? 0),
  );

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <AdminNavbar />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports</h1>
              <p className="text-muted-foreground mt-1">
                Full performance analytics across your agency
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportMonthlyRevenue();
                exportTopReps();
                exportFunnel();
                exportPipeline();
              }}
              className="gap-2 bg-transparent"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── 1. Summary KPIs ─────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Overall Performance"
            sub="All-time totals across every deal"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                title: "Total Revenue",
                value: formatAmount(Number(data?.summary.total_revenue ?? 0)),
                sub: `${data?.summary.total_won ?? 0} deals won`,
                icon: DollarSign,
                iconColor: "bg-emerald-500/10 text-emerald-500",
              },
              {
                title: "Active Pipeline",
                value: formatAmount(Number(data?.summary.total_pipeline ?? 0)),
                sub: `${data?.summary.total_active ?? 0} active deals`,
                icon: TrendingUp,
                iconColor: "bg-blue-500/10 text-blue-500",
              },
              {
                title: "Win Rate",
                value: `${data?.summary.overall_win_rate ?? 0}%`,
                sub: "Won / (Won + Lost)",
                icon: Percent,
                iconColor: "bg-amber-500/10 text-amber-500",
              },
              {
                title: "Avg Deal Size",
                value: formatAmount(Number(data?.summary.avg_deal_size ?? 0)),
                sub: "Won deals only",
                icon: Target,
                iconColor: "bg-purple-500/10 text-purple-500",
              },
              {
                title: "Avg Close Time",
                value: `${data?.summary.avg_close_days ?? 0}d`,
                sub: "Days to win",
                icon: Clock,
                iconColor: "bg-cyan-500/10 text-cyan-500",
              },
              {
                title: "Total Deals",
                value: String(data?.summary.total_deals ?? 0),
                sub: `${data?.summary.total_lost ?? 0} lost`,
                icon: BarChart3,
                iconColor: "bg-gray-500/10 text-gray-500",
              },
            ].map((card) => (
              <StatCard key={card.title} {...card} loading={loading} />
            ))}
          </div>
        </section>

        {/* ── 2. This Month vs Last Month ─────────────────────────────── */}
        <section>
          <SectionHeader
            title="This Month vs Last Month"
            sub="How you're tracking compared to the previous period"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: "Revenue This Month",
                current: Number(data?.thisMonth.revenue ?? 0),
                prev: Number(data?.lastMonth.revenue ?? 0),
                d: revenueDelta,
                icon: DollarSign,
                color: "text-emerald-500",
              },
              {
                label: "Pipeline This Month",
                current: Number(data?.thisMonth.pipeline ?? 0),
                prev: Number(data?.lastMonth.pipeline ?? 0),
                d: pipelineDelta,
                icon: TrendingUp,
                color: "text-blue-500",
              },
            ].map(({ label, current, prev, d, icon: Icon, color }) => (
              <div
                key={label}
                className="p-5 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {formatAmount(current)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        vs {formatAmount(prev)} last month
                      </p>
                    </div>
                    {d.pct !== null && (
                      <div
                        className={`flex items-center gap-1 text-sm font-semibold ${
                          d.positive ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {d.positive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {d.positive ? "+" : ""}
                        {d.pct}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Revenue by Month ─────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Revenue by Month"
            sub="Won revenue and active pipeline over the last 12 months"
            onExport={exportMonthlyRevenue}
          />
          <div className="p-5 rounded-lg bg-card border border-border">
            {loading ? (
              <Skeleton className="w-full h-72" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data?.monthlyRevenue ?? []}
                  margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="month_label"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickFormatter={(v) => formatAmount(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                    formatter={(value) => [formatAmount(Number(value ?? 0))]}
                  />
                  <Legend fontSize={12} />
                  <Bar
                    dataKey="won_revenue"
                    name="Won Revenue"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pipeline_value"
                    name="Pipeline"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ── 4. Deal Conversion Funnel ────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Deal Conversion Funnel"
            sub="How deals progress from prospect to closed across all time"
            onExport={exportFunnel}
          />
          <div className="p-5 rounded-lg bg-card border border-border">
            {loading ? (
              <Skeleton className="w-full h-64" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data?.funnel ?? []}
                    margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="stage"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickFormatter={capitalize}
                    />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                        fontSize: 12,
                      }}
                      labelFormatter={(l) => capitalize(String(l))}
                    />
                    <Legend fontSize={12} />
                    <Bar
                      dataKey="active"
                      name="Active"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="won"
                      name="Won"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="lost"
                      name="Lost"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Conversion rate per stage */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(data?.funnel ?? []).map((f) => {
                    const convRate =
                      f.total > 0 ? Math.round((f.won / f.total) * 100) : 0;
                    return (
                      <div
                        key={f.stage}
                        className="p-3 rounded-lg bg-secondary/30 border border-border text-center"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full mx-auto mb-1.5"
                          style={{
                            background: STAGE_COLORS[f.stage] ?? "#6b7280",
                          }}
                        />
                        <p className="text-xs font-medium text-foreground">
                          {capitalize(f.stage)}
                        </p>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                          {convRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {f.won} / {f.total} won
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── 5. Pipeline Health ──────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Pipeline Health"
            sub="Current active deals per stage — how long they've been sitting"
            onExport={exportPipeline}
          />
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {[
                      "Stage",
                      "Deals",
                      "Value",
                      "Avg Days in Stage",
                      "Health",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`py-3 px-5 font-semibold text-muted-foreground ${
                          i === 0 ? "text-left" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.pipelineHealth ?? []).map((p) => {
                    const days = Number(p.avg_days_in_stage);
                    const health =
                      days >= 21 ? "At Risk" : days >= 14 ? "Slow" : "Healthy";
                    const hColor =
                      days >= 21
                        ? "bg-red-500/10 text-red-500"
                        : days >= 14
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-emerald-500/10 text-emerald-600";
                    return (
                      <tr
                        key={p.stage}
                        className="border-b border-border last:border-0 hover:bg-secondary/20"
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                background: STAGE_COLORS[p.stage] ?? "#6b7280",
                              }}
                            />
                            <span className="font-medium text-foreground">
                              {capitalize(p.stage)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-right font-medium text-foreground">
                          {p.deal_count}
                        </td>
                        <td className="py-3 px-5 text-right font-semibold text-primary">
                          {formatAmount(Number(p.stage_value))}
                        </td>
                        <td className="py-3 px-5 text-right text-muted-foreground">
                          {days}d
                        </td>
                        <td className="py-3 px-5 text-right">
                          <Badge className={`${hColor} text-xs`}>
                            {health}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {(data?.pipelineHealth ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground text-sm"
                      >
                        No active deals in pipeline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 6. Top Performing Reps ──────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Rep Performance"
            sub="Top 10 reps by total revenue closed — all time"
            onExport={exportTopReps}
          />
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {[
                      "Rep",
                      "Role",
                      "Revenue",
                      "Pipeline",
                      "Deals",
                      "Win Rate",
                      "Avg Close",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`py-3 px-4 font-semibold text-muted-foreground ${
                          i === 0 ? "text-left" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.topReps ?? []).map((rep, i) => (
                    <tr
                      key={rep.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/20"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-4">
                            {i + 1}
                          </span>
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                              {getInitials(rep.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">
                            {rep.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            rep.role === "manager"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {rep.role === "manager" ? "Manager" : "Sales Rep"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {formatAmount(Number(rep.total_revenue))}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {formatAmount(Number(rep.pipeline_value))}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-foreground font-medium">
                          {rep.won_deals}
                        </span>
                        <span className="text-muted-foreground">
                          /{rep.total_deals}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            Number(rep.win_rate) >= 60
                              ? "text-emerald-500"
                              : Number(rep.win_rate) >= 40
                                ? "text-amber-500"
                                : "text-red-500"
                          }`}
                        >
                          {rep.win_rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {rep.avg_close_days != null
                          ? `${rep.avg_close_days}d`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {(data?.topReps ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground text-sm"
                      >
                        No rep data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 7. Deal Count Trend ─────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Deal Volume Trend"
            sub="Total deals created vs won per month"
          />
          <div className="p-5 rounded-lg bg-card border border-border">
            {loading ? (
              <Skeleton className="w-full h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={data?.monthlyRevenue ?? []}
                  margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="month_label"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Legend fontSize={12} />
                  <Line
                    type="monotone"
                    dataKey="total_deals"
                    name="Total Deals"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="won_deals"
                    name="Won Deals"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lost_deals"
                    name="Lost Deals"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
