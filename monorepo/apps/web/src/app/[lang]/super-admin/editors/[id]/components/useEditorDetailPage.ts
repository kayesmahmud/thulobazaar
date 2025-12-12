'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import type { EditorDetail, EditorActivity, ActiveTab } from './types';

export function useEditorDetailPage(lang: string, editorId: number) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [editor, setEditor] = useState<EditorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('activity');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  const [pendingMonth, setPendingMonth] = useState<number | null>(null);
  const [pendingYear, setPendingYear] = useState<number | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadEditorData = useCallback(async () => {
    try {
      setLoading(true);

      const editorsResponse = await apiClient.getEditors();
      if (!editorsResponse.success || !editorsResponse.data) {
        throw new Error('Failed to fetch editors');
      }

      const editorInfo = editorsResponse.data.find((e) => e.id === editorId);
      if (!editorInfo) {
        setEditor(null);
        setLoading(false);
        return;
      }

      const monthQuery = selectedMonth ? `?month=${selectedMonth.month}&year=${selectedMonth.year}` : '';

      const activityResponse = await fetch(`/api/super-admin/editors/${editorId}/activity${monthQuery}`, {
        credentials: 'include',
      });

      let activities: EditorActivity[] = [];
      let adWork: EditorDetail['adWork'] = [];
      let businessVerifications: EditorDetail['businessVerifications'] = [];
      let individualVerifications: EditorDetail['individualVerifications'] = [];
      let stats = {
        adsApproved: 0,
        adsRejected: 0,
        adsEdited: 0,
        adsDeleted: 0,
        businessApproved: 0,
        businessRejected: 0,
        individualApproved: 0,
        individualRejected: 0,
        supportTickets: 0,
      };
      let timeBuckets: EditorDetail['timeBuckets'] | undefined = undefined;
      let monthLabel: string | undefined = undefined;

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success && activityData.data) {
          const formatDetails = (val: any) => {
            if (!val) return undefined;
            if (typeof val === 'string') return val;
            if (typeof val === 'object') {
              const entries = Object.entries(val).map(([k, v]) => `${k}: ${v}`);
              return entries.join(' | ');
            }
            return String(val);
          };

          activities = (activityData.data.activities || []).map((a: any) => ({
            id: a.id,
            type: a.type as EditorActivity['type'],
            timestamp: a.timestamp,
            details: formatDetails(a.details),
            relatedId: a.relatedId,
          }));
          adWork = activityData.data.adWork || [];
          businessVerifications = activityData.data.businessVerifications || [];
          individualVerifications = activityData.data.individualVerifications || [];
          stats = activityData.data.stats || stats;
          timeBuckets = activityData.data.timeBuckets || undefined;
          if (selectedMonth) {
            const date = new Date(Date.UTC(selectedMonth.year, selectedMonth.month - 1, 1));
            monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        }
      }

      const editorDetail: EditorDetail = {
        id: editorInfo.id,
        fullName: editorInfo.full_name,
        email: editorInfo.email,
        avatar: editorInfo.avatar,
        status: editorInfo.is_active ? 'active' : 'suspended',
        createdAt: editorInfo.created_at,
        lastLogin: (editorInfo as any).last_login || null,
        stats,
        activities,
        adWork,
        businessVerifications,
        individualVerifications,
        timeBuckets,
        monthLabel,
      };

      setEditor(editorDetail);
      setLoading(false);
    } catch (error) {
      console.error('Error loading editor data:', error);
      setEditor(null);
      setLoading(false);
    }
  }, [editorId, selectedMonth]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    loadEditorData();
  }, [authLoading, staff, isSuperAdmin, lang, router, loadEditorData]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(Date.UTC(2000, i, 1)).toLocaleDateString('en-US', { month: 'long' }),
    }));
  }, []);

  const yearOptions = useMemo(() => {
    const years: { year: number; label: string }[] = [];
    for (let y = 2025; y <= 2030; y++) {
      years.push({ year: y, label: y.toString() });
    }
    return years;
  }, []);

  const handleSuspend = () => {
    console.log('Suspending editor:', editor?.id);
    setShowSuspendModal(false);
  };

  const handleDelete = () => {
    console.log('Deleting editor:', editor?.id);
    setShowDeleteModal(false);
    router.push(`/${lang}/super-admin/editors`);
  };

  const handleApplyFilter = () => {
    if (pendingMonth && pendingYear) {
      setSelectedMonth({ month: pendingMonth, year: pendingYear });
    } else {
      setSelectedMonth(null);
    }
  };

  return {
    staff,
    authLoading,
    handleLogout,
    editor,
    loading,
    activeTab,
    setActiveTab,
    showSuspendModal,
    setShowSuspendModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedMonth,
    pendingMonth,
    setPendingMonth,
    pendingYear,
    setPendingYear,
    monthOptions,
    yearOptions,
    handleSuspend,
    handleDelete,
    handleApplyFilter,
  };
}
