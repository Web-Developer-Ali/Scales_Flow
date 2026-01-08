"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type RegistrationFormData, registrationSchema } from "@/lib/validation/registrationSchema"
import axios from "axios"
import { toast } from "sonner"
export default function RegistrationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      companyName: "",
      email: "",
      password: "",
      name: "",
    },
  })

  const watchedPassword = watch("password")

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    setServerError("")
    setSuccessMessage("")

    try {
      const response = await axios.post<{ message: string }>("/api/auth/register_admin", data, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      if (response.status === 201) {
        setSuccessMessage("🎉 Registration successful! Redirecting...");
        toast(response.data.message);
        reset();
        setTimeout(() => {
          router.push(`/otp-verification?email=${data.email}`);
        }, 2000);
      }
    } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with a status out of 2xx
        const message = error.response.data?.message || "Registration failed. Please try again.";
        setServerError(message);
        toast( message );
      } else if (error.request) {
        // Request was made, but no response (network problem, timeout, etc)
        const message = "No response from server. Please check your connection.";
        setServerError(message);
        toast( message );
      } else {
        // Something happened in setting up the request
        const message = error.message || "An unknown error occurred.";
        setServerError(message);
        toast( message );
      }
    } else if (error instanceof Error) {
      const message = error.message || "An unknown error occurred.";
      setServerError(message);
      toast( message );
    } else {
      const message = "Registration failed. Please try again.";
      setServerError(message);
      toast( message );
    }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">SF</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Scales Flow</h1>
          <p className="text-gray-600 text-sm">Enterprise-grade business management platform</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-10 px-6 shadow-2xl rounded-2xl sm:px-12 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Benefits */}
            <div className="lg:w-1/2">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Join Scales Flow?</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="ml-3 text-gray-700">Unlimited team members</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="ml-3 text-gray-700">24/7 Priority support</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="ml-3 text-gray-700">Advanced analytics dashboard</span>
                </li>
              </ul>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Already have an account?</strong>{" "}
                  <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="lg:w-1/2">
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm font-medium text-red-800">{serverError}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <div className="relative">
                    <input
                      id="companyName"
                      type="text"
                      {...register("companyName")}
                      className={`block w-full px-4 py-3 rounded-lg border text-black ${
                        errors.companyName
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      } shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                      placeholder="Acme Inc."
                    />
                    {!errors.companyName && watch("companyName")?.length >= 2 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name")}
                    className={`block w-full px-4 py-3 rounded-lg border text-black ${
                      errors.name
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    placeholder="John Smith"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                    Work Email *
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      {...register("email")}
                      className={`block w-full px-4 py-3 rounded-lg border ${
                        errors.email
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      } shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                      placeholder="john@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...register("password")}
                    className={`block w-full px-4 py-3 rounded-lg border text-black ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.password.message}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div
                      className={`flex items-center ${/(?=.*[A-Z])/.test(watchedPassword || "") ? "text-green-600" : ""}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        {/(?=.*[A-Z])/.test(watchedPassword || "") ? (
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                        )}
                      </svg>
                      Uppercase letter
                    </div>
                    <div
                      className={`flex items-center ${/(?=.*[a-z])/.test(watchedPassword || "") ? "text-green-600" : ""}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        {/(?=.*[a-z])/.test(watchedPassword || "") ? (
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                        )}
                      </svg>
                      Lowercase letter
                    </div>
                    <div
                      className={`flex items-center ${/(?=.*\d)/.test(watchedPassword || "") ? "text-green-600" : ""}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        {/(?=.*\d)/.test(watchedPassword || "") ? (
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                        )}
                      </svg>
                      Number
                    </div>
                    <div className={`flex items-center ${(watchedPassword?.length || 0) >= 8 ? "text-green-600" : ""}`}>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        {(watchedPassword?.length || 0) >= 8 ? (
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                        )}
                      </svg>
                      8+ characters
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </Link>
                    ,{" "}
                    <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </Link>
                    , and to receive occasional product updates
                  </label>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white ${
                      isLoading
                        ? "bg-gradient-to-r from-blue-400 to-blue-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
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
                        Creating your account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">© 2025 Scales Flow. All rights reserved.</p>
      </div>
    </div>
  )
}