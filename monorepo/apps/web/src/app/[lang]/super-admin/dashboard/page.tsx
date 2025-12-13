'use client';

import { useRouter } from 'next/navigation';
import { DashboardLayout, QuickActions } from '@/components/admin';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { useDashboard } from './useDashboard';
import {
  DashboardHeader,
  StatsGrid,
  ChartsSection,
  UserListSection,
} from './components';
import type { QuickAction } from './types';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const {
    lang,
    staff,
    handleLogout,
    stats,
    loading,
    chartLabels,
    revenueSeries,
    userSeries,
    chartLoading,
    chartRange,
    setChartRange,
    users,
    userLoading,
    userSearch,
    setUserSearch,
    filteredUsers,
  } = useDashboard();

  const navSections = getSuperAdminNavSections(lang, {
    pendingAds: stats?.pendingAds || 0,
  });

  const quickActions: QuickAction[] = [
    {
      icon: '📢',
      label: 'Review Pending Ads',
      color: 'primary',
      badge: stats?.pendingAds || 0,
      onClick: () => router.push(`/${lang}/super-admin/ads?status=pending`),
    },
    {
      icon: '✓',
      label: 'Verify Sellers',
      color: 'success',
      onClick: () => router.push(`/${lang}/super-admin/verifications`),
    },
    {
      icon: '📊',
      label: 'Analytics',
      color: 'warning',
      onClick: () => router.push(`/${lang}/super-admin/analytics`),
    },
    {
      icon: '⚙️',
      label: 'System Settings',
      color: 'gray',
      onClick: () => router.push(`/${lang}/super-admin/settings`),
    },
  ];

  if (loading) {
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
      <DashboardHeader lang={lang} staffName={staff?.fullName} />

      <StatsGrid stats={stats} />

      <ChartsSection
        chartLabels={chartLabels}
        revenueSeries={revenueSeries}
        userSeries={userSeries}
        chartLoading={chartLoading}
        chartRange={chartRange}
        onRangeChange={setChartRange}
      />

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500 font-medium">Access frequently used features</span>
        </div>
        <QuickActions actions={quickActions} theme="superadmin" />
      </div>

      <UserListSection
        users={users}
        filteredUsers={filteredUsers}
        userLoading={userLoading}
        userSearch={userSearch}
        onSearchChange={setUserSearch}
      />
    </DashboardLayout>
  );
}
