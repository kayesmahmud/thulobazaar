'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import {
  getEditorStats,
  getPendingVerifications,
  getMyWorkToday,
  getEditorProfile,
  getReportedAdsCount,
  getNotificationsCount,
  getSystemAlerts,
  getAvgResponseTime,
  getTrends,
  getSupportChatCount,
  getAvgResponseTimeTrend,
} from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/navigation';
import type { DashboardStats, MyWorkToday, BadgeCounts, SystemAlert, QuickActionConfig } from './types';
import { DEFAULT_STATS, DEFAULT_MY_WORK, DEFAULT_BADGE_COUNTS } from './types';

export interface UseEditorDashboardReturn {
  // Auth
  staff: ReturnType<typeof useStaffAuth>['staff'];
  navSections: ReturnType<typeof getEditorNavSections>;
  handleLogout: () => Promise<void>;

  // Data
  stats: DashboardStats | null;
  myWorkToday: MyWorkToday;
  badgeCounts: BadgeCounts;
  loading: boolean;
  avatarUrl: string | null;
  lastLogin: string | null;
  systemAlert: SystemAlert | null;
  notificationCount: number;
  avgResponseTimeTrendText: string;
  quickActions: QuickActionConfig[];
}

export function useEditorDashboard(lang: string): UseEditorDashboardReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>(DEFAULT_BADGE_COUNTS);
  const [myWorkToday, setMyWorkToday] = useState<MyWorkToday>(DEFAULT_MY_WORK);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<SystemAlert | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [avgResponseTimeTrendText, setAvgResponseTimeTrendText] = useState('No change');

  const navSections = useMemo(() => getEditorNavSections(lang, badgeCounts), [lang, badgeCounts]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  const loadDashboardData = useCallback(async () => {
    // Helper to safely call an API and return null on failure
    const safeCall = async <T,>(fn: () => Promise<T>, name: string): Promise<T | null> => {
      try {
        return await fn();
      } catch (error) {
        console.warn(`[Dashboard] ${name} failed:`, error);
        return null;
      }
    };

    // CRITICAL: Fetch profile first for avatar
    const profileResponse = await safeCall(() => getEditorProfile(), 'getEditorProfile');
    if (profileResponse?.success) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      if (profileResponse.data.avatar) {
        setAvatarUrl(`${apiBase}/uploads/avatars/${profileResponse.data.avatar}`);
      }
      const sessionLastLogin = (staff as any)?.lastLogin;
      const profileLastLogin = profileResponse.data.lastLogin;
      setLastLogin(sessionLastLogin || profileLastLogin || null);
    } else if ((staff as any)?.lastLogin) {
      setLastLogin((staff as any).lastLogin);
    }

    // Fetch dashboard stats
    const statsResponse = await safeCall(() => getEditorStats(), 'getEditorStats');
    const avgResponseTimeResponse = await safeCall(() => getAvgResponseTime(), 'getAvgResponseTime');
    const trendsResponse = await safeCall(() => getTrends(), 'getTrends');

    if (statsResponse?.success) {
      setStats({
        ...statsResponse.data,
        avgResponseTime: avgResponseTimeResponse?.success ? avgResponseTimeResponse.data.avgResponseTime : 'N/A',
        pendingChange: trendsResponse?.success ? trendsResponse.data.pendingChange : '0%',
        verificationsChange: trendsResponse?.success ? trendsResponse.data.verificationsChange : '0%',
      });
    } else {
      setStats(DEFAULT_STATS);
    }

    // Fetch verification counts for badges
    const verificationsResponse = await safeCall(() => getPendingVerifications(), 'getPendingVerifications');
    const supportChatResponse = await safeCall(() => getSupportChatCount(), 'getSupportChatCount');

    if (verificationsResponse?.success) {
      const businessCount = verificationsResponse.data.filter((v: any) => v.type === 'business').length;
      const individualCount = verificationsResponse.data.filter((v: any) => v.type === 'individual').length;

      setBadgeCounts((prev) => ({
        ...prev,
        pendingAds: statsResponse?.data?.pendingAds || 0,
        businessVerifications: businessCount,
        individualVerifications: individualCount,
        supportChat: supportChatResponse?.success ? supportChatResponse.data.count : 0,
      }));
    }

    // Fetch reported ads count
    const reportedAdsResponse = await safeCall(() => getReportedAdsCount(), 'getReportedAdsCount');
    if (reportedAdsResponse?.success) {
      setBadgeCounts((prev) => ({
        ...prev,
        reportedAds: reportedAdsResponse.data.count,
      }));
    }

    // Fetch notifications count
    const notificationsResponse = await safeCall(() => getNotificationsCount(), 'getNotificationsCount');
    if (notificationsResponse?.success) {
      setNotificationCount(notificationsResponse.data.count);
    }

    // Fetch system alerts
    const systemAlertsResponse = await safeCall(() => getSystemAlerts(), 'getSystemAlerts');
    if (systemAlertsResponse?.success && systemAlertsResponse.data) {
      const alertData = systemAlertsResponse.data as any;
      setSystemAlert({
        message: alertData.message,
        type: alertData.type === 'danger' ? 'error' : alertData.type,
      });
    }

    // Fetch avg response time trend
    const avgResponseTimeTrendResponse = await safeCall(() => getAvgResponseTimeTrend(), 'getAvgResponseTimeTrend');
    if (avgResponseTimeTrendResponse?.success) {
      setAvgResponseTimeTrendText(avgResponseTimeTrendResponse.data.formattedText);
    }

    // Fetch "My Work Today" stats
    const myWorkResponse = await safeCall(() => getMyWorkToday(), 'getMyWorkToday');
    if (myWorkResponse?.success) {
      setMyWorkToday(myWorkResponse.data);
    }

    setLoading(false);
  }, [staff]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }

    loadDashboardData();
  }, [authLoading, staff, isEditor, lang, router, loadDashboardData]);

  const quickActions: QuickActionConfig[] = useMemo(
    () => [
      {
        icon: '📢',
        label: 'Review Ads',
        color: 'primary',
        badge: badgeCounts.pendingAds,
        onClick: () => router.push(`/${lang}/editor/ad-management`),
      },
      {
        icon: '🏢',
        label: 'Business Verification',
        color: 'success',
        badge: badgeCounts.businessVerifications,
        onClick: () => router.push(`/${lang}/editor/business-verification`),
      },
      {
        icon: '🪪',
        label: 'Individual Verification',
        color: 'success',
        badge: badgeCounts.individualVerifications,
        onClick: () => router.push(`/${lang}/editor/individual-verification`),
      },
      {
        icon: '🚩',
        label: 'Reported Content',
        color: 'warning',
        badge: badgeCounts.reportedAds,
        onClick: () => router.push(`/${lang}/editor/reported-ads`),
      },
      {
        icon: '💬',
        label: 'Support Chat',
        color: 'primary',
        badge: badgeCounts.supportChat,
        onClick: () => router.push(`/${lang}/editor/support-chat`),
      },
    ],
    [lang, badgeCounts, router]
  );

  return {
    staff,
    navSections,
    handleLogout,
    stats,
    myWorkToday,
    badgeCounts,
    loading: authLoading || loading,
    avatarUrl,
    lastLogin,
    systemAlert,
    notificationCount,
    avgResponseTimeTrendText,
    quickActions,
  };
}
