"use client";

import { useState, useMemo } from "react";
import { Trophy, TrendingUp, AlertCircle } from "lucide-react";

import type React from "react";
import { MonthFilter } from "@/components/salesRep_performance/month-filter";
import { MetricsCards } from "@/components/salesRep_performance/metrics-cards";
import { PerformanceCharts } from "@/components/salesRep_performance/performance-charts";
import { PerformanceTable } from "@/components/salesRep_performance/performance-table";

export const MOCK_SALES_DATA = [
  {
    id: 1,
    name: "John Anderson",
    email: "john@example.com",
    totalRevenue: 145000,
    dealsClosedJan: 15,
    dealsClosedFeb: 17,
    dealsClosedMar: 19,
    avgDealSize: 9200,
    conversionRateJan: 42,
    conversionRateFeb: 45,
    conversionRateMar: 48,
  },
  {
    id: 2,
    name: "Sarah Mitchell",
    email: "sarah@example.com",
    totalRevenue: 128500,
    dealsClosedJan: 12,
    dealsClosedFeb: 14,
    dealsClosedMar: 16,
    avgDealSize: 8250,
    conversionRateJan: 38,
    conversionRateFeb: 41,
    conversionRateMar: 44,
  },
  {
    id: 3,
    name: "Mike Chen",
    email: "mike@example.com",
    totalRevenue: 165000,
    dealsClosedJan: 18,
    dealsClosedFeb: 20,
    dealsClosedMar: 22,
    avgDealSize: 9500,
    conversionRateJan: 45,
    conversionRateFeb: 48,
    conversionRateMar: 52,
  },
  {
    id: 4,
    name: "Emma Wilson",
    email: "emma@example.com",
    totalRevenue: 95300,
    dealsClosedJan: 10,
    dealsClosedFeb: 11,
    dealsClosedMar: 12,
    avgDealSize: 7500,
    conversionRateJan: 32,
    conversionRateFeb: 35,
    conversionRateMar: 38,
  },
  {
    id: 5,
    name: "David Kumar",
    email: "david@example.com",
    totalRevenue: 135800,
    dealsClosedJan: 14,
    dealsClosedFeb: 16,
    dealsClosedMar: 18,
    avgDealSize: 8400,
    conversionRateJan: 40,
    conversionRateFeb: 43,
    conversionRateMar: 46,
  },
  {
    id: 6,
    name: "Lisa Rodriguez",
    email: "lisa@example.com",
    totalRevenue: 72400,
    dealsClosedJan: 7,
    dealsClosedFeb: 8,
    dealsClosedMar: 9,
    avgDealSize: 6800,
    conversionRateJan: 24,
    conversionRateFeb: 26,
    conversionRateMar: 29,
  },
  {
    id: 7,
    name: "James Park",
    email: "james@example.com",
    totalRevenue: 112600,
    dealsClosedJan: 11,
    dealsClosedFeb: 13,
    dealsClosedMar: 15,
    avgDealSize: 7900,
    conversionRateJan: 35,
    conversionRateFeb: 38,
    conversionRateMar: 41,
  },
  {
    id: 8,
    name: "Rachel Green",
    email: "rachel@example.com",
    totalRevenue: 88900,
    dealsClosedJan: 9,
    dealsClosedFeb: 10,
    dealsClosedMar: 11,
    avgDealSize: 7300,
    conversionRateJan: 30,
    conversionRateFeb: 32,
    conversionRateMar: 35,
  },
  {
    id: 9,
    name: "Michael Brown",
    email: "michael@example.com",
    totalRevenue: 155000,
    dealsClosedJan: 16,
    dealsClosedFeb: 18,
    dealsClosedMar: 20,
    avgDealSize: 9400,
    conversionRateJan: 43,
    conversionRateFeb: 46,
    conversionRateMar: 50,
  },
  {
    id: 10,
    name: "Jessica Lee",
    email: "jessica@example.com",
    totalRevenue: 65800,
    dealsClosedJan: 6,
    dealsClosedFeb: 7,
    dealsClosedMar: 8,
    avgDealSize: 6200,
    conversionRateJan: 20,
    conversionRateFeb: 22,
    conversionRateMar: 25,
  },
  {
    id: 11,
    name: "Robert White",
    email: "robert@example.com",
    totalRevenue: 105500,
    dealsClosedJan: 11,
    dealsClosedFeb: 12,
    dealsClosedMar: 14,
    avgDealSize: 7600,
    conversionRateJan: 33,
    conversionRateFeb: 36,
    conversionRateMar: 39,
  },
  {
    id: 12,
    name: "Amanda Davis",
    email: "amanda@example.com",
    totalRevenue: 118900,
    dealsClosedJan: 12,
    dealsClosedFeb: 14,
    dealsClosedMar: 16,
    avgDealSize: 8100,
    conversionRateJan: 37,
    conversionRateFeb: 40,
    conversionRateMar: 43,
  },
  {
    id: 13,
    name: "Chris Martinez",
    email: "chris@example.com",
    totalRevenue: 52300,
    dealsClosedJan: 5,
    dealsClosedFeb: 6,
    dealsClosedMar: 7,
    avgDealSize: 5800,
    conversionRateJan: 18,
    conversionRateFeb: 20,
    conversionRateMar: 23,
  },
  {
    id: 14,
    name: "Patricia Johnson",
    email: "patricia@example.com",
    totalRevenue: 98700,
    dealsClosedJan: 10,
    dealsClosedFeb: 11,
    dealsClosedMar: 13,
    avgDealSize: 7400,
    conversionRateJan: 31,
    conversionRateFeb: 34,
    conversionRateMar: 37,
  },
  {
    id: 15,
    name: "Daniel Taylor",
    email: "daniel@example.com",
    totalRevenue: 142200,
    dealsClosedJan: 15,
    dealsClosedFeb: 17,
    dealsClosedMar: 19,
    avgDealSize: 9100,
    conversionRateJan: 41,
    conversionRateFeb: 44,
    conversionRateMar: 47,
  },
];

