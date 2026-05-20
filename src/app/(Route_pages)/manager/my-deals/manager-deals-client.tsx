"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowRight,
  AlertCircle,
  X,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
  Target,
  Users,
  Percent,
} from "lucide-react";
import { useManagerDeals } from "@/components/manager/my-deals/use-manager-deals";
import { ManagerDashboardHeader } from "@/components/manager/manager_dashboard/manager-dashboard-header";

// ── Constants ──────────────────────────────────────────────────────────────────
const STAGES = [
  { value: "all", label: "All Stages" },
  { value: "prospect", label: "Prospect" },
  { value: "qualified", label: "Qualified" },
  { value: "demo", label: "Demo" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed", label: "Closed" },
];

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "on-hold", label: "On Hold" },
];

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Newest First" },
  { value: "created_at_asc", label: "Oldest First" },
  { value: "value_desc", label: "Highest Value" },
  { value: "value_asc", label: "Lowest Value" },
  { value: "probability_desc", label: "Highest Probability" },
  { value: "days_desc", label: "Most Days in Stage" },
  { value: "rep_asc", label: "Rep Name A–Z" },
];

const STAGE_STYLES: Record<string, string> = {
  prospect: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  qualified: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  demo: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  negotiation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  won: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
  "on-hold": "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: val >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: val >= 1_000_000 ? 1 : 0,
  }).format(val);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const getDaysColor = (days: number) =>
  days >= 21
    ? "text-red-500"
    : days >= 14
      ? "text-amber-500"
      : "text-muted-foreground";

const getProbabilityColor = (prob: number) =>
  prob >= 75
    ? "text-emerald-500"
    : prob >= 50
      ? "text-amber-500"
      : prob >= 25
        ? "text-orange-500"
        : "text-red-500";

// ── Component ──────────────────────────────────────────────────────────────────
export function ManagerDealsClient() {
  const router = useRouter();
  const {
    deals,
    reps,
    stats,
    filters,
    loading,
    error,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  } = useManagerDeals();

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <ManagerDashboardHeader />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Team Deals</h1>
            <p className="text-muted-foreground mt-1">
              All deals across your team — filter by rep, stage, or status
            </p>
          </div>

          {/* ── Stats ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))
            ) : (
              <>
                {[
                  {
                    label: "Team Pipeline",
                    value: formatCurrency(stats?.totalPipeline ?? 0),
                    icon: DollarSign,
                    color: "text-blue-500",
                  },
                  {
                    label: "Active Deals",
                    value: stats?.activeCount ?? 0,
                    icon: TrendingUp,
                    color: "text-emerald-500",
                  },
                  {
                    label: "Avg Probability",
                    value: `${stats?.avgProbability ?? 0}%`,
                    icon: Percent,
                    color: "text-amber-500",
                  },
                  {
                    label: "Expected Revenue",
                    value: formatCurrency(stats?.expectedRevenue ?? 0),
                    icon: Target,
                    color: "text-purple-500",
                  },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div
                    key={label}
                    className="p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Left: Rep sidebar ──────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-card border border-border p-4 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Your Team
                </h2>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : reps.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No reps assigned to you yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* All reps option */}
                  <button
                    onClick={() => updateFilter("rep", "all")}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors border
                      ${
                        filters.rep === "all"
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary/30 border-transparent hover:bg-secondary/60 text-foreground"
                      }`}
                  >
                    <p className="font-medium">All Reps</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stats?.totalDeals ?? 0} total deals
                    </p>
                  </button>

                  {reps.map((rep) => (
                    <button
                      key={rep.id}
                      onClick={() => updateFilter("rep", rep.id)}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-colors border
                        ${
                          filters.rep === rep.id
                            ? "bg-primary/10 border-primary/30"
                            : "bg-secondary/30 border-transparent hover:bg-secondary/60"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(rep.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`font-medium truncate ${
                            filters.rep === rep.id
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {rep.name}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground ml-8">
                        <span>{rep.active_deals} active</span>
                        <span className="text-emerald-500">
                          {rep.won_deals} won
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Deals list ──────────────────────────────────────── */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="mb-5 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search company, contact, or rep..."
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    className="pl-10 bg-background border-border"
                  />
                </div>

                {/* Stage */}
                <Select
                  value={filters.stage}
                  onValueChange={(v) => updateFilter("stage", v)}
                >
                  <SelectTrigger className="w-40 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select
                  value={filters.status}
                  onValueChange={(v) => updateFilter("status", v)}
                >
                  <SelectTrigger className="w-36 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select
                  value={filters.sort}
                  onValueChange={(v) => updateFilter("sort", v)}
                >
                  <SelectTrigger className="w-44 bg-background border-border">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="gap-2 bg-transparent"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </Button>
                )}
              </div>

              {!loading && (
                <p className="text-xs text-muted-foreground">
                  {deals.length} deal{deals.length !== 1 ? "s" : ""} found
                  {hasActiveFilters && " (filtered)"}
                  {filters.rep !== "all" &&
                    reps.find((r) => r.id === filters.rep) && (
                      <span className="ml-1">
                        — {reps.find((r) => r.id === filters.rep)?.name}
                      </span>
                    )}
                </p>
              )}
            </div>

            {/* ── Deals ───────────────────────────────────────────────── */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-lg" />
                ))}
              </div>
            ) : deals.length === 0 ? (
              <div className="py-20 text-center rounded-lg bg-card border border-border">
                <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {hasActiveFilters
                    ? "No deals match your filters"
                    : "Your team has no deals yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters."
                    : "Deals created by your team will appear here."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={resetFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() =>
                      router.push(`/deals/deal_details/${deal.id}`)
                    }
                    className="p-5 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {deal.company}
                          </h3>
                          {deal.title !== deal.company && (
                            <span className="text-xs text-muted-foreground truncate">
                              {deal.title}
                            </span>
                          )}
                        </div>

                        {deal.contact_person && (
                          <p className="text-sm text-muted-foreground">
                            {deal.contact_person}
                            {deal.contact_email && (
                              <span className="ml-2 text-xs">
                                · {deal.contact_email}
                              </span>
                            )}
                          </p>
                        )}

                        {/* Rep attribution — key difference from rep view */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {getInitials(deal.rep_name ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {deal.rep_name}
                          </span>
                        </div>
                      </div>

                      {/* Right: value */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-foreground">
                          {formatCurrency(Number(deal.value))}
                        </p>
                        {deal.expected_close_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Close:{" "}
                            {new Date(
                              deal.expected_close_date,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className={
                          STAGE_STYLES[deal.stage] ??
                          "bg-gray-500/10 text-gray-400"
                        }
                      >
                        {capitalize(deal.stage)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          STATUS_STYLES[deal.status] ??
                          "bg-gray-500/10 text-gray-400"
                        }
                      >
                        {capitalize(deal.status)}
                      </Badge>
                      <span
                        className={`text-xs font-semibold ${getProbabilityColor(
                          deal.probability,
                        )}`}
                      >
                        {deal.probability}% probability
                      </span>
                      <span
                        className={`text-xs ml-auto ${getDaysColor(
                          deal.days_in_stage,
                        )}`}
                      >
                        {Math.round(deal.days_in_stage)}d in stage
                        {deal.days_in_stage >= 14 && " ⚠️"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
