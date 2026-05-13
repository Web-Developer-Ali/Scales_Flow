"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface ManagerDeal {
  id: string;
  title: string;
  company: string;
  contact_person: string | null;
  contact_email: string | null;
  value: number;
  stage: string;
  status: string;
  probability: number;
  expected_close_date: string | null;
  description: string | null;
  assigned_to: string;
  rep_name: string;
  rep_email: string;
  days_in_stage: number;
  created_at: string;
  updated_at: string;
}

export interface RepSummary {
  id: string;
  name: string;
  total_deals: number;
  active_deals: number;
  won_deals: number;
  pipeline_value: number;
}

export interface ManagerDealsStats {
  totalDeals: number;
  totalPipeline: number;
  avgProbability: number;
  expectedRevenue: number;
  wonCount: number;
  activeCount: number;
  lostCount: number;
}

export interface ManagerDealsFilters {
  stage: string;
  status: string;
  search: string;
  rep: string;
  sort: string;
}

const DEFAULT_FILTERS: ManagerDealsFilters = {
  stage: "all",
  status: "all",
  search: "",
  rep: "all",
  sort: "created_at_desc",
};

export function useManagerDeals() {
  const [deals, setDeals] = useState<ManagerDeal[]>([]);
  const [reps, setReps] = useState<RepSummary[]>([]);
  const [stats, setStats] = useState<ManagerDealsStats | null>(null);
  const [filters, setFilters] = useState<ManagerDealsFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async (f: ManagerDealsFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (f.stage !== "all") params.set("stage", f.stage);
      if (f.status !== "all") params.set("status", f.status);
      if (f.rep !== "all") params.set("rep", f.rep);
      if (f.search.trim()) params.set("search", f.search.trim());
      if (f.sort) params.set("sort", f.sort);

      const { data } = await axios.get(
        `/api/manager/my-deals?${params.toString()}`,
      );

      if (data.success) {
        setDeals(data.deals);
        setStats(data.stats);
        setReps(data.reps);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load deals",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchDeals(filters), 300);
    return () => clearTimeout(t);
  }, [filters, fetchDeals]);

  const updateFilter = (key: keyof ManagerDealsFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.stage !== "all" ||
    filters.status !== "all" ||
    filters.rep !== "all" ||
    filters.search !== "" ||
    filters.sort !== "created_at_desc";

  return {
    deals,
    reps,
    stats,
    filters,
    loading,
    error,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    refetch: () => fetchDeals(filters),
  };
}
