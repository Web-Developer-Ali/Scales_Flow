"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDealDetail } from "@/components/deal_details/use-deal-detail";
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
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Edit2,
  Save,
  X,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { ClientSelector } from "@/components/clients/search_client/client-selector";

// ── Constants ──────────────────────────────────────────────────────────────────
const STAGES = [
  { value: "prospect", label: "Prospect" },
  { value: "qualified", label: "Qualified" },
  { value: "demo", label: "Demo" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed", label: "Closed" },
];

const STATUSES = [
  {
    value: "active",
    label: "Active",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    value: "won",
    label: "Won",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    value: "lost",
    label: "Lost",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  {
    value: "on-hold",
    label: "On Hold",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
];

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  qualified: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  demo: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  negotiation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STAGE_ORDER = ["prospect", "qualified", "demo", "negotiation", "closed"];

const formatCurrency = (val: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(val);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

// ── Main Component ─────────────────────────────────────────────────────────────
export function DealDetailClient({ dealId }: { dealId: string }) {
  const router = useRouter();
  const session = useSession();
  const role = session.data?.user?.role ?? "";
  const userId = session.data?.user?.id ?? "";

  const { deal, loading, saving, error, updateDeal, deleteDeal } =
    useDealDetail(dealId);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  // Client link state during editing
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState<string | null>(null);

  // Confirm dialog
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
    role === "admin" || role === "manager" || deal?.assigned_to === userId;

  const canDelete = role === "admin" || deal?.assigned_to === userId;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!deal) return;
    setEditFields({
      title: deal.title ?? "",
      company: deal.company ?? "",
      contact_person: deal.contact_person ?? "",
      contact_email: deal.contact_email ?? "",
      contact_phone: deal.contact_phone ?? "",
      value: String(deal.value),
      probability: String(deal.probability),
      expected_close_date: deal.expected_close_date?.substring(0, 10) ?? "",
      description: deal.description ?? "",
    });
    // Pre-fill client from current deal data
    setEditClientId(deal.client_id ?? null);
    setEditClientName(deal.client_name ?? null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditFields({});
    setEditClientId(null);
    setEditClientName(null);
  };

  const saveEdit = async () => {
    const success = await updateDeal({
      ...editFields,
      value: parseFloat(editFields.value),
      probability: parseInt(editFields.probability),
      client_id: editClientId ?? null, // ← include client link
    } as never);
    if (success) {
      setIsEditing(false);
      setEditFields({});
    }
  };

  const handleStageChange = (newStage: string) => {
    if (!deal || newStage === deal.stage) return;
    const currentIdx = STAGE_ORDER.indexOf(deal.stage);
    const newIdx = STAGE_ORDER.indexOf(newStage);

    if (newIdx < currentIdx) {
      openConfirm({
        title: "Cannot Go Back",
        description:
          "Deals can only move forward in the pipeline. To revert a stage, please contact your admin.",
        confirmLabel: "OK",
        variant: "default",
        onConfirm: closeConfirm,
      });
      return;
    }

    openConfirm({
      title: `Move to ${capitalize(newStage)}`,
      description: `Advance this deal from "${capitalize(deal.stage)}" to "${capitalize(newStage)}"?`,
      confirmLabel: `Move to ${capitalize(newStage)}`,
      variant: "default",
      onConfirm: async () => {
        closeConfirm();
        await updateDeal({ stage: newStage });
      },
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!deal || newStatus === deal.status) return;
    const isTerminal = newStatus === "won" || newStatus === "lost";
    openConfirm({
      title: `Mark as ${capitalize(newStatus)}`,
      description: isTerminal
        ? `This will mark the deal as ${newStatus.toUpperCase()}. This is a significant change — are you sure?`
        : `Change deal status to "${capitalize(newStatus)}"?`,
      confirmLabel: `Mark ${capitalize(newStatus)}`,
      variant: isTerminal && newStatus === "lost" ? "destructive" : "default",
      onConfirm: async () => {
        closeConfirm();
        await updateDeal({ status: newStatus });
      },
    });
  };

  const handleDelete = () => {
    openConfirm({
      title: "Delete Deal",
      description:
        "This will permanently delete this deal and cannot be undone. Are you sure?",
      confirmLabel: "Delete Deal",
      variant: "destructive",
      onConfirm: async () => {
        closeConfirm();
        const ok = await deleteDeal();
        if (ok) router.push("/scales_man/my-deals");
      },
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="border-b border-border bg-card/50 px-6 py-6">
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!deal) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Deal not found</h2>
          <p className="text-muted-foreground text-sm mt-1">
            This deal doesn't exist or you don't have access.
          </p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  const statusConfig =
    STATUSES.find((s) => s.value === deal.status) ?? STATUSES[0];

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
              {saving ? "Saving..." : confirm.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-5">
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
                  className="gap-2 bg-transparent text-red-500 hover:text-red-500 border-red-500/30 hover:bg-red-500/10"
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Deal title + badges */}
          <div className="mt-4">
            {isEditing ? (
              <Input
                value={editFields.title}
                onChange={(e) =>
                  setEditFields((p) => ({ ...p, title: e.target.value }))
                }
                className="text-2xl font-bold bg-background border-border mb-2 h-auto py-1"
              />
            ) : (
              <h1 className="text-2xl font-bold text-foreground">
                {deal.title}
              </h1>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge
                variant="outline"
                className={STAGE_COLORS[deal.stage] ?? ""}
              >
                {capitalize(deal.stage)}
              </Badge>
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Math.round(deal.days_in_stage)}d in stage
              </span>
              {deal.assigned_to_name && (
                <span className="text-sm text-muted-foreground ml-auto">
                  Assigned to{" "}
                  <span className="text-foreground font-medium">
                    {deal.assigned_to_name}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* ── Left Column ────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Deal Value Card */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              Deal Value
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Value
                </p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editFields.value}
                    onChange={(e) =>
                      setEditFields((p) => ({ ...p, value: e.target.value }))
                    }
                    className="bg-background border-border h-8 text-sm"
                  />
                ) : (
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(Number(deal.value), deal.currency)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Probability
                </p>
                {isEditing ? (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editFields.probability}
                    onChange={(e) =>
                      setEditFields((p) => ({
                        ...p,
                        probability: e.target.value,
                      }))
                    }
                    className="bg-background border-border h-8 text-sm"
                  />
                ) : (
                  <p className="text-xl font-bold text-foreground">
                    {deal.probability}%
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Expected
                </p>
                <p className="text-xl font-bold text-emerald-500">
                  {formatCurrency(
                    (Number(deal.value) * deal.probability) / 100,
                    deal.currency,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Building2,
                  label: "Company",
                  field: "company",
                  value: deal.company,
                },
                {
                  icon: User,
                  label: "Contact Person",
                  field: "contact_person",
                  value: deal.contact_person,
                },
                {
                  icon: Mail,
                  label: "Email",
                  field: "contact_email",
                  value: deal.contact_email,
                  type: "email",
                },
                {
                  icon: Phone,
                  label: "Phone",
                  field: "contact_phone",
                  value: deal.contact_phone,
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

          {/* Description */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Description
            </h2>
            {isEditing ? (
              <Textarea
                value={editFields.description}
                onChange={(e) =>
                  setEditFields((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-background border-border resize-none text-sm"
                rows={4}
                placeholder="Add deal description..."
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed">
                {deal.description ?? (
                  <span className="text-muted-foreground italic">
                    No description added.
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground font-medium ml-auto">
                  {formatDate(deal.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-foreground font-medium ml-auto">
                  {formatDate(deal.updated_at)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Expected Close</span>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editFields.expected_close_date}
                    onChange={(e) =>
                      setEditFields((p) => ({
                        ...p,
                        expected_close_date: e.target.value,
                      }))
                    }
                    className="bg-background border-border h-7 text-sm ml-auto w-40"
                  />
                ) : (
                  <span className="text-foreground font-medium ml-auto">
                    {formatDate(deal.expected_close_date)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Created by</span>
                <span className="text-foreground font-medium ml-auto">
                  {deal.created_by_name ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ───────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Stage Progression */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              Pipeline Stage
            </h2>
            <div className="space-y-2">
              {STAGES.map((s, idx) => {
                const currentIdx = STAGE_ORDER.indexOf(deal.stage);
                const isActive = s.value === deal.stage;
                const isDone = idx < currentIdx;
                const isFuture = idx > currentIdx;

                return (
                  <button
                    key={s.value}
                    onClick={() => canEdit && handleStageChange(s.value)}
                    disabled={!canEdit || saving || isActive}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all border
                      ${
                        isActive
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : isDone
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                            : isFuture && canEdit
                              ? "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                              : "bg-secondary/30 border-border text-muted-foreground/50 cursor-not-allowed"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0
                          ${
                            isActive
                              ? "border-primary bg-primary text-primary-foreground"
                              : isDone
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-muted-foreground/30"
                          }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </span>
                      {s.label}
                      {isActive && (
                        <span className="ml-auto text-xs opacity-70">
                          Current
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deal Status */}
          {canEdit && (
            <div className="p-5 rounded-lg bg-card border border-border">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Deal Status
              </h2>
              <Select
                value={deal.status}
                onValueChange={handleStatusChange}
                disabled={saving}
              >
                <SelectTrigger className="bg-background border-border">
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
              <p className="text-xs text-muted-foreground mt-2">
                Mark as Won or Lost to close this deal.
              </p>
            </div>
          )}

          {/* ── Linked Client ──────────────────────────────────────────
              Shows current linked client when not editing.
              Shows ClientSelector when editing to change/remove the link.
          ─────────────────────────────────────────────────────────────── */}
          <div className="p-5 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Linked Client
            </h2>

            {isEditing ? (
              /* Edit mode: searchable client selector */
              <>
                <ClientSelector
                  value={editClientId}
                  displayName={editClientName}
                  onChange={(id, name) => {
                    setEditClientId(id);
                    setEditClientName(name);
                  }}
                  placeholder="Search clients..."
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Search and select a client, or clear to unlink.
                </p>
              </>
            ) : deal.client_id ? (
              /* View mode: linked — show clickable client name */
              <button
                onClick={() =>
                  router.push(`/scales_man/clients/${deal.client_id}`)
                }
                className="w-full flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all group text-left"
              >
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate">
                  {deal.client_name}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            ) : (
              /* View mode: not linked */
              <div className="text-center py-3">
                <p className="text-xs text-muted-foreground">
                  No client linked.
                </p>
                {canEdit && (
                  <button
                    onClick={startEdit}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    Click Edit to link one
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="p-5 rounded-lg bg-secondary/30 border border-border space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Info
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days in Stage</span>
                <span
                  className={`font-medium ${
                    deal.days_in_stage >= 21
                      ? "text-red-500"
                      : deal.days_in_stage >= 14
                        ? "text-amber-500"
                        : "text-foreground"
                  }`}
                >
                  {Math.round(deal.days_in_stage)}d
                  {deal.days_in_stage >= 14 && " ⚠️"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Probability</span>
                <span className="font-medium text-foreground">
                  {deal.probability}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Rev.</span>
                <span className="font-medium text-emerald-500">
                  {formatCurrency(
                    (Number(deal.value) * deal.probability) / 100,
                    deal.currency,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
