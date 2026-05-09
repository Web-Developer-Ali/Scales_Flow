"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export interface StageBreakdown {
  stage: string;
  deal_count: number;
  stage_value: number;
}

export interface RepDeal {
  id: string;
  title: string;
  company: string;
  contact: string | null;
  value: number;
  stage: string;
  status: string;
  probability: number;
  days_in_stage: number;
  created_at: string;
}

export interface NeedsAttentionDeal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  days_stale: number;
  days_in_stage: number;
}

export interface MonthlyTrend {
  month_label: string;
  won_count: number;
  active_count: number;
}

export interface RepMetricsData {
  pipelineValue: number;
  closedValue: number;
  closedCount: number;
  avgCloseTime: number;
  hotLeads: number;
  target: number;
  targetPercent: number;
  pipelineDelta: number | null;
  closedDelta: number | null;
}

export interface RepDashboardData {
  month: string;
  metrics: RepMetricsData;
  stageBreakdown: StageBreakdown[];
  recentDeals: RepDeal[];
  needsAttention: NeedsAttentionDeal[];
  monthlyTrend: MonthlyTrend[];
}

export function useRepDashboard() {
  const [data, setData] = useState<RepDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/sales-rep/dashboard")
      .then((res) => {
        if (res.data.success) setData(res.data);
        else throw new Error(res.data.error);
      })
      .catch((err) => {
        setError(
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to load dashboard",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
