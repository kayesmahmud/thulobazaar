'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  DashboardLayout,
  StatsCard,
  QuickActions,
  RecentActivity,
} from '@/components/admin';
import { LineChart, BarChart } from '@/components/admin/charts';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

interface DashboardStats {
  totalRevenue: number;
  activeAds: number;
  pendingActions: number;
  totalUsers: number;
  revenueChange: string;
  adsChange: string;
}

interface Activity {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'primary' | 'warning' | 'danger';
}

export default function SuperAdminDashboard({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const loadDashboardData = useCallback(async () => {
    try {
      // In real implementation, fetch from API
      // For now, using mock data
      setStats({
        totalRevenue: 1254600,
        activeAds: 8921,
        pendingActions: 38,
        totalUsers: 12450,
        revenueChange: '+18.2%',
        adsChange: '+5.3%',
      });

      setActivities([
        {
          icon: '✓',
          title: 'Ad approved',
          description: 'iPhone 15 Pro listing approved and published',
          time: '2 minutes ago',
          type: 'success',
        },
        {
          icon: '👤',
          title: 'Business verified',
          description: 'TechNepal business account verified',
          time: '15 minutes ago',
          type: 'primary',
        },
        {
          icon: '⚠',
          title: 'System Alert',
          description: 'Database storage reaching 86% capacity',
          time: '1 hour ago',
          type: 'warning',
        },
        {
          icon: '💰',
          title: 'Payment processed',
          description: 'Featured ad payment from user_tech123',
          time: '2 hours ago',
          type: 'success',
        },
      ]);

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
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadDashboardData();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadDashboardData]);

  const navSections = [
    {
      title: 'Main',
      items: [
        {
          href: `/${params.lang}/super-admin/dashboard`,
          icon: '📊',
          label: 'Dashboard',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          href: `/${params.lang}/super-admin/ads`,
          icon: '📢',
          label: 'Ad Management',
          badge: 23,
        },
        {
          href: `/${params.lang}/super-admin/users`,
          icon: '👥',
          label: 'User Management',
        },
        {
          href: `/${params.lang}/super-admin/financial`,
          icon: '💸',
          label: 'Financial Tracking',
        },
      ],
    },
    {
      title: 'Verification',
      items: [
        {
          href: `/${params.lang}/super-admin/verifications`,
          icon: '✓',
          label: 'Verifications',
          badge: 15,
        },
      ],
    },
    {
      title: 'Business',
      items: [
        {
          href: `/${params.lang}/super-admin/promotion-pricing`,
          icon: '⭐',
          label: 'Promotion Pricing',
        },
        {
          href: `/${params.lang}/super-admin/analytics`,
          icon: '📈',
          label: 'Analytics & Reports',
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          href: `/${params.lang}/super-admin/system-health`,
          icon: '🖥️',
          label: 'System Health',
        },
        {
          href: `/${params.lang}/super-admin/security`,
          icon: '🛡️',
          label: 'Security & Audit',
        },
        {
          href: `/${params.lang}/super-admin/categories`,
          icon: '🏷️',
          label: 'Categories',
        },
        {
          href: `/${params.lang}/super-admin/locations`,
          icon: '📍',
          label: 'Locations',
        },
        {
          href: `/${params.lang}/super-admin/settings`,
          icon: '⚙️',
          label: 'Settings',
        },
      ],
    },
  ];

  const quickActions = [
    {
      icon: '📢',
      label: 'Review Pending Ads',
      color: 'primary' as const,
      badge: 23,
      onClick: () => router.push(`/${params.lang}/super-admin/ads?status=pending`),
    },
    {
      icon: '✓',
      label: 'Verify Sellers',
      color: 'success' as const,
      badge: 15,
      onClick: () => router.push(`/${params.lang}/super-admin/verifications`),
    },
    {
      icon: '📊',
      label: 'Generate Reports',
      color: 'warning' as const,
      onClick: () => router.push(`/${params.lang}/super-admin/analytics`),
    },
    {
      icon: '⚙️',
      label: 'System Settings',
      color: 'gray' as const,
      onClick: () => router.push(`/${params.lang}/super-admin/settings`),
    },
    {
      icon: '📥',
      label: 'Export Data',
      color: 'success' as const,
      onClick: () => {
        // Export functionality
        alert('Exporting dashboard data...');
      },
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Admin User'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      systemAlert={{
        message: 'Storage: 86% used',
        type: 'warning',
      }}
      notificationCount={5}
      theme="superadmin"
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, Admin User. Here's what's happening today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <span className="mr-2">📥</span>
              Export Report
            </Button>
            <Button variant="primary">
              <span className="mr-2">📊</span>
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Revenue"
          value={`NPR ${stats?.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="success"
          trend={{
            value: stats?.revenueChange || '',
            isPositive: true,
            label: 'increase',
          }}
        />
        <StatsCard
          title="Active Ads"
          value={stats?.activeAds.toLocaleString() || '0'}
          icon="📢"
          color="primary"
          trend={{
            value: stats?.adsChange || '',
            isPositive: true,
            label: 'increase',
          }}
        />
        <StatsCard
          title="Pending Actions"
          value={stats?.pendingActions || 0}
          icon="⏳"
          color="warning"
          trend={{
            value: 'Requires attention',
            isPositive: false,
            label: '',
          }}
        />
        <StatsCard
          title="System Uptime"
          value="99.8%"
          icon="🖥️"
          color="success"
          trend={{
            value: 'All systems normal',
            isPositive: true,
            label: '',
          }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
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

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <BarChart
            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            data={[420, 510, 485, 620, 590, 680, 725]}
            label="New Users"
            color="#10b981"
            hoverColor="#059669"
            height={250}
          />
        </div>
      </div>

      {/* Actions & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions actions={quickActions} />
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} showViewAll viewAllHref="#" />
        </div>
      </div>
    </DashboardLayout>
  );
}
