'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/navigation';
import type { AuditData, TimeRange, ActiveTab } from './types';

export interface UseSecurityAuditReturn {
  // Auth
  staff: ReturnType<typeof useStaffAuth>['staff'];
  navSections: ReturnType<typeof getSuperAdminNavSections>;
  handleLogout: () => Promise<void>;

  // Data
  auditData: AuditData | null;
  loading: boolean;

  // Filters & tabs
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;

  // Actions
  refresh: () => void;
}

export function useSecurityAudit(lang: string): UseSecurityAuditReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const navSections = useMemo(() => getSuperAdminNavSections(lang), [lang]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadAuditData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSecurityAudit({ timeRange, page: currentPage, limit: 50 });
      if (response.success && response.data) {
        setAuditData(response.data as AuditData);
      }
    } catch (error) {
      console.error('Error loading security audit:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, currentPage]);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadAuditData();
    }
  }, [authLoading, staff, isSuperAdmin, lang, router, loadAuditData]);

  return {
    staff,
    navSections,
    handleLogout,
    auditData,
    loading,
    timeRange,
    setTimeRange,
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    refresh: loadAuditData,
  };
}
