"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Notification } from "@/types/shared";

export function useNotifications(pollIntervalMs = 30_000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await axios.get("/api/deals/notifications?limit=20");
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetch();
  }, [fetch]);

  // Poll for new notifications
  useEffect(() => {
    const interval = setInterval(() => fetch(true), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetch, pollIntervalMs]);

  const markRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await axios.patch("/api/deals/notifications", { id });
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await axios.patch("/api/deals/notifications", { markAllRead: true });
  };

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refetch: fetch,
  };
}
