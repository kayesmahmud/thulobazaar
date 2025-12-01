'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  DashboardLayout,
  StatsCard,
  QuickActions,
  RecentActivity,
} from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorStats, getActivityLogs, getPendingVerifications, getAds, getMyWorkToday, getEditorProfile, getReportedAdsCount, getUserReportsCount, getNotificationsCount, getSystemAlerts, getAvgResponseTime, getTrends, getSupportChatCount, getUserReportsTrend, getAvgResponseTimeTrend } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface DashboardStats {
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  rejectedAds: number;
  pendingVerifications: number;
  // Calculated fields for UI
  userReports?: number;
  avgResponseTime?: string;
  pendingChange?: string;
  verificationsChange?: string;
}

interface Activity {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'primary' | 'warning' | 'danger';
}

export default function EditorDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgeCounts, setBadgeCounts] = useState({
    pendingAds: 0,
    reportedAds: 0,
    userReports: 0,
    businessVerifications: 0,
    individualVerifications: 0,
    supportChat: 0,
  });
  const [myWorkToday, setMyWorkToday] = useState({
    adsApprovedToday: 0,
    adsRejectedToday: 0,
    adsEditedToday: 0,
    businessVerificationsToday: 0,
    individualVerificationsToday: 0,
    supportTicketsAssigned: 0,
  });
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<{ message: string; type: 'error' | 'warning' | 'info' } | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [userReportsTrendText, setUserReportsTrendText] = useState('No new reports');
  const [avgResponseTimeTrendText, setAvgResponseTimeTrendText] = useState('No change');

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

    // CRITICAL: Fetch profile first for avatar - this should not be blocked by other API failures
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

    // Fetch dashboard stats from backend
    const statsResponse = await safeCall(() => getEditorStats(), 'getEditorStats');
    const userReportsResponse = await safeCall(() => getUserReportsCount(), 'getUserReportsCount');
    const avgResponseTimeResponse = await safeCall(() => getAvgResponseTime(), 'getAvgResponseTime');
    const trendsResponse = await safeCall(() => getTrends(), 'getTrends');

    if (statsResponse?.success) {
      setStats({
        ...statsResponse.data,
        userReports: userReportsResponse?.success ? userReportsResponse.data.count : 0,
        avgResponseTime: avgResponseTimeResponse?.success ? avgResponseTimeResponse.data.avgResponseTime : 'N/A',
        pendingChange: trendsResponse?.success ? trendsResponse.data.pendingChange : '0%',
        verificationsChange: trendsResponse?.success ? trendsResponse.data.verificationsChange : '0%',
      });
    } else {
      // Set default stats if API fails
      setStats({
        totalAds: 0,
        pendingAds: 0,
        activeAds: 0,
        rejectedAds: 0,
        pendingVerifications: 0,
        userReports: 0,
        avgResponseTime: 'N/A',
        pendingChange: '0%',
        verificationsChange: '0%',
      });
    }

    // Fetch activity logs - wrapped to not break the page if it fails
    const activityResponse = await safeCall(
      () => getActivityLogs(undefined, { page: 1, limit: 10 }),
      'getActivityLogs'
    );

    if (activityResponse?.success && activityResponse.data.length > 0) {
      const transformedActivities = activityResponse.data.map((log) => {
        let icon = '📝';
        let type: 'success' | 'primary' | 'warning' | 'danger' = 'primary';
        let title = log.action_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        if (log.action_type.includes('approve')) {
          icon = '✓';
          type = 'success';
        } else if (log.action_type.includes('reject')) {
          icon = '🚫';
          type = 'danger';
        } else if (log.action_type.includes('suspend')) {
          icon = '⚠️';
          type = 'warning';
        } else if (log.action_type.includes('verify')) {
          icon = '✓';
          type = 'success';
        }

        const timeAgo = formatRelativeTime(new Date(log.created_at));

        return {
          icon,
          title,
          description: `${log.target_type} #${log.target_id} - ${log.admin_name}`,
          time: timeAgo,
          type,
        };
      });

      setActivities(transformedActivities);
    }

    // Fetch verification counts for badges
    const verificationsResponse = await safeCall(() => getPendingVerifications(), 'getPendingVerifications');
    const supportChatResponse = await safeCall(() => getSupportChatCount(), 'getSupportChatCount');

    if (verificationsResponse?.success) {
      const businessCount = verificationsResponse.data.filter(v => v.type === 'business').length;
      const individualCount = verificationsResponse.data.filter(v => v.type === 'individual').length;

      setBadgeCounts(prev => ({
        ...prev,
        pendingAds: statsResponse?.data?.pendingAds || 0,
        businessVerifications: businessCount,
        individualVerifications: individualCount,
        userReports: userReportsResponse?.success ? userReportsResponse.data.count : 0,
        supportChat: supportChatResponse?.success ? supportChatResponse.data.count : 0,
      }));
    }

    // Fetch reported ads count
    const reportedAdsResponse = await safeCall(() => getReportedAdsCount(), 'getReportedAdsCount');
    if (reportedAdsResponse?.success) {
      setBadgeCounts(prev => ({
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

    // Fetch user reports trend
    const userReportsTrendResponse = await safeCall(() => getUserReportsTrend(), 'getUserReportsTrend');
    if (userReportsTrendResponse?.success) {
      setUserReportsTrendText(userReportsTrendResponse.data.formattedText);
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

  // Helper function to format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check if user is authenticated and is an editor
    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }

    loadDashboardData();
  }, [authLoading, staff, isEditor, lang, router, loadDashboardData]);

  const quickActions = [
    {
      icon: '📢',
      label: 'Review Ads',
      color: 'primary' as const,
      badge: badgeCounts.pendingAds,
      onClick: () => router.push(`/${lang}/editor/ad-management`),
    },
    {
      icon: '🏢',
      label: 'Business Verification',
      color: 'success' as const,
      badge: badgeCounts.businessVerifications,
      onClick: () => router.push(`/${lang}/editor/business-verification`),
    },
    {
      icon: '🪪',
      label: 'Individual Verification',
      color: 'success' as const,
      badge: badgeCounts.individualVerifications,
      onClick: () => router.push(`/${lang}/editor/individual-verification`),
    },
    {
      icon: '🚩',
      label: 'Reported Content',
      color: 'warning' as const,
      badge: badgeCounts.reportedAds,
      onClick: () => router.push(`/${lang}/editor/reported-ads`),
    },
    {
      icon: '💬',
      label: 'Support Chat',
      color: 'primary' as const,
      badge: badgeCounts.supportChat,
      onClick: () => router.push(`/${lang}/editor/support-chat`),
    },
    {
      icon: '📦',
      label: 'Bulk Actions',
      color: 'gray' as const,
      onClick: () => router.push(`/${lang}/editor/bulk-actions`),
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading dashboard...</div>
            <div className="text-sm text-gray-500 mt-1">Please wait a moment</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(lang, badgeCounts)}
      systemAlert={systemAlert ?? undefined}
      notificationCount={notificationCount}
      theme="editor"
      onLogout={handleLogout}
      lastLogin={lastLogin}
    >
      {/* Welcome Section with Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Left: Profile and Welcome */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={staff?.fullName || 'Profile'}
                  className="w-20 h-20 rounded-full object-cover shadow-lg ring-4 ring-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
                  {staff?.fullName ? staff.fullName.charAt(0).toUpperCase() : 'T'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">Welcome</p>
              <h1 className="text-xl font-bold text-gray-900">{staff?.fullName || 'Bikash Thapa'}</h1>
            </div>
          </div>

          {/* Right: My Work Reports Today */}
          <div className="flex-1 overflow-x-auto">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-fit">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-bold text-gray-700">My Work reports today:</p>
              </div>
              <table className="w-full">
                <tbody className="divide-y divide-gray-200">
                  {/* Row 1: Ad Approved | Ad rejected | Business verification */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Ad Approved:</td>
                    <td className="px-3 py-2 text-right text-lg font-bold text-gray-900 border-r border-gray-200">{myWorkToday.adsApprovedToday}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Ad rejected:</td>
                    <td className="px-3 py-2 text-right text-lg font-bold text-gray-900 border-r border-gray-200">{myWorkToday.adsRejectedToday}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Business verification:</td>
                    <td className="px-3 py-2 text-right text-lg font-bold text-gray-900">{myWorkToday.businessVerificationsToday}</td>
                  </tr>
                  {/* Row 2: Ad Edited | Support tickets | Individual verification */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Ad Edited:</td>
                    <td className="px-3 py-2 text-right text-lg font-bold text-gray-900 border-r border-gray-200">{myWorkToday.adsEditedToday}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Support tickets:</td>
                    <td className="px-3 py-2 text-right text-lg font-bold text-gray-900 border-r border-gray-200">{myWorkToday.supportTicketsAssigned}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Individual verification:</td>
                    <td className="px-3 py-2 text-right text-lg font-bold text-gray-900">{myWorkToday.individualVerificationsToday}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Pending Ads"
          value={stats?.pendingAds || 0}
          icon="📢"
          color="primary"
          theme="editor"
          trend={{
            value: stats?.pendingChange || '',
            isPositive: true,
            label: 'from yesterday',
          }}
        />
        <StatsCard
          title="Pending Verifications"
          value={stats?.pendingVerifications || 0}
          icon="✅"
          color="success"
          theme="editor"
          trend={{
            value: stats?.verificationsChange || '',
            isPositive: false,
            label: 'decrease',
          }}
        />
        <StatsCard
          title="User Reports"
          value={stats?.userReports || 0}
          icon="🚩"
          color="warning"
          theme="editor"
          trend={{
            value: userReportsTrendText,
            isPositive: true,
            label: '',
          }}
        />
        <StatsCard
          title="Avg. Response Time"
          value={stats?.avgResponseTime || '0h'}
          icon="⏱️"
          color="success"
          theme="editor"
          trend={{
            value: avgResponseTimeTrendText,
            isPositive: avgResponseTimeTrendText.includes('Improved'),
            label: '',
          }}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500 font-medium">Click any action to get started</span>
        </div>
        <QuickActions actions={quickActions} theme="editor" />
      </div>

      {/* Tasks & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Pending Tasks</h3>
            </div>
            <a href="#" className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 hover:underline transition-colors">
              View All →
            </a>
          </div>

          <div className="space-y-3">
            <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-100 hover:border-rose-200 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm mb-1">Urgent: Scam Report</div>
                <div className="text-sm text-gray-600 mb-2">User reported potential scam ad</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    25 mins ago
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold shadow-sm">
                    High Priority
                  </span>
                </div>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">🏢</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm mb-1">Business Verification</div>
                <div className="text-sm text-gray-600 mb-2">TechNepal - Documents submitted</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Waiting 2 days
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-amber-500 text-white rounded-lg font-bold shadow-sm">
                    Medium
                  </span>
                </div>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">📢</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm mb-1">Ad Review Batch</div>
                <div className="text-sm text-gray-600 mb-2">15 electronics ads pending review</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Electronics
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-amber-500 text-white rounded-lg font-bold shadow-sm">
                    Medium
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity activities={activities} showViewAll viewAllHref="#" />
        </div>
      </div>
    </DashboardLayout>
  );
}
