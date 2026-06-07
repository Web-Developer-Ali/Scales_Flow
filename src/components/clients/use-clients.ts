"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface Client {
  id: string;
  company_name: string;
  industry: string | null;
  website: string | null;
  status: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  notes: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  total_deals: number;
  active_deals: number;
  won_deals: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface ClientsSummary {
  totalClients: number;
  activeClients: number;
  prospectClients: number;
  inactiveClients: number;
}

export interface ClientFilters {
  status: string;
  industry: string;
  search: string;
  sort: string;
}

const DEFAULT_FILTERS: ClientFilters = {
  status: "all",
  industry: "all",
  search: "",
  sort: "created_at_desc",
};

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<ClientsSummary | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async (f: ClientFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (f.status !== "all") params.set("status", f.status);
      if (f.industry !== "all") params.set("industry", f.industry);
      if (f.search.trim()) params.set("search", f.search.trim());
      if (f.sort) params.set("sort", f.sort);

      const { data } = await axios.get(`/api/clients?${params.toString()}`);

      if (data.success) {
        setClients(data.clients);
        setSummary(data.summary);
        setIndustries(data.industries);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load clients",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchClients(filters), 300);
    return () => clearTimeout(t);
  }, [filters, fetchClients]);

  const updateFilter = (key: keyof ClientFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.industry !== "all" ||
    filters.search !== "" ||
    filters.sort !== "created_at_desc";

  return {
    clients,
    summary,
    industries,
    filters,
    loading,
    error,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    refetch: () => fetchClients(filters),
  };
}
