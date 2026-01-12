export type SalesRep = {
  id: number;
  name: string;
  email: string;
  totalRevenue: number;
  dealsClosedJan: number;
  dealsClosedFeb: number;
  dealsClosedMar: number;
  avgDealSize: number;
  conversionRateJan: number;
  conversionRateFeb: number;
  conversionRateMar: number;
};

export type Month = {
  value: string;
  label: string;
};

export type FilteredRep = SalesRep & {
  deals: number;
  conversionRate: number;
};

export type ChartData = {
  name: string;
  revenue: number;
  deals: number;
};

export type PerformanceTier = "top" | "avg" | "struggling";
