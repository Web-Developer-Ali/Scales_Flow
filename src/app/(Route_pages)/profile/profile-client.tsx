"use client";

import { useState } from "react";
import { useProfile } from "@/components/shared/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Building2,
  Shield,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  Save,
} from "lucide-react";
import { AdminNavbar } from "@/components/admin/navbar";
import { ManagerDashboardHeader } from "@/components/manager/manager-dashboard-header";
import { RepDashboardHeader } from "@/components/scales_man/navbar";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  scales_man: "Sales Rep",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-500/20",
  manager: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  scales_man: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

function formatDate(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseUA(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("iPhone") || ua.includes("Android")) return "📱 Mobile";
  if (ua.includes("Chrome")) return "🌐 Chrome";
  if (ua.includes("Firefox")) return "🦊 Firefox";
  if (ua.includes("Safari")) return "🧭 Safari";
  return "💻 Desktop";
}

export function ProfileClient() {
  const {
    profile,
    loginHistory,
    loading,
    saving,
    error,
    success,
    updateProfile,
    changePassword,
  } = useProfile();

  // Profile form
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [profileInit, setProfileInit] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Initialize form when profile loads
  if (profile && !profileInit) {
    setName(profile.name);
    setCompanyName(profile.company_name ?? "");
    setProfileInit(true);
  }

  const handleProfileSave = async () => {
    await updateProfile({ name, company_name: companyName });
  };

  const handlePasswordChange = async () => {
    setPwError(null);
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("All password fields are required");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match");
      return;
    }
    const ok = await changePassword(currentPw, newPw);
    if (ok) {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-4">
          <Skeleton className="h-10 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </main>
    );
  }

  const navbar =
    profile?.role === "admin" ? (
      <AdminNavbar />
    ) : profile?.role === "manager" ? (
      <ManagerDashboardHeader />
    ) : (
      <RepDashboardHeader />
    );

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────────────────── */}
      {navbar}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">
                {(profile?.name ?? "?")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {profile?.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={ROLE_COLORS[profile?.role ?? ""] ?? ""}
                >
                  {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}
                </Badge>
                {profile?.is_verified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Global alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertDescription className="text-emerald-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Account Info (read-only) ─────────────────────────────────── */}
        <div className="p-5 rounded-lg bg-card border border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            {[
              {
                icon: Mail,
                label: "Email",
                value: profile?.email,
                note: "Email cannot be changed",
              },
              {
                icon: Shield,
                label: "Role",
                value: ROLE_LABELS[profile?.role ?? ""] ?? profile?.role,
              },
              {
                icon: LogIn,
                label: "Total Logins",
                value: `${profile?.login_count ?? 0} sessions`,
              },
              {
                icon: Clock,
                label: "Last Login",
                value: formatDate(profile?.last_login_at ?? null),
              },
              {
                icon: Clock,
                label: "Member Since",
                value: formatDate(profile?.created_at ?? null),
              },
            ].map(({ icon: Icon, label, value, note }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">
                    {value}
                  </span>
                  {note && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Edit Profile ─────────────────────────────────────────────── */}
        <div className="p-5 rounded-lg bg-card border border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Edit Profile
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Company Name
                <span className="text-xs text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company"
                className="bg-background border-border"
              />
            </div>

            <Button
              onClick={handleProfileSave}
              disabled={saving}
              className="gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* ── Change Password ───────────────────────────────────────────── */}
        <div className="p-5 rounded-lg bg-card border border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Change Password
          </h2>

          {pwError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{pwError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                New Password
              </label>
              <Input
                type={showPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Min 8 characters"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Confirm New Password
              </label>
              <Input
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className="bg-background border-border"
              />
            </div>

            {/* Password strength indicator */}
            {newPw.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      newPw.length >= 12 &&
                      /[A-Z]/.test(newPw) &&
                      /[0-9]/.test(newPw) &&
                      /[^A-Za-z0-9]/.test(newPw)
                        ? 4
                        : newPw.length >= 10 && /[A-Z]/.test(newPw)
                          ? 3
                          : newPw.length >= 8
                            ? 2
                            : 1;
                    return (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full ${
                          level <= strength
                            ? strength === 4
                              ? "bg-emerald-500"
                              : strength === 3
                                ? "bg-blue-500"
                                : strength === 2
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            : "bg-secondary"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {newPw.length < 8
                    ? "Too short"
                    : newPw.length >= 12 &&
                        /[A-Z]/.test(newPw) &&
                        /[0-9]/.test(newPw)
                      ? "Strong password"
                      : "Good — add numbers and uppercase for stronger"}
                </p>
              </div>
            )}

            <Button
              onClick={handlePasswordChange}
              disabled={saving}
              variant="outline"
              className="gap-2 w-full sm:w-auto bg-transparent"
            >
              <Lock className="w-4 h-4" />
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </div>

        {/* ── Login History ─────────────────────────────────────────────── */}
        <div className="p-5 rounded-lg bg-card border border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Recent Login History
          </h2>
          {loginHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No login history yet.
            </p>
          ) : (
            <div className="space-y-0">
              {loginHistory.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        i === 0 ? "bg-emerald-500" : "bg-muted-foreground/30"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {parseUA(entry.user_agent)}
                        {i === 0 && (
                          <span className="ml-2 text-xs text-emerald-600 font-normal">
                            Current
                          </span>
                        )}
                      </p>
                      {entry.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          {entry.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
