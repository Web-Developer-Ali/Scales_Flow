"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import Head from "next/head";
import axios from "axios";

export default function OTPVerificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error" | "resending"
  >("idle");
  const [message, setMessage] = useState("");
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [isUnverifiedUser, setIsUnverifiedUser] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const errorParam = searchParams.get("error");
    if (emailParam) {
      setEmail(emailParam);
    }

    if (errorParam === "unverified") {
      setIsUnverifiedUser(true);
      setMessage(
        "Please verify your email address to continue. Check your inbox for the verification code."
      );
    } else if (errorParam) {
      setStatus("error");
      setMessage(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "") && value) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);

    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    if (!email || otpCode.length !== 6) return;
    setStatus("verifying");
    setMessage("");

    try {
      const { data } = await axios.post("/api/auth/email_verification", {
        email,
        otp: otpCode,
      });

      // data object expected to be like { success: true, message: "...", ... }
      if (data && data.success) {
        toast.success(data.message || "Email verified successfully!");
        setStatus("success");
        setTimeout(() => router.push("/dashboard?verified=true"), 2000);
      } else {
        throw new Error(data.message || "Invalid code");
      }
    } catch (error: any) {
      const errorMessage =
        (error?.response?.data?.message as string) ||
        error?.message ||
        "Verification failed. Please try again.";
      toast.error(errorMessage);
      setStatus("error");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendEmail = async () => {
    if (!email || !canResend) return;

    setStatus("resending");
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend_otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to resend email");
      }

      setMessage("New verification code sent! Please check your inbox.");
      setCanResend(false);
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.success("Verification email resent!");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to send verification email. Please try again."
      );
      toast.error("Failed to resend email");
    } finally {
      setStatus("idle");
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "error":
        return <XCircle className="h-16 w-16 text-red-500" />;
      case "verifying":
      case "resending":
        return <RefreshCw className="h-16 w-16 text-blue-500 animate-spin" />;
      default:
        return isUnverifiedUser ? (
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        ) : (
          <Shield className="h-16 w-16 text-blue-500" />
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "verifying":
      case "resending":
        return "border-blue-200 bg-blue-50";
      default:
        return isUnverifiedUser
          ? "border-yellow-200 bg-yellow-50"
          : "border-gray-200 bg-white";
    }
  };

  return (
    <>
    <Head>
        <title>Email Verification | Smart Feedback Portal</title>
        <meta 
          name="description" 
          content="Verify your email address to access your Smart Feedback Portal account. Enter the 6-digit OTP sent to your email." 
        />
        <meta name="keywords" content="email verification, OTP verification, account verification, Smart Feedback" />
        <meta property="og:title" content="Email Verification | Smart Feedback Portal" />
        <meta property="og:description" content="Verify your email address to access your account" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/otp-verification" />
      </Head>
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            {isUnverifiedUser
              ? "Email Verification Required"
              : "Verify Your Email"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isUnverifiedUser
              ? "Your account needs email verification to continue"
              : "Enter the 6-digit code sent to your email"}
          </p>
        </div>

        <Card className={`${getStatusColor()} border-2`}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">{getStatusIcon()}</div>
            <CardTitle className="text-xl">
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
              {status === "verifying" && "Verifying..."}
              {status === "resending" && "Sending New Code..."}
              {status === "idle" &&
                (isUnverifiedUser
                  ? "Verification Required"
                  : "Enter Verification Code")}
            </CardTitle>
            <CardDescription>
              {status === "success" && "Redirecting you to your dashboard..."}
              {status === "error" && "Please check your code and try again."}
              {status === "verifying" &&
                "Please wait while we verify your code."}
              {status === "resending" &&
                "Sending a new verification code to your inbox."}
              {status === "idle" &&
                (isUnverifiedUser
                  ? "Enter the 6-digit code sent to your email."
                  : "Check your email for the verification code.")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {email && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Verification sent to:
                </p>
                <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded border text-sm break-all">
                  {email}
                </p>
              </div>
            )}

            {status !== "success" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    Enter the 6-digit code:
                  </p>
                  <div className="flex justify-center space-x-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleOtpChange(
                            index,
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-blue-500"
                        disabled={
                          status === "verifying" || status === "resending"
                        }
                      />
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleVerifyOTP(otp.join(""))}
                  disabled={
                    otp.some((digit) => digit === "") || status === "verifying"
                  }
                >
                  {status === "verifying" ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
              </div>
            )}

            {message && (
              <Alert
                className={
                  status === "error"
                    ? "border-red-200 bg-red-50"
                    : status === "success"
                    ? "border-green-200 bg-green-50"
                    : isUnverifiedUser
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-blue-200 bg-blue-50"
                }
              >
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status !== "success" && (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    {"Didn't receive the code?"}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={!canResend || status === "resending"}
                    className="w-full bg-transparent"
                  >
                    {status === "resending" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : canResend ? (
                      "Resend Verification Code"
                    ) : (
                      `Resend in ${countdown}s`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Check your spam folder if you don&apos;t see the email</p>
          <p>The verification code expires in 10 minutes</p>
        </div>
      </div>
    </div>
    </>
  );
}
