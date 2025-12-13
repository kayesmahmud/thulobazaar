'use client';

import { use } from 'react';
import { DashboardLayout, QuickActions } from '@/components/admin';
import { useEditorDashboard } from './useEditorDashboard';
import { WelcomeSection, StatsGrid, PendingTasks } from './components';

export default function EditorDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);

  const {
    staff,
    navSections,
    handleLogout,
    stats,
    myWorkToday,
    loading,
    avatarUrl,
    lastLogin,
    systemAlert,
    notificationCount,
    avgResponseTimeTrendText,
    quickActions,
  } = useEditorDashboard(lang);

  if (loading) {
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
      navSections={navSections}
      systemAlert={systemAlert ?? undefined}
      notificationCount={notificationCount}
      theme="editor"
      onLogout={handleLogout}
      lastLogin={lastLogin}
    >
      {/* Welcome Section with Profile */}
      <WelcomeSection
        staffName={staff?.fullName || ''}
        avatarUrl={avatarUrl}
        myWorkToday={myWorkToday}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} avgResponseTimeTrendText={avgResponseTimeTrendText} />

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
        <PendingTasks />
      </div>
    </DashboardLayout>
  );
}
