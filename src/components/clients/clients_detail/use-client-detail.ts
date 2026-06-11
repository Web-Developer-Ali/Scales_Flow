"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface ClientDetail {
  id: string;
  company_name: string;
  industry: string | null;
  website: string | null;
  address: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientDeal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  status: string;
  probability: number;
  expected_close_date: string | null;
  assigned_to_name: string | null;
  days_in_stage: number;
  created_at: string;
}

export interface DealStats {
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  totalRevenue: number;
  totalPipeline: number;
}

export function useClientDetail(clientId: string) {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [deals, setDeals] = useState<ClientDeal[]>([]);
  const [dealStats, setDealStats] = useState<DealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`/api/clients/${clientId}`);
      if (data.success) {
        setClient(data.client);
        setDeals(data.deals);
        setDealStats(data.dealStats);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load client",
      );
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const updateClient = async (fields: Partial<ClientDetail>) => {
    try {
      setSaving(true);
      setError(null);
      const { data } = await axios.patch(`/api/clients/${clientId}`, fields);
      if (!data.success) throw new Error(data.error);
      setClient((prev) => (prev ? { ...prev, ...fields } : prev));
      return true;
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to update client",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async () => {
    try {
      setSaving(true);
      const { data } = await axios.delete(`/api/clients/${clientId}`);
      if (!data.success) throw new Error(data.error);
      return true;
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to delete client",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    client,
    deals,
    dealStats,
    loading,
    saving,
    error,
    updateClient,
    deleteClient,
    refetch: fetchClient,
  };
}
