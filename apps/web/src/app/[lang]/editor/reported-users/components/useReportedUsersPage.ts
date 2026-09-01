'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getReportedUsers, dismissUserReport, resolveUserReport } from '@/lib/editorApi';
import type { ReportedUser, TabStatus, TabCounts } from './types';

export function useReportedUsersPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [reports, setReports] = useState<ReportedUser[]>([]);
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

  const loadReportedUsers = useCallback(
    async (status: TabStatus) => {
      try {
        setLoading(true);
        const response = await getReportedUsers<ReportedUser>(undefined, {
          status,
          search: searchTerm || undefined,
          page,
          limit: 50,
        });
        setReports(response.success && Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error loading reported users:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm]
  );

  const loadTabCounts = useCallback(async () => {
    try {
      const [pendingRes, resolvedRes, dismissedRes] = await Promise.all([
        getReportedUsers<ReportedUser>(undefined, { status: 'pending', limit: 1 }),
        getReportedUsers<ReportedUser>(undefined, { status: 'resolved', limit: 1 }),
        getReportedUsers<ReportedUser>(undefined, { status: 'dismissed', limit: 1 }),
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
    loadReportedUsers(activeTab);
    loadTabCounts();
  }, [authLoading, staff, isEditor, lang, router, loadReportedUsers, loadTabCounts, activeTab]);

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
  };

  const handleSuspendUser = async (reportId: number, reportReason: string) => {
    const reason = prompt(`Enter reason for suspending this user:\n\nReport reason: ${reportReason}`);
    if (!reason) return;

    try {
      setActionLoading(true);
      const response = await resolveUserReport(reportId, reason, true);
      if (response.success) {
        alert('User suspended and report resolved!');
        loadReportedUsers(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: number) => {
    const reason = prompt('Enter reason for dismissing this report (optional):');
    if (reason === null) return;

    try {
      setActionLoading(true);
      const response = await dismissUserReport(reportId, reason || 'Report verified as false/invalid');
      if (response.success) {
        alert('Report dismissed successfully!');
        loadReportedUsers(activeTab);
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

  // Search is server-side across every page; it only runs on an explicit submit
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  return {
    staff,
    authLoading,
    reports,
    loading,
    actionLoading,
    activeTab,
    searchTerm,
    handleSearch,
    tabCounts,
    handleLogout,
    handleTabChange,
    handleSuspendUser,
    handleDismissReport,
  };
}
