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
import { ClientSelector } from "@/components/clients/search_client/client-selector";

export default function AddDealPage() {
  const router = useRouter();
  const session = useSession();
  const role = session.data?.user?.role ?? "";

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [validation, setValidation] =
    useState<ValidationState>(INITIAL_VALIDATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client link state — separate from formData so it doesn't
  // conflict with the existing types file
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);

  const getTodayDate = () => new Date().toISOString().split("T")[0];

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
        if (value.trim().length === 0) return true;
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

    if (error) setError(null);
  };

  const handleSelect = (name: keyof FormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "stage") {
        next.probability = String(STAGE_PROBABILITY[value] ?? prev.probability);
      }
      return next;
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        client_id: clientId ?? null, // ← send linked client
      });

      if (!data.success) throw new Error(data.error);

      toast.success(data.message || "Deal created successfully", {
        description: `Deal "${formData.title}" has been added to your pipeline${
          clientName ? ` and linked to ${clientName}` : ""
        }`,
        duration: 3000,
      });

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
      {/* ── Header ────────────────────────────────────────────────────── */}
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

      {/* ── Form ──────────────────────────────────────────────────────── */}
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
          {/* Existing sections — unchanged */}
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

          {/* ── Link to Client ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Link to Client
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Optionally associate this deal with an existing client to track
                relationship history.
              </p>
            </div>

            <ClientSelector
              value={clientId}
              displayName={clientName}
              onChange={(id, name) => {
                setClientId(id);
                setClientName(name);
              }}
              placeholder="Search your clients..."
              disabled={isSubmitting}
            />

            {clientId && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                This deal will appear in {clientName}&apos;s deal history
              </p>
            )}
          </div>

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
