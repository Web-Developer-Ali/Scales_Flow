"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { RepPerformanceData } from "@/types/scales_man/performance";

export function useRepPerformance() {
  const [data, setData] = useState<RepPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/sales-rep/performance")
      .then((res) => {
        if (res.data.success) setData(res.data);
        else throw new Error(res.data.error);
      })
      .catch((err) => {
        setError(
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to load performance data",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
