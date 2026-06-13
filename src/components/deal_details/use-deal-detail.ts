"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface DealDetail {
  id: string;
  title: string;
  company: string;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  client_id: string | null;
  client_name: string | null;
  value: number;
  currency: string;
  stage: string;
  status: string;
  probability: number;
  expected_close_date: string | null;
  description: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  created_by: string;
  created_by_name: string | null;
  days_in_stage: number;
  created_at: string;
  updated_at: string;
}

export function useDealDetail(dealId: string) {
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`/api/deals/deal-detail/${dealId}`);
      if (data.success) setDeal(data.deal);
      else throw new Error(data.error);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load deal",
      );
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  const updateDeal = async (fields: Partial<DealDetail>) => {
    try {
      setSaving(true);
      setError(null);
      const { data } = await axios.patch(
        `/api/deals/deal-detail/${dealId}`,
        fields,
      );
      if (!data.success) throw new Error(data.error);
      // Merge updated fields into local state
      setDeal((prev) => (prev ? { ...prev, ...fields, ...data.deal } : prev));
      return true;
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to update deal",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteDeal = async () => {
    try {
      setSaving(true);
      const { data } = await axios.delete(`/api/deals/deal-detail/${dealId}`);
      if (!data.success) throw new Error(data.error);
      return true;
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to delete deal",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    deal,
    loading,
    saving,
    error,
    updateDeal,
    deleteDeal,
    refetch: fetchDeal,
  };
}
