'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import type { DashboardStats, DashboardUser, ChartRange } from './types';

interface UseDashboardReturn {
  // Auth & navigation
  lang: string;
  staff: ReturnType<typeof useStaffAuth>['staff'];
  handleLogout: () => Promise<void>;

  // Stats
  stats: DashboardStats | null;
  loading: boolean;

  // Charts
  chartLabels: string[];
  revenueSeries: number[];
  userSeries: number[];
  chartLoading: boolean;
  chartRange: ChartRange;
  setChartRange: (range: ChartRange) => void;

  // Users
  users: DashboardUser[];
  userLoading: boolean;
  userSearch: string;
  setUserSearch: (search: string) => void;
  filteredUsers: DashboardUser[];
}

export function useDashboard(): UseDashboardReturn {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  // Stats state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Chart state
  const [chartLoading, setChartLoading] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>('7d');
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<number[]>([]);
  const [userSeries, setUserSeries] = useState<number[]>([]);

  // User state
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadDashboardData = useCallback(async () => {
    try {
      const statsResponse = await apiClient.getAdminStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      setUserLoading(true);
      // Use fetch for Next.js API route instead of apiClient (which points to Express)
      const usersRes = await fetch('/api/super-admin/users?limit=500', {
        credentials: 'include',
      });
      if (usersRes.ok) {
        const usersResponse = await usersRes.json();
        if (usersResponse.success && usersResponse.data) {
          setUsers(
            usersResponse.data.map((u: any) => ({
              id: u.id,
              fullName: u.full_name || u.fullName || '',
              email: u.email || '',
              phone: u.phone || null,
              businessVerificationStatus: u.business_verification_status || u.businessVerificationStatus || null,
              individualVerified: Boolean(u.individual_verified ?? u.individualVerified),
            }))
          );
        }
      }
      setUserLoading(false);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setUserLoading(false);
      setLoading(false);
    }
  }, []);

  const loadCharts = useCallback(async (range: ChartRange) => {
    try {
      setChartLoading(true);
      const res = await fetch(`/api/admin/analytics?range=${range}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setChartLabels(data.data.labels || []);
          setRevenueSeries(data.data.revenueSeries || []);
          setUserSeries(data.data.userSeries || []);
        }
      }
    } catch (error) {
      console.error('Failed to load analytics charts:', error);
    } finally {
      setChartLoading(false);
    }
  }, []);

  const handleChartRangeChange = useCallback((range: ChartRange) => {
    setChartRange(range);
    loadCharts(range);
  }, [loadCharts]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadDashboardData();
      loadCharts(chartRange);
    }
  }, [authLoading, staff, isSuperAdmin, lang, router, loadDashboardData, loadCharts, chartRange]);

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );
  });

  return {
    lang,
    staff,
    handleLogout,
    stats,
    loading,
    chartLabels,
    revenueSeries,
    userSeries,
    chartLoading,
    chartRange,
    setChartRange: handleChartRangeChange,
    users,
    userLoading,
    userSearch,
    setUserSearch,
    filteredUsers,
  };
}
