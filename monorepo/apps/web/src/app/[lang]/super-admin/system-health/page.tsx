'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
  responseTime: number | null;
  message: string;
}

interface SystemHealthData {
  timestamp: string;
  serviceStatus: {
    postgresql: ServiceStatus;
    typesense: ServiceStatus;
    backend: ServiceStatus;
  };
  databaseHealth: {
    connections: {
      total_connections: string;
      active_connections: string;
      idle_connections: string;
    };
    databaseSize: string;
    topTables: Array<{
      tablename: string;
      size: string;
    }>;
    slowQueries: number | string;
  };
  performanceMetrics: {
    errorsLast24h: number;
    activeUsers: number;
  };
  businessMetrics: {
    ads: {
      active_ads: string;
      pending_ads: string;
      rejected_ads: string;
      deleted_ads: string;
      total_ads: string;
    };
    users: {
      active_users: string;
      suspended_users: string;
      verified_businesses: string;
      verified_individuals: string;
      total_users: string;
    };
    pendingVerifications: {
      pending_business: string;
      pending_individual: string;
    };
    paymentsLast24h: {
      successful_payments: string;
      failed_payments: string;
      total_revenue_24h: string;
    };
  };
  criticalEvents: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
  }>;
  systemInfo: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memoryUsage: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
    };
  };
}

export default function SystemHealthPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadHealthData = useCallback(async () => {
    try {
      const response = await apiClient.getSystemHealth();
      if (response.success && response.data) {
        setHealthData(response.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error loading system health:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadHealthData();
    }
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadHealthData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadHealthData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadHealthData]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  };

  const navSections = getSuperAdminNavSections(params.lang);

  const getStatusColor = (status: 'healthy' | 'unhealthy') => {
    return status === 'healthy' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
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
            <p className="text-gray-600">Loading system health...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!healthData) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName}
        userEmail={staff?.email}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="text-center py-12">
          <p className="text-gray-600">Unable to load system health data</p>
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
              onClick={loadHealthData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Critical Events */}
        {healthData.criticalEvents.length > 0 && (
          <div className="space-y-2">
            {healthData.criticalEvents.map((event, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {event.severity === 'high' ? '⚠️' : event.severity === 'medium' ? '⚡' : 'ℹ️'}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold">{event.message}</div>
                    <div className="text-sm opacity-75">
                      {event.type} • {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service Status */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Service Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(healthData.serviceStatus).map(([service, status]) => (
              <div key={service} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold capitalize">{service}</div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                    {status.status === 'healthy' ? '✓' : '✗'} {status.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{status.message}</div>
                {status.responseTime !== null && (
                  <div className="text-sm text-gray-500 mt-2">
                    Response time: {status.responseTime}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Database Health */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Database Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connection Stats */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Connection Pool</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Connections:</span>
                  <span className="font-semibold">{healthData.databaseHealth.connections.total_connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-semibold text-green-600">{healthData.databaseHealth.connections.active_connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Idle:</span>
                  <span className="font-semibold text-gray-500">{healthData.databaseHealth.connections.idle_connections}</span>
                </div>
              </div>
            </div>

            {/* Database Size */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Storage</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Database Size:</span>
                  <span className="font-semibold">{healthData.databaseHealth.databaseSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slow Queries:</span>
                  <span className={`font-semibold ${typeof healthData.databaseHealth.slowQueries === 'number' && healthData.databaseHealth.slowQueries > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {healthData.databaseHealth.slowQueries}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Tables */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Largest Tables</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-semibold text-gray-700">Table</th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-700">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.databaseHealth.topTables.map((table, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="py-2 text-sm text-gray-900">{table.tablename}</td>
                      <td className="py-2 text-sm text-gray-600 text-right font-mono">{table.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Performance & Business Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Errors (24h):</span>
                <span className={`font-semibold ${healthData.performanceMetrics.errorsLast24h > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {healthData.performanceMetrics.errorsLast24h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users (30m):</span>
                <span className="font-semibold">{healthData.performanceMetrics.activeUsers}</span>
              </div>
            </div>
          </div>

          {/* Business Metrics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Business Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-indigo-600">{healthData.businessMetrics.ads.active_ads}</div>
                <div className="text-sm text-gray-600">Active Ads</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{healthData.businessMetrics.ads.pending_ads}</div>
                <div className="text-sm text-gray-600">Pending Ads</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{healthData.businessMetrics.users.active_users}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {parseInt(healthData.businessMetrics.pendingVerifications.pending_business) + parseInt(healthData.businessMetrics.pendingVerifications.pending_individual)}
                </div>
                <div className="text-sm text-gray-600">Pending Verifications</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Node Version</div>
              <div className="font-semibold">{healthData.systemInfo.nodeVersion}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Platform</div>
              <div className="font-semibold">{healthData.systemInfo.platform}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Uptime</div>
              <div className="font-semibold">{formatUptime(healthData.systemInfo.uptime)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Memory (Heap Used)</div>
              <div className="font-semibold">{healthData.systemInfo.memoryUsage.heapUsed}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
