"use client";

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
  Users,
  BarChart3,
  Percent,
  Zap,
} from "lucide-react";
import { useManagerReports } from "@/components/manager/reports/use-manager-reports";
import { ManagerDashboardHeader } from "@/components/manager/manager-dashboard-header";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${Number(val).toFixed(0)}`;
  return "$0";
}

function delta(current: number, prev: number) {
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
export function ManagerReportsClient() {
  const { data, loading, error } = useManagerReports();

  // ── CSV Exports ──────────────────────────────────────────────────────────────
  const exportMonthly = () => {
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
      "manager-monthly-revenue",
    );
  };

  const exportReps = () => {
    if (!data?.repComparison) return;
    exportToCSV(
      data.repComparison.map((r) => ({
        Name: r.name,
        "Total Deals": r.total_deals,
        Won: r.won_deals,
        Lost: r.lost_deals,
        Active: r.active_deals,
        Revenue: r.total_revenue,
        Pipeline: r.pipeline_value,
        "Win Rate %": r.win_rate,
        "Avg Close Days": r.avg_close_days ?? "—",
      })),
      "manager-rep-comparison",
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
      "manager-deal-funnel",
    );
  };

  const revenueDelta = delta(
    Number(data?.thisMonth?.revenue ?? 0),
    Number(data?.lastMonth?.revenue ?? 0),
  );
  const pipelineDelta = delta(
    Number(data?.thisMonth?.pipeline ?? 0),
    Number(data?.lastMonth?.pipeline ?? 0),
  );

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <ManagerDashboardHeader />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Team Reports
              </h1>
              <p className="text-muted-foreground mt-1">
                Performance analytics for your team of{" "}
                <span className="font-medium text-foreground">
                  {data?.teamSize ?? "—"}
                </span>{" "}
                members
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportMonthly();
                exportReps();
                exportFunnel();
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
            title="Team Overview"
            sub="All-time totals for your team"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                title: "Team Revenue",
                value: formatAmount(Number(data?.summary?.total_revenue ?? 0)),
                sub: `${data?.summary?.total_won ?? 0} deals won`,
                icon: DollarSign,
                iconColor: "bg-emerald-500/10 text-emerald-500",
              },
              {
                title: "Active Pipeline",
                value: formatAmount(Number(data?.summary?.total_pipeline ?? 0)),
                sub: `${data?.summary?.total_active ?? 0} active deals`,
                icon: TrendingUp,
                iconColor: "bg-blue-500/10 text-blue-500",
              },
              {
                title: "Team Win Rate",
                value: `${data?.summary?.overall_win_rate ?? 0}%`,
                sub: "Won / (Won + Lost)",
                icon: Percent,
                iconColor: "bg-amber-500/10 text-amber-500",
              },
              {
                title: "Avg Deal Size",
                value: formatAmount(Number(data?.summary?.avg_deal_size ?? 0)),
                sub: "Won deals only",
                icon: Target,
                iconColor: "bg-purple-500/10 text-purple-500",
              },
              {
                title: "Avg Close Time",
                value: `${data?.summary?.avg_close_days ?? 0}d`,
                sub: "Days to win",
                icon: Clock,
                iconColor: "bg-cyan-500/10 text-cyan-500",
              },
              {
                title: "Total Deals",
                value: String(data?.summary?.total_deals ?? 0),
                sub: `${data?.summary?.total_lost ?? 0} lost`,
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
            sub="How your team is tracking compared to the previous period"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: "Team Revenue This Month",
                current: Number(data?.thisMonth?.revenue ?? 0),
                prev: Number(data?.lastMonth?.revenue ?? 0),
                d: revenueDelta,
                icon: DollarSign,
                color: "text-emerald-500",
              },
              {
                label: "Team Pipeline This Month",
                current: Number(data?.thisMonth?.pipeline ?? 0),
                prev: Number(data?.lastMonth?.pipeline ?? 0),
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
            title="Team Revenue by Month"
            sub="Won revenue and active pipeline — last 12 months"
            onExport={exportMonthly}
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

        {/* ── 4. Rep-by-Rep Comparison ────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Rep-by-Rep Comparison"
            sub="Every team member side by side — all time"
            onExport={exportReps}
          />
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
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
                  {(data?.repComparison ?? []).map((rep, i) => (
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
                            <AvatarFallback
                              className={`text-xs font-semibold ${
                                rep.id === data?.repComparison[0]?.id
                                  ? "bg-amber-500/20 text-amber-600"
                                  : "bg-primary/20 text-primary"
                              }`}
                            >
                              {getInitials(rep.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {rep.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rep.active_deals} active
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {formatAmount(Number(rep.total_revenue))}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {formatAmount(Number(rep.pipeline_value))}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-foreground">
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
                  {(data?.repComparison ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground text-sm"
                      >
                        No team data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 5. Who Is Closing Fastest This Month ────────────────────── */}
        <section>
          <SectionHeader
            title="Fastest Closers This Month"
            sub="Reps with the shortest avg time from deal created to won"
          />
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (data?.fastestClosers ?? []).length === 0 ? (
            <div className="py-10 text-center rounded-lg bg-card border border-border">
              <Zap className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No won deals this month yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.fastestClosers ?? []).map((rep, i) => (
                <div
                  key={rep.id}
                  className="p-5 rounded-lg bg-card border border-border flex items-center gap-4"
                >
                  <div className="relative">
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {getInitials(rep.name)}
                      </AvatarFallback>
                    </Avatar>
                    {i === 0 && (
                      <span className="absolute -top-1 -right-1 text-base">
                        🏆
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {rep.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rep.won_this_month} won this month
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-primary">
                      {rep.avg_close_days}d
                    </p>
                    <p className="text-xs text-muted-foreground">avg close</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 6. Deal Conversion Funnel ────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Deal Conversion Funnel"
            sub="How your team's deals progress from prospect to closed"
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
                          {f.won}/{f.total} won
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── 7. Pipeline Health ──────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Pipeline Health"
            sub="Active deals per stage — how long they've been sitting"
          />
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["Stage", "Deals", "Value", "Avg Days", "Health"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`py-3 px-5 font-semibold text-muted-foreground ${
                            i === 0 ? "text-left" : "text-right"
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
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
                              className="w-2.5 h-2.5 rounded-full"
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

        {/* ── 8. Deal Volume Trend ────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Deal Volume Trend"
            sub="Total deals created vs won per month across your team"
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
                    name="Won"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lost_deals"
                    name="Lost"
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
