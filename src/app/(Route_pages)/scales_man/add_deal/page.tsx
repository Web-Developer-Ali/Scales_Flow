"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

// ── Matches DB enum exactly ────────────────────────────────────────────────────
const STAGES = [
  { value: "prospect", label: "Prospect" },
  { value: "qualified", label: "Qualified" },
  { value: "demo", label: "Demo" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed", label: "Closed" },
] as const;

// Default probability per stage — auto-fills when stage changes
const STAGE_PROBABILITY: Record<string, number> = {
  prospect: 10,
  qualified: 30,
  demo: 50,
  negotiation: 75,
  closed: 100,
};

interface FormData {
  title: string;
  company: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  value: string;
  stage: string;
  probability: string;
  expected_close_date: string;
  description: string;
  currency: string;
}

const INITIAL_FORM: FormData = {
  title: "",
  company: "",
  contact_person: "",
  contact_email: "",
  contact_phone: "",
  value: "",
  stage: "prospect",
  probability: "10",
  expected_close_date: "",
  description: "",
  currency: "USD",
};

export default function AddDealPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.title.trim()) {
      setError("Deal title is required");
      return;
    }
    if (!formData.company.trim()) {
      setError("Company name is required");
      return;
    }
    if (!formData.contact_email.trim()) {
      setError("Contact email is required");
      return;
    }
    if (!formData.value || parseFloat(formData.value) <= 0) {
      setError("Enter a valid deal value greater than 0");
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

      // Redirect to deals list on success
      router.push("/rep/deals");
      router.refresh();
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to create deal. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="mb-4 bg-transparent hover:bg-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Create New Deal
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a new opportunity to your pipeline
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Company & Contact ─────────────────────────────────────── */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Company & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Deal Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="title"
                    placeholder="e.g., Acme Corp — SEO Retainer"
                    value={formData.title}
                    onChange={handleInput}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="company"
                    placeholder="e.g., Acme Corporation"
                    value={formData.company}
                    onChange={handleInput}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Contact Person
                  </label>
                  <Input
                    name="contact_person"
                    placeholder="e.g., John Smith"
                    value={formData.contact_person}
                    onChange={handleInput}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="contact_email"
                    type="email"
                    placeholder="e.g., john@acme.com"
                    value={formData.contact_email}
                    onChange={handleInput}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contact Phone
                </label>
                <Input
                  name="contact_phone"
                  placeholder="e.g., +1 (555) 123-4567"
                  value={formData.contact_phone}
                  onChange={handleInput}
                  className="bg-background border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Deal Details ───────────────────────────────────────────── */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Deal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Deal Value (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      name="value"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.value}
                      onChange={handleInput}
                      className="bg-background border-border pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Expected Close Date
                  </label>
                  <Input
                    name="expected_close_date"
                    type="date"
                    value={formData.expected_close_date}
                    onChange={handleInput}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Stage <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.stage}
                    onValueChange={(v) => handleSelect("stage", v)}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Close Probability (%)
                    <span className="text-red-500"> *</span>
                  </label>
                  <Input
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={handleInput}
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from stage — adjust if needed
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  name="description"
                  placeholder="What does this client need? Any specific requirements, context, or notes..."
                  value={formData.description}
                  onChange={handleInput}
                  className="bg-background border-border resize-none"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            <span className="text-red-500">*</span> Required fields
          </p>
        </form>
      </div>
    </main>
  );
}
