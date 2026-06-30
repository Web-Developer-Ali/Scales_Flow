"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  AlertCircle,
  DollarSign,
  Target,
  TrendingUp,
  Percent,
  Clock,
  Award,
  Trophy,
} from "lucide-react";
import { useRepPerformance } from "@/components/scales_man/performance/use-rep-performance";
import { RepDashboardHeader } from "@/components/scales_man/navbar";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${Number(val).toFixed(0)}`;
  return "$0";
}

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

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function RepPerformanceClient() {
  const { data, loading, error } = useRepPerformance();

  const targetPercent = data?.thisMonth.total_created
    ? Math.round(
        (data.thisMonth.total_won / data.thisMonth.total_created) * 100,
      )
    : 0;

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <RepDashboardHeader />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">My Performance</h1>
          <p className="text-muted-foreground mt-1">
            Your sales history, trends, and personal targets
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── 1. All-Time Summary ─────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="All-Time Performance"
            sub="Your totals since you joined"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                title: "Total Revenue",
                value: formatAmount(Number(data?.allTime.total_revenue ?? 0)),
                sub: `${data?.allTime.total_won ?? 0} deals won`,
                icon: DollarSign,
                iconColor: "bg-emerald-500/10 text-emerald-500",
              },
              {
                title: "Active Pipeline",
                value: formatAmount(Number(data?.allTime.total_pipeline ?? 0)),
                sub: `${data?.allTime.total_active ?? 0} active deals`,
                icon: TrendingUp,
                iconColor: "bg-blue-500/10 text-blue-500",
              },
              {
                title: "Win Rate",
                value: `${data?.allTime.win_rate ?? 0}%`,
                sub: "Won / (Won + Lost)",
                icon: Percent,
                iconColor: "bg-amber-500/10 text-amber-500",
              },
              {
                title: "Avg Deal Size",
                value: formatAmount(Number(data?.allTime.avg_deal_size ?? 0)),
                sub: "Won deals only",
                icon: Target,
                iconColor: "bg-purple-500/10 text-purple-500",
              },
              {
                title: "Avg Close Time",
                value: `${data?.allTime.avg_close_days ?? 0}d`,
                sub: "Days to win",
                icon: Clock,
                iconColor: "bg-cyan-500/10 text-cyan-500",
              },
              {
                title: "Total Deals",
                value: String(data?.allTime.total_deals ?? 0),
                sub: `${data?.allTime.total_lost ?? 0} lost`,
                icon: Award,
                iconColor: "bg-gray-500/10 text-gray-500",
              },
            ].map((card) => (
              <StatCard key={card.title} {...card} loading={loading} />
            ))}
          </div>
        </section>

        {/* ── 2. This Month Target ────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="This Month"
            sub="Deals closed out of total created this month"
          />
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="p-6 rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Deals Closed This Month
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {data?.thisMonth.total_won ?? 0}
                    <span className="text-lg text-muted-foreground font-normal">
                      {" "}
                      / {data?.thisMonth.total_created ?? 0}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Revenue This Month
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatAmount(Number(data?.thisMonth.revenue ?? 0))}
                  </p>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${Math.min(targetPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {targetPercent}% closed this month
              </p>
            </div>
          )}
        </section>

        {/* ── 3. 6-Month Revenue Trend ─────────────────────────────────── */}
        <section>
          <SectionHeader
            title="6-Month Revenue Trend"
            sub="Won revenue and active pipeline over the last 6 months"
          />
          <div className="p-5 rounded-lg bg-card border border-border">
            {loading ? (
              <Skeleton className="w-full h-72" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data?.monthlyPerformance ?? []}
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
                    dataKey="revenue"
                    name="Revenue"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pipeline"
                    name="Pipeline"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ── 4. Win Rate + Deal Volume Trend ──────────────────────────── */}
        <section>
          <SectionHeader
            title="Win Rate & Deal Volume Trend"
            sub="How your win rate and deal flow changed over time"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Win rate line */}
            <div className="p-5 rounded-lg bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3">
                Win Rate %
              </p>
              {loading ? (
                <Skeleton className="w-full h-56" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={data?.monthlyPerformance ?? []}
                    margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="month_label"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                        fontSize: 12,
                      }}
                      formatter={(value) => [`${Number(value ?? 0)}%`]}
                    />
                    <Line
                      type="monotone"
                      dataKey="win_rate"
                      name="Win Rate"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Deal volume */}
            <div className="p-5 rounded-lg bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3">
                Deal Volume
              </p>
              {loading ? (
                <Skeleton className="w-full h-56" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={data?.monthlyPerformance ?? []}
                    margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
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
                      name="Total"
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
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* ── 5. Current Pipeline by Stage + Best Month ────────────────── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stage breakdown */}
            <div className="lg:col-span-2">
              <SectionHeader
                title="Current Active Pipeline"
                sub="Your open deals broken down by stage"
              />
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : (data?.stageBreakdown ?? []).length === 0 ? (
                <div className="py-12 text-center rounded-lg bg-card border border-border">
                  <Target className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No active deals right now.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-lg bg-card border border-border">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={data?.stageBreakdown ?? []}
                      layout="vertical"
                      margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                      />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickFormatter={capitalize}
                        width={80}
                      />
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
                      <Bar dataKey="count" name="Deals" radius={[0, 4, 4, 0]}>
                        {(data?.stageBreakdown ?? []).map((entry, i) => (
                          <Bar
                            key={i}
                            dataKey="count"
                            fill={STAGE_COLORS[entry.stage] ?? "#6b7280"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Best month card */}
            <div>
              <SectionHeader
                title="Personal Best"
                sub="Your highest revenue month"
              />
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : data?.bestMonth ? (
                <div className="p-6 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 text-center h-full flex flex-col items-center justify-center">
                  <Trophy className="w-10 h-10 text-amber-500 mb-3" />
                  <p className="text-2xl font-bold text-foreground">
                    {formatAmount(Number(data.bestMonth.revenue))}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.bestMonth.month_label}
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-card border border-border text-center h-full flex flex-col items-center justify-center">
                  <Trophy className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No closed deals yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
