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
import { useStaffAuth } from '@/contexts/StaffAuthContext';

interface DashboardStats {
  pendingAds: number;
  pendingVerifications: number;
  userReports: number;
  avgResponseTime: string;
  pendingChange: string;
  verificationsChange: string;
}

interface Activity {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'primary' | 'warning' | 'danger';
}

export default function EditorDashboard({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadDashboardData = useCallback(async () => {
    try {
      // In real implementation, fetch from API
      // For now, using mock data
      setStats({
        pendingAds: 23,
        pendingVerifications: 15,
        userReports: 17,
        avgResponseTime: '2.3h',
        pendingChange: '+12%',
        verificationsChange: '-8%',
      });

      setActivities([
        {
          icon: '✓',
          title: 'Ad Approved',
          description: 'iPhone 15 Pro listing published',
          time: '10 minutes ago',
          type: 'success',
        },
        {
          icon: '🚫',
          title: 'User Suspended',
          description: '7-day suspension for policy violation',
          time: '1 hour ago',
          type: 'warning',
        },
        {
          icon: '✓',
          title: 'Business Verified',
          description: 'GreenTech Solutions approved',
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

    // Check if user is authenticated and is an editor
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }

    loadDashboardData();
  }, [authLoading, staff, isEditor, params.lang, router, loadDashboardData]);

  const navSections = [
    {
      title: 'Overview',
      items: [
        {
          href: `/${params.lang}/editor/dashboard`,
          icon: '📊',
          label: 'Dashboard',
        },
      ],
    },
    {
      title: 'Content Management',
      items: [
        {
          href: `/${params.lang}/editor/ad-management`,
          icon: '📢',
          label: 'Ad Management',
          badge: 23,
        },
        {
          href: `/${params.lang}/editor/reported-ads`,
          icon: '🚩',
          label: 'Reported Ads',
          badge: 5,
        },
      ],
    },
    {
      title: 'User Management',
      items: [
        {
          href: `/${params.lang}/editor/user-management`,
          icon: '👥',
          label: 'User Management',
        },
        {
          href: `/${params.lang}/editor/user-reports`,
          icon: '⚠️',
          label: 'User Reports',
          badge: 12,
        },
      ],
    },
    {
      title: 'Verification',
      items: [
        {
          href: `/${params.lang}/editor/business-verification`,
          icon: '🏢',
          label: 'Business Verification',
          badge: 8,
        },
        {
          href: `/${params.lang}/editor/individual-verification`,
          icon: '🪪',
          label: 'Individual Verification',
          badge: 7,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          href: `/${params.lang}/editor/support-chat`,
          icon: '💬',
          label: 'Support Chat',
          badge: 3,
        },
        {
          href: `/${params.lang}/editor/templates`,
          icon: '📄',
          label: 'Response Templates',
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          href: `/${params.lang}/editor/bulk-actions`,
          icon: '📦',
          label: 'Bulk Actions',
        },
        {
          href: `/${params.lang}/editor/analytics`,
          icon: '📈',
          label: 'Moderation Analytics',
        },
        {
          href: `/${params.lang}/editor/audit-logs`,
          icon: '📋',
          label: 'Audit Logs',
        },
      ],
    },
  ];

  const quickActions = [
    {
      icon: '📢',
      label: 'Review Ads',
      color: 'primary' as const,
      badge: 23,
      onClick: () => router.push(`/${params.lang}/editor/ad-management`),
    },
    {
      icon: '🏢',
      label: 'Business Verification',
      color: 'success' as const,
      badge: 8,
      onClick: () => router.push(`/${params.lang}/editor/business-verification`),
    },
    {
      icon: '🪪',
      label: 'Individual Verification',
      color: 'success' as const,
      badge: 7,
      onClick: () => router.push(`/${params.lang}/editor/individual-verification`),
    },
    {
      icon: '🚩',
      label: 'Reported Content',
      color: 'warning' as const,
      badge: 5,
      onClick: () => router.push(`/${params.lang}/editor/reported-ads`),
    },
    {
      icon: '💬',
      label: 'Support Chat',
      color: 'primary' as const,
      badge: 3,
      onClick: () => router.push(`/${params.lang}/editor/support-chat`),
    },
    {
      icon: '📦',
      label: 'Bulk Actions',
      color: 'gray' as const,
      onClick: () => router.push(`/${params.lang}/editor/bulk-actions`),
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
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
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={navSections}
      systemAlert={{
        message: '5 urgent reports need attention',
        type: 'warning',
      }}
      notificationCount={8}
      theme="editor"
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editor Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's your moderation overview for today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <span className="mr-2">📥</span>
              Export Report
            </Button>
            <Button variant="primary">
              <span className="mr-2">🚀</span>
              Quick Actions
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Pending Ads"
          value={stats?.pendingAds || 0}
          icon="📢"
          color="primary"
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
          trend={{
            value: '5 new today',
            isPositive: true,
            label: '',
          }}
        />
        <StatsCard
          title="Avg. Response Time"
          value={stats?.avgResponseTime || '0h'}
          icon="⏱️"
          color="success"
          trend={{
            value: 'Improved 15%',
            isPositive: true,
            label: '',
          }}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <QuickActions actions={quickActions} />
      </div>

      {/* Tasks & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
            <a href="#" className="text-success text-sm font-medium hover:underline">
              View All
            </a>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                ⚠️
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">Urgent: Scam Report</div>
                <div className="text-sm text-gray-600">User reported potential scam ad</div>
                <div className="text-xs text-gray-500 mt-1">Reported 25 mins ago</div>
              </div>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded font-medium">
                High
              </span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                🏢
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">Business Verification</div>
                <div className="text-sm text-gray-600">TechNepal - Documents submitted</div>
                <div className="text-xs text-gray-500 mt-1">Waiting 2 days</div>
              </div>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded font-medium">
                Medium
              </span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                📢
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">Ad Review Batch</div>
                <div className="text-sm text-gray-600">15 electronics ads pending review</div>
                <div className="text-xs text-gray-500 mt-1">Category: Electronics</div>
              </div>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded font-medium">
                Medium
              </span>
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
