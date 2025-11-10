"use client";

import { useState, useEffect, useCallback } from "react";
import type { CompanySettings } from "@/types/company";

interface UseCompanySettingsResult {
  settings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCompanySettings(): UseCompanySettingsResult {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/settings/company");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر تحميل بيانات الشركة");
      }

      const data = (await response.json()) as CompanySettings | null;
      setSettings(data);
    } catch (err) {
      console.error("Failed to load company settings", err);
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات الشركة");
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
  };
}
