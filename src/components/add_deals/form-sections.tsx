import type React from "react";
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
import { CheckCircle2, XCircle } from "lucide-react";
import {
  STAGES,
  CURRENCIES,
  type FormData,
  type ValidationState,
} from "./types";

interface FormSectionsProps {
  formData: FormData;
  validation: ValidationState;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSelectChange: (name: keyof FormData, value: string) => void;
  getTodayDate: () => string;
}

export function CompanyContactSection({
  formData,
  validation,
  onInputChange,
}: Omit<FormSectionsProps, "onSelectChange" | "getTodayDate">) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 pb-4">
        <CardTitle className="text-slate-900">
          Company & Contact Information
        </CardTitle>
        <p className="text-xs text-slate-600 mt-1 font-normal">
          Basic details about the opportunity and your contact
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Deal Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                name="title"
                placeholder="e.g., Acme Corp — SEO Retainer"
                value={formData.title}
                onChange={onInputChange}
                className={`bg-white border-slate-200 transition-all focus:border-blue-400 ${
                  validation.title === false
                    ? "border-red-300 focus:ring-red-100"
                    : ""
                } ${validation.title === true ? "border-green-300 focus:ring-green-100" : ""}`}
              />
              {validation.title === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
              {validation.title === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>
            {validation.title === false && (
              <p className="text-xs text-red-600">Deal title is required</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                name="company"
                placeholder="e.g., Acme Corporation"
                value={formData.company}
                onChange={onInputChange}
                className={`bg-white border-slate-200 transition-all focus:border-blue-400 ${
                  validation.company === false
                    ? "border-red-300 focus:ring-red-100"
                    : ""
                } ${validation.company === true ? "border-green-300 focus:ring-green-100" : ""}`}
              />
              {validation.company === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
              {validation.company === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>
            {validation.company === false && (
              <p className="text-xs text-red-600">Company name is required</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Contact Person
            </label>
            <Input
              name="contact_person"
              placeholder="e.g., John Smith"
              value={formData.contact_person}
              onChange={onInputChange}
              className="bg-white border-slate-200 transition-all focus:border-blue-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                name="contact_email"
                type="email"
                placeholder="e.g., john@acme.com"
                value={formData.contact_email}
                onChange={onInputChange}
                className={`bg-white border-slate-200 transition-all focus:border-blue-400 ${
                  validation.contact_email === false
                    ? "border-red-300 focus:ring-red-100"
                    : ""
                } ${validation.contact_email === true ? "border-green-300 focus:ring-green-100" : ""}`}
              />
              {validation.contact_email === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
              {validation.contact_email === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>
            {validation.contact_email === false && (
              <p className="text-xs text-red-600">
                Valid email address is required
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900">
            Contact Phone
          </label>
          <Input
            name="contact_phone"
            placeholder="e.g., +1 (555) 123-4567"
            value={formData.contact_phone}
            onChange={onInputChange}
            className="bg-white border-slate-200 transition-all focus:border-blue-400"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function DealDetailsSection({
  formData,
  validation,
  onInputChange,
  onSelectChange,
  getTodayDate,
}: FormSectionsProps) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 pb-4">
        <CardTitle className="text-slate-900">Deal Details</CardTitle>
        <p className="text-xs text-slate-600 mt-1 font-normal">
          Financial and timeline information for this opportunity
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Deal Value <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-medium text-sm">
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                      ? "€"
                      : "£"}
                </span>
                <Input
                  name="value"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.value}
                  onChange={onInputChange}
                  className={`bg-white border-slate-200 pl-8 transition-all focus:border-blue-400 ${
                    validation.value === false
                      ? "border-red-300 focus:ring-red-100"
                      : ""
                  } ${validation.value === true ? "border-green-300 focus:ring-green-100" : ""}`}
                />
                {validation.value === true && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
                {validation.value === false && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              <Select
                value={formData.currency}
                onValueChange={(v) => onSelectChange("currency", v)}
              >
                <SelectTrigger className="w-28 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {validation.value === false && (
              <p className="text-xs text-red-600">
                Enter a value greater than 0
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Expected Close Date
            </label>
            <div className="relative">
              <Input
                name="expected_close_date"
                type="date"
                min={getTodayDate()}
                value={formData.expected_close_date}
                onChange={onInputChange}
                className={`bg-white border-slate-200 transition-all focus:border-blue-400 ${
                  validation.expected_close_date === false
                    ? "border-red-300 focus:ring-red-100"
                    : ""
                } ${
                  validation.expected_close_date === true &&
                  formData.expected_close_date
                    ? "border-green-300 focus:ring-green-100"
                    : ""
                }`}
              />
              {validation.expected_close_date === true &&
                formData.expected_close_date && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              {validation.expected_close_date === false &&
                formData.expected_close_date && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
            </div>
            {validation.expected_close_date === false &&
              formData.expected_close_date && (
                <p className="text-xs text-red-600">
                  Date cannot be in the past
                </p>
              )}
            {!formData.expected_close_date && (
              <p className="text-xs text-slate-500">
                Leave blank if date is unknown
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Stage <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.stage}
              onValueChange={(v) => onSelectChange("stage", v)}
            >
              <SelectTrigger className="bg-white border-slate-200 focus:border-blue-400 transition-all">
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
            <p className="text-xs text-slate-500">
              Updates win probability automatically
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Win Probability (%)
            </label>
            <div className="relative">
              <Input
                name="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={onInputChange}
                className="bg-white border-slate-200 transition-all focus:border-blue-400 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-medium text-sm">
                %
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Auto-filled from stage — adjust if needed
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900">
            Description
          </label>
          <Textarea
            name="description"
            placeholder="What does this client need? Any specific requirements, context, or notes..."
            value={formData.description}
            onChange={onInputChange}
            className="bg-white border-slate-200 resize-none transition-all focus:border-blue-400 min-h-24 sm:min-h-28"
            rows={4}
          />
          <p className="text-xs text-slate-500">
            Optional context to help remember details about this deal
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
