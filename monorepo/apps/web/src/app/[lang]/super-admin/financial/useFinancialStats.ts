'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSession } from 'next-auth/react';
import type { FinancialStats, PeriodType, FilterMode } from './types';

interface UseFinancialStatsReturn {
  stats: FinancialStats | null;
  loading: boolean;
  authLoading: boolean;
  staff: ReturnType<typeof useStaffAuth>['staff'];
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  loadStats: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

export function useFinancialStats(lang: string): UseFinancialStatsReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('30days');
  const [filterMode, setFilterMode] = useState<FilterMode>('preset');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const getAuthToken = async () => {
    const session = await getSession();
    if (!session) return null;
    return session?.user?.backendToken || (session as any)?.backendToken || null;
  };

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        console.error('Not authenticated');
        return;
      }

      const queryParams = new URLSearchParams();

      if (filterMode === 'custom') {
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
      } else {
        queryParams.append('period', period);
      }

      const response = await fetch(`/api/editor/financial/stats?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        setStats(data.data);
      } else {
        console.error('Failed to load financial stats:', data.message);
      }
    } catch (error) {
      console.error('Error loading financial stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period, filterMode, startDate, endDate]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    loadStats();
  }, [authLoading, staff, isSuperAdmin, lang, router, loadStats]);

  return {
    stats,
    loading,
    authLoading,
    staff,
    period,
    setPeriod,
    filterMode,
    setFilterMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loadStats,
    handleLogout,
  };
}
