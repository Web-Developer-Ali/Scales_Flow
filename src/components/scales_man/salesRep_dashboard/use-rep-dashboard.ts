"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { RepDashboardData } from "@/types/scales_man/dashboard";

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
