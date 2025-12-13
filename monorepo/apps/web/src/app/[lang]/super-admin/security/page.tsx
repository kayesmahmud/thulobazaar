'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useSecurityAudit } from './useSecurityAudit';
import {
  SecurityHeader,
  TabNavigation,
  OverviewTab,
  ActivityLogsTab,
  SessionsTab,
  SecurityEventsTab,
} from './components';

export default function SecurityAuditPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);

  const {
    staff,
    navSections,
    handleLogout,
    auditData,
    loading,
    timeRange,
    setTimeRange,
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    refresh,
  } = useSecurityAudit(params.lang);

  if (loading && !auditData) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName}
        userEmail={staff?.email}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading security audit...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName}
      userEmail={staff?.email}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <SecurityHeader
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={refresh}
        />

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' && auditData && (
          <OverviewTab auditData={auditData} />
        )}

        {activeTab === 'logs' && auditData && (
          <ActivityLogsTab
            auditData={auditData}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}

        {activeTab === 'sessions' && auditData && (
          <SessionsTab sessions={auditData.activeSessions} />
        )}

        {activeTab === 'events' && auditData && (
          <SecurityEventsTab events={auditData.securityEvents} />
        )}
      </div>
    </DashboardLayout>
  );
}
