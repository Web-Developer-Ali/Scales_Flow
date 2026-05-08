"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export interface RepPerformance {
  id: string;
  name: string;
  closed_deals: number;
  total_value: number;
}

export interface MyDeal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  status: string;
  days_in_stage: number;
}

export interface TeamRecentDeal {
  id: string;
  company: string;
  contact: string | null;
  value: number;
  stage: string;
  status: string;
  probability: number;
  rep_name: string;
  days_in_stage: number;
  updated_at: string;
}

export interface ManagerDashboardData {
  month: string;
  personal: {
    pipeline: number;
    closedValue: number;
    closedCount: number;
    avgCloseTime: number;
    deals: MyDeal[];
  };
  team: {
    size: number;
    pipeline: number;
    closedValue: number;
    closedCount: number;
    target: number;
    targetPercent: number;
    pipelineDelta: number | null;
    closedDelta: number | null;
  };
  repPerformance: RepPerformance[];
  teamRecent: TeamRecentDeal[];
}

export function useManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/manager/dashboard")
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
