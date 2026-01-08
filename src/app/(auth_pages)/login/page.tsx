"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

// Changed from `export function login()` to `export default function LoginPage()`
export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail, rememberMe: true }))
    }
  }, [])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear errors when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    if (!validateForm()) return
  
    setIsLoading(true)
    setErrors({})
  
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })
  
      if (result?.ok) {
        toast.success("Login successful!")
        
        if (formData.rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email)
        } else {
          localStorage.removeItem("rememberedEmail")
        }
  
        setTimeout(() => {
          window.location.href = callbackUrl
        }, 1000)
        
      } else {
        // Generic error message for security
        const errorMsg = "Invalid email or password. Please try again."
        setErrors({ general: errorMsg })
        toast.error(errorMsg)
      }
      
    } catch (error) {
      console.error("Login error:", error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Optional: Add resend OTP function for email verification errors
  const handleResendOTP = async (email: string) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.")
      } else {
        toast.error("Failed to resend verification email. Please try again.")
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      toast.error("Failed to resend verification email.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle forgot password
  const handleForgotPassword = () => {
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Please enter your email to reset password" }))
      return
    }
    router.push(`/forgot-password?email=${encodeURIComponent(formData.email)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">SF</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-600">Sign in to your Scales Flow account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800">{errors.general}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${errors.email ? "text-red-400" : "text-slate-400"}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${
                    errors.email
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  } shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  placeholder="you@company.com"
                  disabled={isLoading}
                />
                {!errors.email && formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none disabled:opacity-50"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${errors.password ? "text-red-400" : "text-slate-400"}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 rounded-lg border ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  } shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Submit */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded disabled:opacity-50"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg text-white font-semibold transition-all duration-200 ${
                  isLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in to Dashboard"
                )}
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/register_admin" className="font-semibold text-blue-600 hover:text-blue-500 disabled:opacity-50">
                Sign up for Admin Only
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-4 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-slate-700">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-slate-700">
              Support
            </Link>
          </div>
          <p className="text-xs text-slate-400">© 2025 Scales Flow. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}