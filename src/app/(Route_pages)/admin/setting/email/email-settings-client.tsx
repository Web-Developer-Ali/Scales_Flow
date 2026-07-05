"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Save,
  Send,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { AdminNavbar } from "@/components/admin/navbar";

interface Settings {
  enabled: boolean;
  provider: "nodemailer" | "resend";
  smtp_service: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from: string | null;
  resend_api_key: string | null;
  resend_from: string | null;
  notify_deal_won: boolean;
  notify_deal_stalled: boolean;
  notify_monthly_target: boolean;
  notify_welcome_member: boolean;
}

const DEFAULT: Settings = {
  enabled: false,
  provider: "nodemailer",
  smtp_service: "gmail",
  smtp_host: null,
  smtp_port: 587,
  smtp_user: null,
  smtp_password: null,
  smtp_from: null,
  resend_api_key: null,
  resend_from: null,
  notify_deal_won: true,
  notify_deal_stalled: true,
  notify_monthly_target: true,
  notify_welcome_member: true,
};

function Toggle({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="flex-shrink-0 ml-4"
      >
        {value ? (
          <ToggleRight className="w-8 h-8 text-primary" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export function EmailSettingsClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/admin/setting/email-settings")
      .then(({ data }) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings, value: unknown) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await axios.patch(
        "/api/admin/setting/email-settings",
        settings,
      );
      if (!data.success) throw new Error(data.error);
      setSuccess("Email settings saved successfully.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) {
      setError("Enter a test email address first.");
      return;
    }
    setTesting(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await axios.post("/api/admin/setting/email-settings", {
        testEmail,
      });
      if (!data.success) throw new Error(data.error);
      setSuccess(data.message);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Test failed — check your credentials",
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <Mail className="w-6 h-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">
              Email Notifications
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Configure how SalesFlow sends emails. Use Gmail for free or Resend
            for your company domain.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
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

        {/* ── Master Switch ───────────────────────────────────────────── */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Email Notifications</CardTitle>
                <CardDescription className="mt-0.5">
                  {settings.enabled
                    ? "Emails are currently enabled."
                    : "Emails are currently disabled. No notifications will be sent."}
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => set("enabled", !settings.enabled)}
              >
                {settings.enabled ? (
                  <ToggleRight className="w-10 h-10 text-primary" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-muted-foreground" />
                )}
              </button>
            </div>
          </CardHeader>
        </Card>

        {settings.enabled && (
          <>
            {/* ── Provider ─────────────────────────────────────────────── */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Email Provider</CardTitle>
                <CardDescription>
                  Choose how emails are sent. Gmail is free. Resend supports
                  custom domains.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={settings.provider}
                  onValueChange={(v) =>
                    set("provider", v as "nodemailer" | "resend")
                  }
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nodemailer">
                      📧 Gmail / SMTP (free, uses your email)
                    </SelectItem>
                    <SelectItem value="resend">
                      ✉️ Resend (professional, custom domain)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Nodemailer fields */}
                {settings.provider === "nodemailer" && (
                  <div className="space-y-3 pt-2">
                    <Select
                      value={settings.smtp_service ?? "gmail"}
                      onValueChange={(v) => set("smtp_service", v)}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gmail">Gmail</SelectItem>
                        <SelectItem value="custom">Custom SMTP</SelectItem>
                      </SelectContent>
                    </Select>

                    {settings.smtp_service === "custom" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            SMTP Host
                          </label>
                          <Input
                            placeholder="smtp.example.com"
                            value={settings.smtp_host ?? ""}
                            onChange={(e) => set("smtp_host", e.target.value)}
                            className="bg-background border-border"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Port
                          </label>
                          <Input
                            type="number"
                            placeholder="587"
                            value={settings.smtp_port ?? ""}
                            onChange={(e) =>
                              set("smtp_port", parseInt(e.target.value))
                            }
                            className="bg-background border-border"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {settings.smtp_service === "gmail"
                          ? "Gmail Address"
                          : "SMTP Username"}
                      </label>
                      <Input
                        type="email"
                        placeholder="your@gmail.com"
                        value={settings.smtp_user ?? ""}
                        onChange={(e) => set("smtp_user", e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {settings.smtp_service === "gmail"
                          ? "App Password"
                          : "SMTP Password"}
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••••••"
                        value={settings.smtp_password ?? ""}
                        onChange={(e) => set("smtp_password", e.target.value)}
                        className="bg-background border-border"
                      />
                      {settings.smtp_service === "gmail" && (
                        <p className="text-xs text-muted-foreground">
                          Use a Gmail App Password, not your regular password.{" "}
                          <a
                            href="https://support.google.com/accounts/answer/185833"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            How to create one →
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        From Name & Address
                      </label>
                      <Input
                        placeholder="SalesFlow <your@gmail.com>"
                        value={settings.smtp_from ?? ""}
                        onChange={(e) => set("smtp_from", e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                )}

                {/* Resend fields */}
                {settings.provider === "resend" && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Resend API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="re_••••••••••••"
                        value={settings.resend_api_key ?? ""}
                        onChange={(e) => set("resend_api_key", e.target.value)}
                        className="bg-background border-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your API key from{" "}
                        <a
                          href="https://resend.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          resend.com →
                        </a>
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        From Address
                      </label>
                      <Input
                        placeholder="SalesFlow <notifications@yourdomain.com>"
                        value={settings.resend_from ?? ""}
                        onChange={(e) => set("resend_from", e.target.value)}
                        className="bg-background border-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be a verified domain in your Resend account.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Notification Types ───────────────────────────────────── */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Notification Types</CardTitle>
                <CardDescription>
                  Choose which events trigger emails. All are on by default.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Toggle
                  label="Deal Won"
                  sub="Notify manager when a rep closes a deal"
                  value={settings.notify_deal_won}
                  onChange={(v) => set("notify_deal_won", v)}
                />
                <Toggle
                  label="Deal Stalled"
                  sub="Remind rep when a deal hasn't been updated in 7+ days"
                  value={settings.notify_deal_stalled}
                  onChange={(v) => set("notify_deal_stalled", v)}
                />
                <Toggle
                  label="Monthly Target Check-in"
                  sub="Send mid-month performance summary to each rep"
                  value={settings.notify_monthly_target}
                  onChange={(v) => set("notify_monthly_target", v)}
                />
                <Toggle
                  label="Welcome New Team Member"
                  sub="Send welcome + OTP email when a new user is created"
                  value={settings.notify_welcome_member}
                  onChange={(v) => set("notify_welcome_member", v)}
                />
              </CardContent>
            </Card>

            {/* ── Test Email ───────────────────────────────────────────── */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Send Test Email</CardTitle>
                <CardDescription>
                  Verify your configuration is working before saving.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="bg-background border-border"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={testing}
                    className="gap-2 bg-transparent flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    {testing ? "Sending..." : "Send Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Save ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </main>
  );
}