export const MONTHS = [
  { value: "jan", label: "January" },
  { value: "feb", label: "February" },
  { value: "mar", label: "March" },
  { value: "all", label: "All Months" },
];

export type SalesRep = (typeof MOCK_SALES_DATA)[0];

export const getMetricsForMonth = (rep: SalesRep, month: string) => {
  switch (month) {
    case "jan":
      return {
        deals: rep.dealsClosedJan,
        conversionRate: rep.conversionRateJan,
      };
    case "feb":
      return {
        deals: rep.dealsClosedFeb,
        conversionRate: rep.conversionRateFeb,
      };
    case "mar":
      return {
        deals: rep.dealsClosedMar,
        conversionRate: rep.conversionRateMar,
      };
    default:
      return {
        deals:
          (rep.dealsClosedJan + rep.dealsClosedFeb + rep.dealsClosedMar) / 3,
        conversionRate:
          (rep.conversionRateJan +
            rep.conversionRateFeb +
            rep.conversionRateMar) /
          3,
      };
  }
};

export const getPerformanceTier = (
  tier: "top" | "avg" | "struggling"
): { icon: React.ReactNode; label: string; color: string } => {
  switch (tier) {
    case "top":
      return {
        icon: <Trophy className="w-4 h-4" />,
        label: "Top Performer",
        color: "text-green-600",
      };
    case "avg":
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        label: "Average",
        color: "text-blue-600",
      };
    case "struggling":
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Needs Support",
        color: "text-orange-600",
      };
  }
};

export default function SalesPerformancePage() {
  const [selectedMonth, setSelectedMonth] = useState("all");

  const filteredData = useMemo(() => {
    return MOCK_SALES_DATA.map((rep) => {
      const metrics = getMetricsForMonth(rep, selectedMonth);
      return {
        ...rep,
        deals: Math.round(metrics.deals),
        conversionRate: Math.round(metrics.conversionRate),
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [selectedMonth]);

  const avgRevenue =
    filteredData.reduce((sum, rep) => sum + rep.totalRevenue, 0) /
    filteredData.length;
  const topPerformers = filteredData.filter(
    (rep) => rep.totalRevenue >= avgRevenue * 1.2
  );
  const averagePerformers = filteredData.filter(
    (rep) =>
      rep.totalRevenue >= avgRevenue * 0.8 &&
      rep.totalRevenue < avgRevenue * 1.2
  );
  const strugglingReps = filteredData.filter(
    (rep) => rep.totalRevenue < avgRevenue * 0.8
  );

  const chartData = filteredData.slice(0, 8).map((rep) => ({
    name: rep.name.split(" ")[0],
    revenue: rep.totalRevenue / 1000,
    deals: rep.deals,
  }));

  const totalRevenue = filteredData.reduce(
    (sum, rep) => sum + rep.totalRevenue,
    0
  );
  const totalDeals = filteredData.reduce((sum, rep) => sum + rep.deals, 0);
  const avgConversionRate = Math.round(
    filteredData.reduce((sum, rep) => sum + rep.conversionRate, 0) /
      filteredData.length
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sales Rep Performance
          </h1>
          <p className="text-gray-600">
            Track and analyze individual sales representative metrics across all
            team members
          </p>
        </div>

        {/* Filter */}
        <MonthFilter
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        {/* Key Metrics */}
        <MetricsCards
          totalRevenue={totalRevenue}
          totalDeals={totalDeals}
          avgConversionRate={avgConversionRate}
          teamSize={filteredData.length}
        />

        {/* Charts */}
        <PerformanceCharts chartData={chartData} />

        {/* Performance Tables */}
        <PerformanceTable
          title="Top Performers"
          description="Exceeding 120% of team average revenue"
          icon={<Trophy className="w-5 h-5" />}
          reps={topPerformers}
          badgeColor="bg-green-100 text-green-700"
          iconColor="text-green-600"
        />

        <PerformanceTable
          title="Average Performers"
          description="Within 80-120% of team average revenue"
          icon={<TrendingUp className="w-5 h-5" />}
          reps={averagePerformers}
          badgeColor="bg-blue-100 text-blue-700"
          iconColor="text-blue-600"
        />

        <PerformanceTable
          title="Needs Support"
          description="Below 80% of team average revenue - may need coaching or resources"
          icon={<AlertCircle className="w-5 h-5" />}
          reps={strugglingReps}
          badgeColor="bg-orange-100 text-orange-700"
          iconColor="text-orange-600"
        />
      </div>
    </div>
  );
}
