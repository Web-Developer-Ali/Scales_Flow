"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { signOut } from "next-auth/react";
// ── Password strength indicator ───────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const strength =
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
      ? 4
      : password.length >= 10 &&
          /[A-Z]/.test(password) &&
          /[0-9]/.test(password)
        ? 3
        : password.length >= 8
          ? 2
          : 1;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const barColors = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];
  const textColors = [
    "",
    "text-red-500",
    "text-amber-500",
    "text-blue-500",
    "text-emerald-600",
  ];

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength ? barColors[strength] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${textColors[strength]}`}>
        {labels[strength]} password
      </p>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") ?? "";
  // forced=true means admin-created user setting their own password
  // NO otp required — they are already logged in and verified
  const isForced = searchParams.get("forced") === "true";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Auto-focus the right field:
    // forced → jump straight to new password
    // standard → focus OTP field if email is pre-filled
    const focusId = isForced
      ? "new-password"
      : emailParam
        ? "otp-input"
        : "email-input";
    setTimeout(() => document.getElementById(focusId)?.focus(), 100);
  }, [isForced, emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ── Client-side validation ───────────────────────────────────────────
    if (!isForced && !email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!isForced && otp.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload = isForced
        ? {
            // Forced reset: session-based, no email/otp needed
            forced: true,
            newPassword: newPw,
          }
        : {
            // Standard forgot-password reset: needs email + otp
            forced: false,
            email: email.trim(),
            otp: otp.trim(),
            newPassword: newPw,
          };

      const { data } = await axios.post("/api/auth/reset-password", payload);

      if (!data.success) {
        setError(data.message);
        return;
      }

      setDone(true);
      await signOut({ redirect: false });

      // After any reset, require a fresh login so the session is rebuilt.
      setTimeout(() => router.push("/login?reset=success"), 1500);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-widest uppercase text-gray-900">
            SalesFlow
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          {/* ── Success state ────────────────────────────────────────────── */}
          {done ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {isForced ? "Password set!" : "Password reset!"}
              </h2>
              <p className="text-sm text-gray-500">
                Please sign in again with your new password.
              </p>
            </div>
          ) : (
            <>
              {/* ── Forced reset banner ───────────────────────────────────── */}
              {isForced && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg mb-5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">
                      Action required
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Your account was set up by an admin with a temporary
                      password. Choose your own password to continue.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Heading ───────────────────────────────────────────────── */}
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">
                  {isForced ? "Set your password" : "Reset your password"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isForced
                    ? "Choose a strong password for your account."
                    : "Enter the 6-digit code from your email and your new password."}
                </p>
              </div>

              {/* ── Error alert ───────────────────────────────────────────── */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ── Standard only: email (if not pre-filled) ───────────── */}
                {!isForced && !emailParam && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <Input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@agency.com"
                      autoComplete="email"
                    />
                  </div>
                )}

                {/* ── Standard only: OTP field ────────────────────────────── */}
                {/* NOT shown for forced resets — user is already authenticated */}
                {!isForced && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Reset Code
                    </label>
                    <Input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.5em] font-mono h-12"
                      autoComplete="one-time-code"
                    />
                    <p className="text-xs text-gray-400">
                      Check your email for the 6-digit reset code.
                    </p>
                  </div>
                )}

                {/* ── New password ─────────────────────────────────────────── */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {isForced ? "Your password" : "New Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="new-password"
                      type={showPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Min 8 characters"
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <PasswordStrength password={newPw} />
                </div>

                {/* ── Confirm password ─────────────────────────────────────── */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPw ? "text" : "password"}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Repeat your password"
                      className={`pl-10 ${
                        confirmPw && confirmPw !== newPw
                          ? "border-red-400 focus-visible:ring-red-400"
                          : confirmPw && confirmPw === newPw
                            ? "border-emerald-400 focus-visible:ring-emerald-400"
                            : ""
                      }`}
                      autoComplete="new-password"
                    />
                  </div>
                  {confirmPw && confirmPw !== newPw && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Passwords do not match
                    </p>
                  )}
                  {confirmPw && confirmPw === newPw && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* ── Submit ───────────────────────────────────────────────── */}
                <Button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-700 mt-2"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : isForced
                      ? "Set My Password"
                      : "Reset Password"}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Back to login — only for standard reset, not forced */}
        {!isForced && (
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
