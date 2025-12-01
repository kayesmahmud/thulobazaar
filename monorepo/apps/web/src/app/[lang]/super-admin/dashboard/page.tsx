'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  DashboardLayout,
  StatsCard,
  QuickActions,
  RecentActivity,
} from '@/components/admin';
import { LineChart, BarChart } from '@/components/admin/charts';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';
import { transformActivityLogs, type Activity } from '@/lib/activityHelpers';
import { RECENT_ACTIVITY_LIMIT } from '@/constants/dashboard';

interface DashboardStats {
  totalUsers: number;
  totalAds: number;
  activeAds: number;
  pendingAds: number;
  adsThisWeek: number;
  usersThisWeek: number;
}

export default function SuperAdminDashboard() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadDashboardData = useCallback(async () => {
    try {
      // Fetch stats from admin API
      const statsResponse = await apiClient.getAdminStats();

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Fetch recent activity logs
      const activityResponse = await apiClient.getEditorActivityLogs({
        page: 1,
        limit: RECENT_ACTIVITY_LIMIT,
      });

      if (activityResponse.success && activityResponse.data) {
        // Transform activity logs using helper function
        const transformedActivities = transformActivityLogs(activityResponse.data.data);
        setActivities(transformedActivities);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check if user is authenticated and is a super admin
    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    // Only load data if user is authenticated with a backend token
    if (staff && isSuperAdmin) {
      loadDashboardData();
    }
  }, [authLoading, staff, isSuperAdmin, lang, router, loadDashboardData]);

  const navSections = getSuperAdminNavSections(lang, {
    pendingAds: stats?.pendingAds || 0,
  });

  const quickActions = [
    {
      icon: '📢',
      label: 'Review Pending Ads',
      color: 'primary' as const,
      badge: stats?.pendingAds || 0,
      onClick: () => router.push(`/${lang}/super-admin/ads?status=pending`),
    },
    {
      icon: '✓',
      label: 'Verify Sellers',
      color: 'success' as const,
      onClick: () => router.push(`/${lang}/super-admin/verifications`),
    },
    {
      icon: '📊',
      label: 'Analytics',
      color: 'warning' as const,
      onClick: () => router.push(`/${lang}/super-admin/analytics`),
    },
    {
      icon: '⚙️',
      label: 'System Settings',
      color: 'gray' as const,
      onClick: () => router.push(`/${lang}/super-admin/settings`),
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
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
      userName={staff?.fullName || 'Admin User'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, <span className="font-semibold text-indigo-600">{staff?.fullName}</span>! Here&apos;s your complete system overview.
            </p>
          </div>
          <button
            onClick={() => router.push(`/${lang}/super-admin/analytics`)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          icon="👥"
          color="primary"
          theme="superadmin"
          trend={{
            value: stats?.usersThisWeek ? `+${stats.usersThisWeek}` : '0',
            isPositive: true,
            label: 'this week',
          }}
        />
        <StatsCard
          title="Active Ads"
          value={(stats?.activeAds ?? 0).toLocaleString()}
          icon="📢"
          color="success"
          theme="superadmin"
          trend={{
            value: stats?.adsThisWeek ? `+${stats.adsThisWeek}` : '0',
            isPositive: true,
            label: 'this week',
          }}
        />
        <StatsCard
          title="Pending Ads"
          value={(stats?.pendingAds ?? 0).toLocaleString()}
          icon="⏳"
          color="warning"
          theme="superadmin"
          trend={{
            value: 'Requires attention',
            isPositive: false,
            label: '',
          }}
        />
        <StatsCard
          title="Total Ads"
          value={(stats?.totalAds ?? 0).toLocaleString()}
          icon="📊"
          color="primary"
          theme="superadmin"
          trend={{
            value: 'All time',
            isPositive: true,
            label: '',
          }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Analytics</h3>
            </div>
            <select className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <LineChart
            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            data={[125000, 142000, 135000, 165000, 158000, 172000, 180000]}
            label="Revenue (NPR)"
            color="#6366f1"
            fillColor="rgba(99, 102, 241, 0.1)"
            height={250}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">📈</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">User Growth</h3>
            </div>
            <select className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <BarChart
            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            data={[420, 510, 485, 620, 590, 680, 725]}
            label="New Users"
            color="#6366f1"
            hoverColor="#4f46e5"
            height={250}
          />
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500 font-medium">Access frequently used features</span>
        </div>
        <QuickActions actions={quickActions} theme="superadmin" />
      </div>

      {/* Recent Activity */}
      <div>
        <RecentActivity
          activities={activities}
          showViewAll
          viewAllHref={`/${lang}/super-admin/security`}
        />
      </div>
    </DashboardLayout>
  );
}
