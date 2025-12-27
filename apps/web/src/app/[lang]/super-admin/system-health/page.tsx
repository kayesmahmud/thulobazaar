'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useSystemHealth } from './useSystemHealth';
import {
  CriticalEvents,
  ServiceStatusGrid,
  DatabaseHealth,
  MetricsSection,
  SystemInfo,
} from './components';

export default function SystemHealthPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);

  const {
    staff,
    navSections,
    handleLogout,
    healthData,
    loading,
    lastRefresh,
    autoRefresh,
    setAutoRefresh,
    refresh,
  } = useSystemHealth(params.lang);

  const layoutProps = {
    lang: params.lang,
    userName: staff?.fullName,
    userEmail: staff?.email,
    navSections,
    theme: 'superadmin' as const,
    onLogout: handleLogout,
  };

  if (loading) {
    return (
      <DashboardLayout {...layoutProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading system health...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!healthData) {
    return (
      <DashboardLayout {...layoutProps}>
        <div className="text-center py-12">
          <p className="text-gray-600">Unable to load system health data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout {...layoutProps}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
            <p className="text-gray-600 mt-1">
              Monitor system performance and service status
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
            </label>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <CriticalEvents events={healthData.criticalEvents} />

        <ServiceStatusGrid serviceStatus={healthData.serviceStatus} />

        <DatabaseHealth databaseHealth={healthData.databaseHealth} />

        <MetricsSection
          performanceMetrics={healthData.performanceMetrics}
          businessMetrics={healthData.businessMetrics}
        />

        <SystemInfo systemInfo={healthData.systemInfo} />
      </div>
    </DashboardLayout>
  );
}
