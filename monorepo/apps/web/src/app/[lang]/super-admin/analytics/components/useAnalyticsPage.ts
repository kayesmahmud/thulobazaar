'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import type { AnalyticsData, TimeRange, PeriodMode } from './types';

const currentYear = new Date().getFullYear();

export function useAnalyticsPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [periodMode, setPeriodMode] = useState<PeriodMode>('quick');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      let queryParams: string;
      if (periodMode === 'quick') {
        queryParams = `range=${timeRange}`;
      } else if (periodMode === 'monthly') {
        queryParams = `month=${selectedMonth}&year=${selectedYear}`;
      } else {
        queryParams = `year=${selectedYear}`;
      }

      const res = await fetch(`/api/super-admin/analytics?${queryParams}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [periodMode, timeRange, selectedMonth, selectedYear]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }
    loadAnalytics();
  }, [authLoading, staff, isSuperAdmin, lang, router, loadAnalytics]);

  return {
    // Auth
    staff,
    authLoading,
    handleLogout,
    // State
    periodMode,
    setPeriodMode,
    timeRange,
    setTimeRange,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    loading,
    analytics,
    // Actions
    loadAnalytics,
  };
}
