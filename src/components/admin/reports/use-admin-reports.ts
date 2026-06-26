"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { AdminReportsData } from "@/types/admin/reports";

export function useAdminReports() {
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/admin/reports")
      .then((res) => {
        if (res.data.success) setData(res.data);
        else throw new Error(res.data.error);
      })
      .catch((err) => {
        setError(
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to load reports",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
