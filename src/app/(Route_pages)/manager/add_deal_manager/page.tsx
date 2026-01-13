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
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddDealPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    company: "",
    contact: "",
    email: "",
    phone: "",
    dealValue: "",
    stage: "Prospect",
    probability: "20",
    closingDate: "",
    description: "",
    nextAction: "Call",
    assignedTo: "",
  });

  const stages = [
    "Prospect",
    "Qualified",
    "Demo",
    "Proposal",
    "Negotiation",
    "Closed Won",
  ];
  const actions = [
    "Call",
    "Email",
    "Meeting",
    "Follow-up",
    "Demo",
    "Proposal",
    "Negotiation",
    "Contract",
    "Other",
  ];
  const teamMembers = [
    "Sarah Johnson",
    "Mike Chen",
    "David Martinez",
    "Emma Davis",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.company ||
      !formData.contact ||
      !formData.email ||
      !formData.dealValue
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log("New Deal Created:", formData);
      alert("Deal created successfully!");
      router.push("/manager");
    }, 1000);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="hover:bg-secondary bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Create New Deal
            </h1>
            <p className="text-muted-foreground mt-2">
              Add a new opportunity to the team pipeline and assign it to a team
              member
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          {/* Company & Contact Information */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="company"
                    placeholder="e.g., Acme Corporation"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Primary Contact <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="contact"
                    placeholder="e.g., John Smith"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="e.g., john@acme.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Phone
                  </label>
                  <Input
                    name="phone"
                    placeholder="e.g., (555) 123-4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Deal Description
                </label>
                <Textarea
                  name="description"
                  placeholder="Describe the deal, what they need, any specific requirements..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Deal Details */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle>Deal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Deal Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      name="dealValue"
                      type="number"
                      placeholder="0.00"
                      value={formData.dealValue}
                      onChange={handleInputChange}
                      className="bg-background border-border text-foreground pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Expected Closing Date
                  </label>
                  <Input
                    name="closingDate"
                    type="date"
                    value={formData.closingDate}
                    onChange={handleInputChange}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Stage <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) =>
                      handleSelectChange("stage", value)
                    }
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Close Probability (%){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={handleInputChange}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Next Action Needed <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.nextAction}
                    onValueChange={(value) =>
                      handleSelectChange("nextAction", value)
                    }
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Assign To <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) =>
                      handleSelectChange("assignedTo", value)
                    }
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member} value={member}>
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-black hover:bg-black/80"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Creating Deal..." : "Create Deal"}
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground mt-6 text-center">
            <span className="text-red-500">*</span> Indicates required fields.
            All deals must have company, contact, email, deal value, stage, and
            assignee information.
          </p>
        </form>
      </div>
    </main>
  );
}
