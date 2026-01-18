"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    Prospect: "bg-slate-500/20 text-slate-300",
    Qualified: "bg-blue-500/20 text-blue-300",
    Demo: "bg-cyan-500/20 text-cyan-300",
    Proposal: "bg-amber-500/20 text-amber-300",
    Negotiation: "bg-orange-500/20 text-orange-300",
    Closed: "bg-emerald-500/20 text-emerald-300",
  };
  return colors[stage] || "bg-gray-500/20 text-gray-300";
};

export default function ViewAllDealsClient() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSuggestions] = useState([]);
  const [selectedStage, setSelectedStage] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Metrics state
  const [metrics, setMetrics] = useState({
    totalDeals: 0,
    pipelineValue: 0,
    closedValue: 0,
    avgProbability: 0,
  });

  // Fetch deals data
  const fetchDeals = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/get_Deals_Details?page=${page}`);
      const data = await response.json();

      if (data.success) {
        setDeals(data.deals);
        setTotalPages(data.totalPages);
        setCurrentPage(page);
        setMetrics({
          totalDeals: data.totalDeals,
          pipelineValue: data.pipelineValue,
          closedValue: data.closedValue,
          avgProbability: data.avgProbability,
        });
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch search suggestions
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/deals_search_suggestions?q=${encodeURIComponent(
          searchQuery
        )}&limit=10`
      );
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDeals(1);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and sort deals
  const filteredDeals = deals.filter((deal: any) => {
    const matchesSearch =
      deal.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage =
      selectedStage === "all" || deal.stage === selectedStage;

    return matchesSearch && matchesStage;
  });

  const sortedDeals = [...filteredDeals].sort((a: any, b: any) => {
    if (sortBy === "value") return (b.value || 0) - (a.value || 0);
    if (sortBy === "probability")
      return (b.probability || 0) - (a.probability || 0);
    return (
      new Date(b.expectedCloseDate || 0).getTime() -
      new Date(a.expectedCloseDate || 0).getTime()
    );
  });

  const handleExport = () => {
    // CSV export logic
    const csvContent = [
      [
        "Company",
        "Title",
        "Salesperson",
        "Value",
        "Stage",
        "Probability",
        "Closing Date",
      ],
      ...sortedDeals.map((deal: any) => [
        deal.company,
        deal.title,
        deal.assignedTo,
        deal.value,
        deal.stage,
        deal.probability,
        deal.expectedCloseDate,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deals-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">All Deals</h1>
          <p className="text-muted-foreground">
            Manage and track all deals across your organization
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Total Deals</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  metrics.totalDeals
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">
                Pipeline Value
              </p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  `$${(metrics.pipelineValue / 1000).toFixed(0)}K`
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Closed Value</p>
              <p className="text-2xl font-bold text-emerald-400">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  `$${(metrics.closedValue / 1000).toFixed(0)}K`
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">
                Avg Probability
              </p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  `${Math.round(metrics.avgProbability || 0)}%`
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search with Suggestions */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, title, or salesperson..."
                  className="pl-10 bg-secondary border-border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchSuggestions.map((suggestion: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                        onClick={() => {
                          setSearchTerm(
                            suggestion.company || suggestion.title || ""
                          );
                          setSuggestions([]);
                        }}
                      >
                        <div className="font-medium">{suggestion.company}</div>
                        <div className="text-xs text-muted-foreground">
                          {suggestion.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stage Filter */}
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Demo">Demo</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Closing Date</SelectItem>
                  <SelectItem value="value">Deal Value</SelectItem>
                  <SelectItem value="probability">Probability</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                className="bg-black hover:bg-black/80 text-white gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deals Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Deal List</CardTitle>
            <CardDescription>
              Showing {sortedDeals.length} deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                          Company
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                          Title
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                          Salesperson
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                          Value
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                          Stage
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground">
                          Probability
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground">
                          Closing Date
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDeals.map((deal: any) => (
                        <tr
                          key={deal.id}
                          className="border-b border-border hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-4 px-4 font-medium text-foreground">
                            {deal.company}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {deal.title}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {deal.assignedTo}
                          </td>
                          <td className="py-4 px-4 font-semibold text-primary text-right">
                            ${deal.value?.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={getStageColor(deal.stage)}>
                              {deal.stage}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-12 bg-secondary rounded-full h-1.5">
                                <div
                                  className="bg-accent h-full rounded-full"
                                  style={{ width: `${deal.probability}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">
                                {deal.probability}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-center text-xs">
                            {new Date(
                              deal.expectedCloseDate
                            ).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sortedDeals.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No deals found matching your filters
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchDeals(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchDeals(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
