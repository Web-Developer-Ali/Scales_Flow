"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface Deal {
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
  days_in_stage: number;
  created_at: string;
  updated_at: string;
}

export interface DealsStats {
  totalDeals: number;
  totalPipeline: number;
  avgProbability: number;
  expectedRevenue: number;
  wonCount: number;
  activeCount: number;
}

export interface Filters {
  stage: string;
  status: string;
  search: string;
  sort: string;
}

const DEFAULT_FILTERS: Filters = {
  stage: "all",
  status: "all",
  search: "",
  sort: "created_at_desc",
};

export function useMyDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealsStats | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async (f: Filters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (f.stage !== "all") params.set("stage", f.stage);
      if (f.status !== "all") params.set("status", f.status);
      if (f.search.trim()) params.set("search", f.search.trim());
      if (f.sort) params.set("sort", f.sort);

      const { data } = await axios.get(
        `/api/sales-rep/my-deals?${params.toString()}`,
      );

      if (data.success) {
        setDeals(data.deals);
        setStats(data.stats);
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

  // Debounce search — don't hit API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => fetchDeals(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchDeals]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return {
    deals,
    stats,
    filters,
    loading,
    error,
    updateFilter,
    resetFilters,
    refetch: () => fetchDeals(filters),
  };
}
