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
  const colors = [
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
              level <= strength ? colors[strength] : "bg-gray-200"
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const isForced = searchParams.get("forced") === "true";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Auto-focus OTP field when email is pre-filled
  useEffect(() => {
    if (emailParam) {
      document.getElementById("otp-input")?.focus();
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (otp.trim().length !== 6) {
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
      const { data } = await axios.post("/api/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPw,
      });

      if (!data.success) {
        setError(data.message);
        return;
      }

      setDone(true);
      // Redirect to login after 2 seconds
      setTimeout(() => router.push("/login?reset=success"), 2000);
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
          {done ? (
            /* Success state */
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Password reset!
              </h2>
              <p className="text-sm text-gray-500">
                Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              {/* Forced reset banner */}
              {isForced && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Your account was created by an admin. You must set your own
                    password before continuing.
                  </p>
                </div>
              )}

              <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">
                  {isForced ? "Set your password" : "Reset your password"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the 6-digit code from your email and choose a new
                  password.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email — hidden if pre-filled from params */}
                {!emailParam && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@agency.com"
                      autoComplete="email"
                    />
                  </div>
                )}

                {/* OTP */}
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
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
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

                {/* Confirm password */}
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
                      placeholder="Repeat new password"
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
                    <p className="text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
                  {confirmPw && confirmPw === newPw && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-700 mt-2"
                  disabled={loading}
                >
                  {loading
                    ? "Resetting..."
                    : isForced
                      ? "Set My Password"
                      : "Reset Password"}
                </Button>
              </form>
            </>
          )}
        </div>

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
