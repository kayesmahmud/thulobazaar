'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import {
  getReportedShops,
  dismissShopReport,
  suspendShopFromReport,
  unsuspendShopFromReport,
} from '@/lib/editorApi';
import type { ReportedShop, TabStatus, TabCounts } from './types';

export function useReportedShopsPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [reports, setReports] = useState<ReportedShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabCounts, setTabCounts] = useState<TabCounts>({ pending: 0, resolved: 0, dismissed: 0 });

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  const loadReportedShops = useCallback(
    async (status: TabStatus) => {
      try {
        setLoading(true);
        const response = await getReportedShops<ReportedShop>(undefined, {
          status,
          page,
          limit: 50,
        });

        if (response.success && Array.isArray(response.data)) {
          setReports(response.data);
        } else {
          setReports([]);
        }
      } catch (error) {
        console.error('Error loading reported shops:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    },
    [page]
  );

  const loadTabCounts = useCallback(async () => {
    try {
      const [pendingRes, resolvedRes, dismissedRes] = await Promise.all([
        getReportedShops<ReportedShop>(undefined, { status: 'pending', limit: 1 }),
        getReportedShops<ReportedShop>(undefined, { status: 'resolved', limit: 1 }),
        getReportedShops<ReportedShop>(undefined, { status: 'dismissed', limit: 1 }),
      ]);

      setTabCounts({
        pending: pendingRes.pagination?.total || 0,
        resolved: resolvedRes.pagination?.total || 0,
        dismissed: dismissedRes.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error loading tab counts:', error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }
    loadReportedShops(activeTab);
    loadTabCounts();
  }, [authLoading, staff, isEditor, lang, router, loadReportedShops, loadTabCounts, activeTab]);

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
  };

  const handleSuspendShop = async (shopId: number, reportId: number, reportReason: string) => {
    const reason = prompt(`Enter reason for suspending this shop:\n\nReport reason: ${reportReason}`);
    if (!reason) return;

    try {
      setActionLoading(true);
      const response = await suspendShopFromReport(shopId, reportId, reason);

      if (response.success) {
        alert('Shop suspended successfully!');
        loadReportedShops(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to suspend shop');
      }
    } catch (error) {
      console.error('Error suspending shop:', error);
      alert('Error suspending shop');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: number) => {
    const reason = prompt('Enter reason for dismissing this report (optional):');
    if (reason === null) return;

    try {
      setActionLoading(true);
      const response = await dismissShopReport(reportId, reason || 'Report verified as false/invalid');

      if (response.success) {
        alert('Report dismissed successfully!');
        loadReportedShops(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to dismiss report');
      }
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Error dismissing report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendShop = async (shopId: number, reportId: number, shopName: string) => {
    if (
      !confirm(
        `Are you sure you want to restore this shop?\n\nShop: "${shopName}"\n\nThe shop will become active and visible to users again.`
      )
    )
      return;

    try {
      setActionLoading(true);
      const response = await unsuspendShopFromReport(shopId, reportId);

      if (response.success) {
        alert('Shop restored successfully! The shop is now active.');
        loadReportedShops(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to restore shop');
      }
    } catch (error) {
      console.error('Error restoring shop:', error);
      alert('Error restoring shop');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReports = reports.filter((report) =>
    searchTerm
      ? report.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.shopEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return {
    staff,
    authLoading,
    reports: filteredReports,
    loading,
    actionLoading,
    activeTab,
    searchTerm,
    setSearchTerm,
    tabCounts,
    handleLogout,
    handleTabChange,
    handleSuspendShop,
    handleDismissReport,
    handleUnsuspendShop,
  };
}
