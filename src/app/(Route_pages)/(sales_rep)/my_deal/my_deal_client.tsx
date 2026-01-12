"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Plus, Search } from "lucide-react";

const allDeals = [
  {
    id: 1,
    company: "TechCorp Solutions",
    value: "$95K",
    stage: "Negotiation",
    probability: "85%",
    daysInStage: 5,
    contact: "John Smith",
    email: "john@techcorp.com",
    nextAction: "Waiting for signature",
  },
  {
    id: 2,
    company: "CloudSys Inc",
    value: "$120K",
    stage: "Proposal",
    probability: "75%",
    daysInStage: 8,
    contact: "Sarah Johnson",
    email: "sarah@cloudsys.com",
    nextAction: "Present changes",
  },
  {
    id: 3,
    company: "DataFlow Analytics",
    value: "$85K",
    stage: "Demo",
    probability: "60%",
    daysInStage: 12,
    contact: "Mike Chen",
    email: "mike@dataflow.com",
    nextAction: "Schedule demo",
  },
  {
    id: 4,
    company: "NextGen Software",
    value: "$150K",
    stage: "Qualified",
    probability: "40%",
    daysInStage: 3,
    contact: "Emma Davis",
    email: "emma@nextgen.com",
    nextAction: "Initial meeting",
  },
  {
    id: 5,
    company: "Innovate Tech",
    value: "$75K",
    stage: "Discovery",
    probability: "25%",
    daysInStage: 1,
    contact: "Alex Wilson",
    email: "alex@innovate.com",
    nextAction: "First contact",
  },
];

const getStageColor = (stage: string) => {
  switch (stage) {
    case "Negotiation":
      return "bg-green-500/10 text-green-500 border-green-500/30";
    case "Proposal":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "Demo":
      return "bg-cyan-500/10 text-cyan-500 border-cyan-500/30";
    case "Qualified":
      return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    default:
      return "bg-purple-500/10 text-purple-500 border-purple-500/30";
  }
};

export function MyDealsClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");

  const filteredDeals = allDeals.filter((deal) => {
    const matchesSearch =
      deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage =
      selectedStage === "all" || deal.stage === selectedStage;

    return matchesSearch && matchesStage;
  });

  const stages = [
    "all",
    "Discovery",
    "Qualified",
    "Demo",
    "Proposal",
    "Negotiation",
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Deals</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track all your active opportunities
              </p>
            </div>
            <Button className="bg-black hover:bg-black/80">
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Total Pipeline
              </p>
              <p className="text-2xl font-bold text-foreground">$525K</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Active Deals</p>
              <p className="text-2xl font-bold text-foreground">
                {allDeals.length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Avg Probability
              </p>
              <p className="text-2xl font-bold text-foreground">57%</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Expected Revenue
              </p>
              <p className="text-2xl font-bold text-foreground">$299K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by company or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {stages.map((stage) => (
              <Button
                key={stage}
                variant={selectedStage === stage ? "default" : "outline"}
                onClick={() => setSelectedStage(stage)}
                className={
                  selectedStage === stage ? "bg-black hover:bg-black/80" : ""
                }
              >
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-6 rounded-lg bg-card border border-border hover:border-border/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                      {deal.company}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact: {deal.contact} • {deal.email}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {deal.value}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant="outline"
                    className={getStageColor(deal.stage)}
                  >
                    {deal.stage}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-500 border-purple-500/30"
                  >
                    {deal.probability}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {deal.daysInStage} days in stage
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Next:{" "}
                    <span className="text-foreground font-medium">
                      {deal.nextAction}
                    </span>
                  </p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center rounded-lg bg-card border border-border">
              <p className="text-muted-foreground">
                No deals found matching your criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
