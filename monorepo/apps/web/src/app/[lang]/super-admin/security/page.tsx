'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

export default function SecurityAuditPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'sessions' | 'events'>('overview');

  const loadAuditData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSecurityAudit({ timeRange, page: currentPage, limit: 50 });
      if (response.success && response.data) {
        setAuditData(response.data);
      }
    } catch (error) {
      console.error('Error loading security audit:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, currentPage]);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadAuditData();
    }
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadAuditData]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  };

  const navSections = getSuperAdminNavSections(params.lang);

  const getActionTypeColor = (actionType: string) => {
    if (actionType.includes('failed') || actionType.includes('error')) return 'text-red-600 bg-red-50';
    if (actionType.includes('delete') || actionType.includes('suspend')) return 'text-orange-600 bg-orange-50';
    if (actionType.includes('create') || actionType.includes('approve')) return 'text-green-600 bg-green-50';
    if (actionType.includes('update') || actionType.includes('edit')) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

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
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security & Audit</h1>
            <p className="text-gray-600 mt-1">
              Monitor login attempts, admin activities, and security events
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={loadAuditData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'logs', label: 'Activity Logs', icon: '📋' },
              { id: 'sessions', label: 'Active Sessions', icon: '👥' },
              { id: 'events', label: 'Security Events', icon: '🔐' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && auditData && (
          <div className="space-y-6">
            {/* Security Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Failed Logins (24h)</div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🚫</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {auditData.securityOverview.failedLogins.last_24h}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {auditData.securityOverview.failedLogins.unique_users} unique users
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Successful Logins</div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✓</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {auditData.securityOverview.successfulLogins}
                </div>
                <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">2FA Enabled</div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔐</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {auditData.securityOverview.twoFactorAuth.enabled}/{auditData.securityOverview.twoFactorAuth.total}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((auditData.securityOverview.twoFactorAuth.enabled / auditData.securityOverview.twoFactorAuth.total) * 100)}% adoption
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Suspensions (24h)</div>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">⛔</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {auditData.securityOverview.suspensions.last_24h}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {auditData.securityOverview.suspensions.total} total
                </div>
              </div>
            </div>

            {/* Recent Failed Logins */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Failed Login Attempts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IP Address</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {auditData.failedLoginAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No failed login attempts in this time range
                        </td>
                      </tr>
                    ) : (
                      auditData.failedLoginAttempts.slice(0, 10).map((attempt: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{attempt.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono">{attempt.ipAddress || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(attempt.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                              {attempt.reason}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top IP Addresses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Top IP Addresses</h2>
                </div>
                <div className="p-6 space-y-3">
                  {auditData.topIpAddresses.slice(0, 10).map((ip: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-900">{ip.ip_address}</span>
                        <span className="text-xs text-gray-500">{ip.unique_users} users</span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">{ip.request_count} requests</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Action Type Statistics</h2>
                </div>
                <div className="p-6 space-y-3">
                  {auditData.actionTypeStats.slice(0, 10).map((stat: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`text-sm px-2 py-1 rounded ${getActionTypeColor(stat.action_type)}`}>
                        {stat.action_type}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && auditData && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Admin Activity Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Admin</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Target</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IP Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {auditData.activityLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.adminName}</div>
                          <div className="text-xs text-gray-500">{log.adminEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getActionTypeColor(log.actionType)}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.targetType} #{log.targetId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {auditData.activityPagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {auditData.activityPagination.page} of {auditData.activityPagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= auditData.activityPagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && auditData && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Sessions (Last 30 minutes)</h2>
            </div>
            <div className="p-6">
              {auditData.activeSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No active sessions in the last 30 minutes
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {auditData.activeSessions.map((session: any) => (
                    <div key={session.userId} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        {session.avatar ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/avatars/${session.avatar}`}
                            alt={session.fullName}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                            {session.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{session.fullName}</div>
                          <div className="text-xs text-gray-500">{session.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                          {session.role}
                        </span>
                        <span>{new Date(session.lastActivity).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && auditData && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Security Events</h2>
            </div>
            <div className="p-6">
              {auditData.securityEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No security events in this time range
                </div>
              ) : (
                <div className="space-y-4">
                  {auditData.securityEvents.map((event: any) => (
                    <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">
                            {event.actionType.includes('2fa') ? '🔐' :
                             event.actionType.includes('suspend') ? '⛔' :
                             event.actionType.includes('delete') ? '🗑️' :
                             event.actionType.includes('create') ? '✨' : '📝'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm px-2 py-1 rounded font-medium ${getActionTypeColor(event.actionType)}`}>
                              {event.actionType}
                            </span>
                            <span className="text-sm text-gray-600">by {event.adminName}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()} • IP: {event.ipAddress || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
