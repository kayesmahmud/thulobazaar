'use client';

import { useState, useCallback } from 'react';
import { getReportedAds, deleteAd, dismissReport, restoreAd } from '@/lib/editorApi';
import type { ReportedAd, TabStatus, TabCounts } from './types';

export function useReportedAds() {
  const [reports, setReports] = useState<ReportedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabCounts, setTabCounts] = useState<TabCounts>({ pending: 0, resolved: 0, dismissed: 0 });

  const loadReportedAds = useCallback(async (status: TabStatus, page: number = 1) => {
    try {
      setLoading(true);
      const response = await getReportedAds<ReportedAd>(undefined, {
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
      console.error('Error loading reported ads:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTabCounts = useCallback(async () => {
    try {
      const [pendingRes, resolvedRes, dismissedRes] = await Promise.all([
        getReportedAds<ReportedAd>(undefined, { status: 'pending', limit: 1 }),
        getReportedAds<ReportedAd>(undefined, { status: 'resolved', limit: 1 }),
        getReportedAds<ReportedAd>(undefined, { status: 'dismissed', limit: 1 }),
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

  const handleDeleteAd = useCallback(async (
    adId: number,
    reportReason: string,
    activeTab: TabStatus
  ): Promise<boolean> => {
    if (
      !confirm(
        `Are you sure you want to delete this ad?\n\nReason: ${reportReason}\n\nThis action cannot be undone.`
      )
    ) return false;

    try {
      setActionLoading(true);
      const response = await deleteAd(adId, `Deleted due to report: ${reportReason}`);

      if (response.success) {
        alert('Ad deleted successfully!');
        await loadReportedAds(activeTab);
        await loadTabCounts();
        return true;
      } else {
        alert('Failed to delete ad');
        return false;
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [loadReportedAds, loadTabCounts]);

  const handleDismissReport = useCallback(async (
    reportId: number,
    activeTab: TabStatus
  ): Promise<boolean> => {
    const reason = prompt('Enter reason for dismissing this report (optional):');
    if (reason === null) return false;

    try {
      setActionLoading(true);
      const response = await dismissReport(reportId, reason || 'Report verified as false/invalid');

      if (response.success) {
        alert('Report dismissed successfully!');
        await loadReportedAds(activeTab);
        await loadTabCounts();
        return true;
      } else {
        alert('Failed to dismiss report');
        return false;
      }
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Error dismissing report');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [loadReportedAds, loadTabCounts]);

  const handleRestoreAd = useCallback(async (
    adId: number,
    adTitle: string,
    activeTab: TabStatus
  ): Promise<boolean> => {
    if (
      !confirm(
        `Are you sure you want to restore this ad?\n\nAd: "${adTitle}"\n\nThe ad will become visible to users again.`
      )
    ) return false;

    try {
      setActionLoading(true);
      const response = await restoreAd(adId);

      if (response.success) {
        alert('Ad restored successfully! The ad is now visible to users.');
        await loadReportedAds(activeTab);
        await loadTabCounts();
        return true;
      } else {
        alert('Failed to restore ad');
        return false;
      }
    } catch (error) {
      console.error('Error restoring ad:', error);
      alert('Error restoring ad');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [loadReportedAds, loadTabCounts]);

  return {
    reports,
    loading,
    actionLoading,
    tabCounts,
    loadReportedAds,
    loadTabCounts,
    handleDeleteAd,
    handleDismissReport,
    handleRestoreAd,
  };
}
