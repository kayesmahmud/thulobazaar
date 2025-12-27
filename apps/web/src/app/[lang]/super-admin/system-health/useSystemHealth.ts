'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/navigation';
import type { SystemHealthData } from './types';

export interface UseSystemHealthReturn {
  // Auth
  staff: ReturnType<typeof useStaffAuth>['staff'];
  navSections: ReturnType<typeof getSuperAdminNavSections>;
  handleLogout: () => Promise<void>;

  // Data
  healthData: SystemHealthData | null;
  loading: boolean;
  lastRefresh: Date;

  // Controls
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  refresh: () => void;
}

export function useSystemHealth(lang: string): UseSystemHealthReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const navSections = useMemo(() => getSuperAdminNavSections(lang), [lang]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadHealthData = useCallback(async () => {
    try {
      const response = await apiClient.getSystemHealth();
      if (response.success && response.data) {
        setHealthData(response.data as SystemHealthData);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error loading system health:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadHealthData();
    }
  }, [authLoading, staff, isSuperAdmin, lang, router, loadHealthData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadHealthData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadHealthData]);

  return {
    staff,
    navSections,
    handleLogout,
    healthData,
    loading,
    lastRefresh,
    autoRefresh,
    setAutoRefresh,
    refresh: loadHealthData,
  };
}
