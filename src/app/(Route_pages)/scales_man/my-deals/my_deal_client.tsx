"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Target,
  Percent,
  X,
  ArrowUpDown,
} from "lucide-react";
import { useMyDeals } from "@/components/scales_man/my-deals-forScaleRep/use-my-deals";
import { RepDashboardHeader } from "@/components/scales_man/navbar";

// ── Constants matching DB enum exactly ────────────────────────────────────────
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
];

const STAGE_STYLES: Record<string, string> = {
  prospect: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  qualified: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  demo: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  negotiation: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
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

// ── Probability color ──────────────────────────────────────────────────────────
function getProbabilityColor(prob: number) {
  if (prob >= 75) return "text-emerald-500";
  if (prob >= 50) return "text-amber-500";
  if (prob >= 25) return "text-orange-500";
  return "text-red-500";
}

// ── Days in stage urgency color ────────────────────────────────────────────────
function getDaysColor(days: number) {
  if (days >= 21) return "text-red-500";
  if (days >= 14) return "text-amber-500";
  return "text-muted-foreground";
}

export function MyDealsClient() {
  const router = useRouter();
  const { deals, stats, filters, loading, error, updateFilter, resetFilters } =
    useMyDeals();

  const hasActiveFilters =
    filters.stage !== "all" ||
    filters.status !== "all" ||
    filters.search !== "" ||
    filters.sort !== "created_at_desc";

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <RepDashboardHeader />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Deals</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track all your opportunities
              </p>
            </div>
            <Button
              onClick={() => router.push("/deals/add_deal")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Deal
            </Button>
          </div>

          {/* ── Quick Stats ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))
            ) : (
              <>
                {[
                  {
                    label: "Total Pipeline",
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

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company or contact..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>

            {/* Stage filter */}
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

            {/* Status filter */}
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

            {/* Reset */}
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

          {/* Results count */}
          {!loading && (
            <p className="text-xs text-muted-foreground">
              {deals.length} deal{deals.length !== 1 ? "s" : ""} found
              {hasActiveFilters && " (filtered)"}
            </p>
          )}
        </div>

        {/* ── Deals List ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="py-20 text-center rounded-lg bg-card border border-border">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {hasActiveFilters
                ? "No deals match your filters"
                : "No deals yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Create your first deal to start tracking your pipeline."}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => router.push("/deals/add_deal")}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Deal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => router.push(`/deals/deal_details/${deal.id}`)}
                className="p-5 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: company + contact */}
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
                    {deal.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                        {deal.description}
                      </p>
                    )}
                  </div>

                  {/* Right: value */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(Number(deal.value))}
                    </p>
                    {deal.expected_close_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Close:{" "}
                        {new Date(deal.expected_close_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className={
                      STAGE_STYLES[deal.stage] ?? "bg-gray-500/10 text-gray-400"
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
    </main>
  );
}
