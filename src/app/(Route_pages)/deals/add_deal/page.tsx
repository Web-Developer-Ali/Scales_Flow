"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import {
  CompanyContactSection,
  DealDetailsSection,
} from "@/components/add_deals/form-sections";
import {
  STAGE_PROBABILITY,
  INITIAL_FORM,
  INITIAL_VALIDATION,
  type FormData,
  type ValidationState,
} from "@/components/add_deals/types";
import { useSession } from "next-auth/react";

export default function AddDealPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [validation, setValidation] =
    useState<ValidationState>(INITIAL_VALIDATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();
  const role = session.data?.user?.role ?? "";
  // Get today's date in YYYY-MM-DD format for min date validation
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const validateField = (name: string, value: string): boolean => {
    switch (name) {
      case "title":
        return value.trim().length > 0;
      case "company":
        return value.trim().length > 0;
      case "contact_email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return value.trim().length > 0 && emailRegex.test(value);
      }
      case "value":
        return value.trim().length > 0 && parseFloat(value) > 0;
      case "expected_close_date": {
        if (value.trim().length === 0) return true; // Optional field
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      }
      default:
        return true;
    }
  };

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation for key fields
    if (
      [
        "title",
        "company",
        "contact_email",
        "value",
        "expected_close_date",
      ].includes(name)
    ) {
      setValidation((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSelect = (name: keyof FormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-fill probability when stage changes
      if (name === "stage") {
        next.probability = String(STAGE_PROBABILITY[value] ?? prev.probability);
      }
      return next;
    });

    // Clear error when user selects
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Comprehensive client-side validation
    const newValidation: ValidationState = {
      title: validateField("title", formData.title),
      company: validateField("company", formData.company),
      contact_email: validateField("contact_email", formData.contact_email),
      value: validateField("value", formData.value),
      expected_close_date: validateField(
        "expected_close_date",
        formData.expected_close_date,
      ),
    };

    setValidation(newValidation);

    if (!newValidation.title) {
      setError("Deal title is required");
      return;
    }
    if (!newValidation.company) {
      setError("Company name is required");
      return;
    }
    if (!newValidation.contact_email) {
      setError("Valid contact email is required");
      return;
    }
    if (!newValidation.value) {
      setError("Enter a valid deal value greater than 0");
      return;
    }
    if (!newValidation.expected_close_date && formData.expected_close_date) {
      setError("Expected close date cannot be in the past");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post("/api/deals/create", {
        ...formData,
        value: parseFloat(formData.value),
        probability: parseInt(formData.probability),
      });

      if (!data.success) throw new Error(data.error);

      // Show success toast
      toast.success(data.message || "Deal created successfully", {
        description: `Deal "${formData.title}" has been added to your pipeline`,
        duration: 3000,
      });

      // Redirect to deals list on success
      setTimeout(() => {
        router.push(`/${role}/my-deals`);
        router.refresh();
      }, 1500);
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to create deal. Please try again.";

      setError(errorMessage);

      // Show error toast using Sonner
      toast.error("Failed to create deal", {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (role !== "scales_man" && role !== "manager") {
    return <div>unauthorized...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="mb-4 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-balance">
              Create New Deal
            </h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Add a new opportunity to your sales pipeline
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {error && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 border-red-200 animate-in fade-in slide-in-from-top-2"
          >
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <CompanyContactSection
            formData={formData}
            validation={validation}
            onInputChange={handleInput}
          />

          <DealDetailsSection
            formData={formData}
            validation={validation}
            onInputChange={handleInput}
            onSelectChange={handleSelect}
            getTodayDate={getTodayDate}
          />

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              disabled={isSubmitting}
              className="sm:flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-all"
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-slate-600 text-center font-medium">
            <span className="text-red-500">*</span> Indicates required field
          </p>
        </form>
      </div>
    </main>
  );
}
