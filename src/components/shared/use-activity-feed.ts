"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface ActivityItem {
  id: string;
  activity_type: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;

  user_id: string;
  user_name: string | null;
  user_role: string | null;

  performed_by: string | null;
  performed_by_name: string | null;

  deal_title: string | null;
  deal_company: string | null;
  deal_value: number | null;
  client_name: string | null;
  affected_user_name: string | null;
}

export type ActivityTypeFilter =
  | "all"
  | "deal_created"
  | "deal_updated"
  | "deal_deleted"
  | "user_created"
  | "user_blocked"
  | "user_unblocked"
  | "user_deleted"
  | "team_assigned";

export function useActivityFeed(pollIntervalMs = 60_000) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>("all");
  const [offset, setOffset] = useState(0);

  const LIMIT = 20;

  const fetch = useCallback(
    async (
      reset = false,
      currentOffset = 0,
      currentType: ActivityTypeFilter = "all",
    ) => {
      try {
        reset ? setLoading(true) : setLoadingMore(true);
        setError(null);

        const params = new URLSearchParams({
          limit: String(LIMIT),
          offset: String(currentOffset),
        });
        if (currentType !== "all") params.set("type", currentType);

        const { data } = await axios.get(
          `/api/activity-feed?${params.toString()}`,
        );

        if (data.success) {
          setActivities((prev) =>
            reset ? data.activities : [...prev, ...data.activities],
          );
          setTotal(data.total);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to load activity feed",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Initial load + type filter change
  useEffect(() => {
    setOffset(0);
    fetch(true, 0, typeFilter);
  }, [typeFilter, fetch]);

  // Poll for new activity silently
  useEffect(() => {
    const interval = setInterval(
      () => fetch(true, 0, typeFilter),
      pollIntervalMs,
    );
    return () => clearInterval(interval);
  }, [typeFilter, pollIntervalMs, fetch]);

  const loadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetch(false, newOffset, typeFilter);
  };

  const hasMore = activities.length < total;

  return {
    activities,
    total,
    loading,
    loadingMore,
    error,
    typeFilter,
    hasMore,
    setTypeFilter,
    loadMore,
    refetch: () => fetch(true, 0, typeFilter),
  };
}
