"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useClients } from "@/components/clients/use-clients";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  X,
  ArrowRight,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  TrendingUp,
  Target,
  ArrowUpDown,
} from "lucide-react";
import axios from "axios";

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Newest First" },
  { value: "created_at_asc", label: "Oldest First" },
  { value: "company_name_asc", label: "Name A–Z" },
  { value: "company_name_desc", label: "Name Z–A" },
  { value: "status_asc", label: "Status" },
];

const STATUS_STYLES: Record<string, string> = {
  prospect: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  inactive: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${val.toFixed(0)}`;
  return "$0";
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Add Client Dialog ──────────────────────────────────────────────────────────
function AddClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    website: "",
    address: "",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    status: "prospect",
    notes: "",
  });

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.company_name.trim()) {
      setError("Company name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.post("/api/clients", form);
      if (!data.success) throw new Error(data.error);
      onSuccess();
      onOpenChange(false);
      setForm({
        company_name: "",
        industry: "",
        website: "",
        address: "",
        primary_contact_name: "",
        primary_contact_email: "",
        primary_contact_phone: "",
        status: "prospect",
        notes: "",
      });
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to create client",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <Alert>{error}</Alert>
          </Alert>
        )}

        <div className="space-y-4 py-2">
          {/* Company */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Company Name <span className="text-red-500">*</span>
            </label>
            <Input
              name="company_name"
              placeholder="e.g. Acme Corp"
              value={form.company_name}
              onChange={handleInput}
              className="bg-background border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Industry
              </label>
              <Input
                name="industry"
                placeholder="e.g. SaaS, Retail"
                value={form.industry}
                onChange={handleInput}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Website
            </label>
            <Input
              name="website"
              placeholder="https://example.com"
              value={form.website}
              onChange={handleInput}
              className="bg-background border-border"
            />
          </div>

          {/* Contact */}
          <div className="pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Primary Contact
            </p>
            <div className="space-y-3">
              <Input
                name="primary_contact_name"
                placeholder="Contact name"
                value={form.primary_contact_name}
                onChange={handleInput}
                className="bg-background border-border"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="primary_contact_email"
                  type="email"
                  placeholder="Email"
                  value={form.primary_contact_email}
                  onChange={handleInput}
                  className="bg-background border-border"
                />
                <Input
                  name="primary_contact_phone"
                  placeholder="Phone"
                  value={form.primary_contact_phone}
                  onChange={handleInput}
                  className="bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <Textarea
              name="notes"
              placeholder="Any relevant info about this client..."
              value={form.notes}
              onChange={handleInput}
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="bg-transparent"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function ClientsClient() {
  const router = useRouter();
  const {
    clients,
    summary,
    industries,
    filters,
    loading,
    error,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    refetch,
  } = useClients();

  const [addOpen, setAddOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Clients</h1>
              <p className="text-muted-foreground mt-1">
                Manage your client relationships
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </div>

          {/* ── Summary strip ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              : [
                  {
                    label: "Total Clients",
                    value: summary?.totalClients ?? 0,
                    icon: Users,
                    color: "text-blue-500",
                  },
                  {
                    label: "Active",
                    value: summary?.activeClients ?? 0,
                    icon: TrendingUp,
                    color: "text-emerald-500",
                  },
                  {
                    label: "Prospects",
                    value: summary?.prospectClients ?? 0,
                    icon: Target,
                    color: "text-amber-500",
                  },
                  {
                    label: "Inactive",
                    value: summary?.inactiveClients ?? 0,
                    icon: Building2,
                    color: "text-gray-400",
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
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Filters ─────────────────────────────────────────────────── */}
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

            {/* Industry */}
            <Select
              value={filters.industry}
              onValueChange={(v) => updateFilter("industry", v)}
            >
              <SelectTrigger className="w-40 bg-background border-border">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
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
              {clients.length} client{clients.length !== 1 ? "s" : ""} found
              {hasActiveFilters && " (filtered)"}
            </p>
          )}
        </div>

        {/* ── Client Cards ────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="py-20 text-center rounded-lg bg-card border border-border">
            <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              {hasActiveFilters
                ? "No clients match your filters"
                : "No clients yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Add your first client to start tracking relationships."}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setAddOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Client
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/scales_man/clients/${client.id}`)}
                className="p-5 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {client.company_name}
                    </h3>
                    {client.industry && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.industry}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={STATUS_STYLES[client.status] ?? ""}
                  >
                    {capitalize(client.status)}
                  </Badge>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 mb-4">
                  {client.primary_contact_name && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users size={11} className="flex-shrink-0" />
                      <span className="truncate">
                        {client.primary_contact_name}
                      </span>
                    </div>
                  )}
                  {client.primary_contact_email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail size={11} className="flex-shrink-0" />
                      <span className="truncate">
                        {client.primary_contact_email}
                      </span>
                    </div>
                  )}
                  {client.primary_contact_phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone size={11} className="flex-shrink-0" />
                      <span>{client.primary_contact_phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe size={11} className="flex-shrink-0" />
                      <span className="truncate">{client.website}</span>
                    </div>
                  )}
                </div>

                {/* Deal stats */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex gap-4 text-xs">
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {client.total_deals}
                      </span>{" "}
                      deal{client.total_deals !== 1 ? "s" : ""}
                    </span>
                    {Number(client.total_revenue) > 0 && (
                      <span className="text-emerald-600 font-medium">
                        {formatAmount(Number(client.total_revenue))} revenue
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Client Dialog ────────────────────────────────────────────── */}
      <AddClientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={refetch}
      />
    </main>
  );
}
