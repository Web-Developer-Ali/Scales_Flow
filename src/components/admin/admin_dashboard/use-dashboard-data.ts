"use client";

import { DashboardApiResponse } from "@/types/admin/admin_dashboard_types";
import { useEffect, useState } from "react";

export function useDashboardData() {
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import axios only when needed
        const axios = (await import("axios")).default;

        const response = await axios.get<DashboardApiResponse>(
          "/api/admin/dashboard",
          {
            timeout: 10000,
          },
        );
        console.log(response.data);
        if (response.status !== 200 || !response.data) {
          throw new Error("Unexpected response from server");
        }
        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err: any) {
        let message = "Unknown error";
        if (
          err.response &&
          err.response.data &&
          typeof err.response.data === "object"
        ) {
          // Handle API error response shape
          message =
            err.response.data.error || err.response.data.message || message;
        } else if (err.message) {
          message = err.message;
        }
        setError(message);
        console.error("[v0] Dashboard data fetch error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}
