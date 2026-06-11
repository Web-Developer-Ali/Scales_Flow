"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useClientDetail } from "@/components/clients/clients_detail/use-client-detail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Edit2,
  Save,
  X,
  Trash2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  prospect: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  inactive: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const DEAL_STAGE_STYLES: Record<string, string> = {
  prospect: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  qualified: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  demo: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  negotiation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const DEAL_STATUS_STYLES: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-400",
  won: "bg-emerald-500/10 text-emerald-500",
  lost: "bg-red-500/10 text-red-400",
  "on-hold": "bg-gray-500/10 text-gray-400",
};

function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${val.toFixed(0)}`;
  return "$0";
}

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Component ──────────────────────────────────────────────────────────────────
export function ClientDetailClient({ clientId }: { clientId: string }) {
  const router = useRouter();
  const session = useSession();
  const role = session.data?.user?.role ?? "";
  const userId = session.data?.user?.id ?? "";

  const {
    client,
    deals,
    dealStats,
    loading,
    saving,
    error,
    updateClient,
    deleteClient,
  } = useClientDetail(clientId);

  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "destructive";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    variant: "default",
    onConfirm: () => {},
  });

  const openConfirm = (cfg: Omit<typeof confirm, "open">) =>
    setConfirm({ open: true, ...cfg });
  const closeConfirm = () => setConfirm((prev) => ({ ...prev, open: false }));

  // ── Permissions ─────────────────────────────────────────────────────────────
  const canEdit =
    role === "admin" || role === "manager" || client?.assigned_to === userId;

  const canDelete = role === "admin" || client?.assigned_to === userId;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!client) return;
    setEditFields({
      company_name: client.company_name ?? "",
      industry: client.industry ?? "",
      website: client.website ?? "",
      address: client.address ?? "",
      primary_contact_name: client.primary_contact_name ?? "",
      primary_contact_email: client.primary_contact_email ?? "",
      primary_contact_phone: client.primary_contact_phone ?? "",
      status: client.status ?? "prospect",
      notes: client.notes ?? "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditFields({});
  };

  const saveEdit = async () => {
    const ok = await updateClient(editFields as never);
    if (ok) setIsEditing(false);
  };

  const handleDelete = () => {
    openConfirm({
      title: "Delete Client",
      description:
        "This will permanently delete this client. All linked deals will be unlinked but not deleted. This cannot be undone.",
      confirmLabel: "Delete Client",
      variant: "destructive",
      onConfirm: async () => {
        closeConfirm();
        const ok = await deleteClient();
        if (ok) router.push("/scales_man/clients");
      },
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="border-b border-border bg-card/50 px-6 py-6">
          <Skeleton className="h-8 w-48 mb-3" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!client) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Client not found</h2>
          <p className="text-muted-foreground text-sm mt-1">
            This client doesn't exist or you don't have access.
          </p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* ── Confirm Dialog ────────────────────────────────────────────── */}
      <Dialog open={confirm.open} onOpenChange={closeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirm.variant === "destructive" ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
              {confirm.title}
            </DialogTitle>
            <DialogDescription>{confirm.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant={confirm.variant}
              onClick={confirm.onConfirm}
              disabled={saving}
            >
              {saving ? "Processing..." : confirm.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="bg-transparent gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {canEdit && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  className="gap-2 bg-transparent"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                    className="gap-2 bg-transparent"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveEdit}
                    className="gap-2"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
              {canDelete && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={saving}
                  className="gap-2 bg-transparent text-red-500 hover:text-red-500 border-red-500/30 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Client name + status */}
          <div className="mt-4">
            {isEditing ? (
              <Input
                value={editFields.company_name}
                onChange={(e) =>
                  setEditFields((p) => ({ ...p, company_name: e.target.value }))
                }
                className="text-2xl font-bold bg-background border-border h-auto py-1 mb-2"
              />
            ) : (
              <h1 className="text-2xl font-bold text-foreground">
                {client.company_name}
              </h1>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {isEditing ? (
                <Select
                  value={editFields.status}
                  onValueChange={(v) =>
                    setEditFields((p) => ({ ...p, status: v }))
                  }
                >
                  <SelectTrigger className="w-36 h-7 text-xs bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className={STATUS_STYLES[client.status] ?? ""}
                >
                  {capitalize(client.status)}
                </Badge>
              )}
              {client.industry && (
                <span className="text-sm text-muted-foreground">
                  {client.industry}
                </span>
              )}
              {client.assigned_to_name && (
                <span className="text-sm text-muted-foreground ml-auto">
                  Owned by{" "}
                  <span className="text-foreground font-medium">
                    {client.assigned_to_name}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* ── Left Column ────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Deal Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Deals",
                value: dealStats?.totalDeals ?? 0,
                icon: FileText,
                color: "text-blue-500",
              },
              {
                label: "Active",
                value: dealStats?.activeDeals ?? 0,
                icon: TrendingUp,
                color: "text-amber-500",
              },
              {
                label: "Won",
                value: dealStats?.wonDeals ?? 0,
                icon: Target,
                color: "text-emerald-500",
              },
              {
                label: "Revenue",
                value: formatAmount(dealStats?.totalRevenue ?? 0),
                icon: DollarSign,
                color: "text-purple-500",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="p-4 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className="text-lg font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Contact Information */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: User,
                  label: "Contact Person",
                  field: "primary_contact_name",
                  value: client.primary_contact_name,
                },
                {
                  icon: Mail,
                  label: "Email",
                  field: "primary_contact_email",
                  value: client.primary_contact_email,
                  type: "email",
                },
                {
                  icon: Phone,
                  label: "Phone",
                  field: "primary_contact_phone",
                  value: client.primary_contact_phone,
                },
                {
                  icon: Globe,
                  label: "Website",
                  field: "website",
                  value: client.website,
                },
                {
                  icon: Building2,
                  label: "Industry",
                  field: "industry",
                  value: client.industry,
                },
                {
                  icon: MapPin,
                  label: "Address",
                  field: "address",
                  value: client.address,
                },
              ].map(({ icon: Icon, label, field, value, type }) => (
                <div key={field}>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {label}
                  </p>
                  {isEditing ? (
                    <Input
                      type={type ?? "text"}
                      value={editFields[field] ?? ""}
                      onChange={(e) =>
                        setEditFields((p) => ({
                          ...p,
                          [field]: e.target.value,
                        }))
                      }
                      className="bg-background border-border h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">
                      {value ?? "—"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Notes
            </h2>
            {isEditing ? (
              <Textarea
                value={editFields.notes}
                onChange={(e) =>
                  setEditFields((p) => ({ ...p, notes: e.target.value }))
                }
                className="bg-background border-border resize-none text-sm"
                rows={4}
                placeholder="Add notes about this client..."
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed">
                {client.notes ?? (
                  <span className="text-muted-foreground italic">
                    No notes added yet.
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Linked Deals */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Linked Deals ({deals.length})
              </h2>
              {dealStats && dealStats.totalPipeline > 0 && (
                <span className="text-xs text-muted-foreground">
                  Pipeline:{" "}
                  <span className="font-medium text-foreground">
                    {formatAmount(dealStats.totalPipeline)}
                  </span>
                </span>
              )}
            </div>

            {deals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No deals linked to this client yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() =>
                      router.push(`/scales_man/deal_details/${deal.id}`)
                    }
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {deal.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${DEAL_STAGE_STYLES[deal.stage] ?? ""}`}
                        >
                          {capitalize(deal.stage)}
                        </Badge>
                        <Badge
                          className={`text-xs ${DEAL_STATUS_STYLES[deal.status] ?? ""}`}
                        >
                          {capitalize(deal.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {deal.assigned_to_name && (
                          <span>{deal.assigned_to_name}</span>
                        )}
                        <span>{deal.probability}% probability</span>
                        <span>{Math.round(deal.days_in_stage)}d in stage</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <p className="text-base font-bold text-foreground">
                        {formatAmount(Number(deal.value))}
                      </p>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ───────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Quick Info */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Quick Info
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${STATUS_STYLES[client.status] ?? ""}`}
                >
                  {capitalize(client.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deals</span>
                <span className="font-medium text-foreground">
                  {dealStats?.totalDeals ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Won Deals</span>
                <span className="font-medium text-emerald-600">
                  {dealStats?.wonDeals ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-medium text-emerald-600">
                  {formatAmount(dealStats?.totalRevenue ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pipeline</span>
                <span className="font-medium text-foreground">
                  {formatAmount(dealStats?.totalPipeline ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Timeline
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground font-medium ml-auto">
                  {formatDate(client.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Updated</span>
                <span className="text-foreground font-medium ml-auto">
                  {formatDate(client.updated_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Created by</span>
                <span className="text-foreground font-medium ml-auto">
                  {client.created_by_name ?? "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Win Rate */}
          {(dealStats?.totalDeals ?? 0) > 0 && (
            <div className="p-5 rounded-lg bg-secondary/30 border border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Win Rate
              </h2>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {dealStats && dealStats.totalDeals > 0
                    ? `${Math.round((dealStats.wonDeals / dealStats.totalDeals) * 100)}%`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dealStats?.wonDeals ?? 0} won out of{" "}
                  {dealStats?.totalDeals ?? 0} deals
                </p>
              </div>
              <div className="mt-3 w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${
                      dealStats && dealStats.totalDeals > 0
                        ? Math.round(
                            (dealStats.wonDeals / dealStats.totalDeals) * 100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
