"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  company_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  login_count: number;
  last_login_at: string | null;
  created_at: string;
}

export interface LoginHistory {
  id: string;
  activity_type: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/profile")
      .then(({ data }) => {
        if (data.success) {
          setProfile(data.user);
          setLoginHistory(data.loginHistory);
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const updateProfile = async (fields: {
    name?: string;
    company_name?: string;
  }) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await axios.patch("/api/profile", fields);
      if (!data.success) throw new Error(data.error);
      setProfile((prev) => (prev ? { ...prev, ...fields } : prev));
      setSuccess(data.message);
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to update profile",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await axios.patch("/api/profile", {
        currentPassword,
        newPassword,
      });
      if (!data.success) throw new Error(data.error);
      setSuccess(data.message);
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to change password",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loginHistory,
    loading,
    saving,
    error,
    success,
    updateProfile,
    changePassword,
  };
}
