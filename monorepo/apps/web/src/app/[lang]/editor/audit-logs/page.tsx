'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface AuditLog {
  id: number;
  timestamp: string;
  editorName: string;
  editorEmail: string;
  action: string;
  actionType: 'ad_approval' | 'ad_rejection' | 'ad_deletion' | 'user_suspension' | 'user_unsuspension' | 'verification_approval' | 'verification_rejection' | 'template_created' | 'settings_changed';
  targetType: 'ad' | 'user' | 'verification' | 'template' | 'system';
  targetId?: number;
  targetName: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

type ActionTypeFilter = 'all' | 'ad_approval' | 'ad_rejection' | 'ad_deletion' | 'user_suspension' | 'user_unsuspension' | 'verification_approval' | 'verification_rejection' | 'template_created' | 'settings_changed';
type TimeFilter = 'today' | 'week' | 'month' | 'all';

export default function AuditLogsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const now = Date.now();
    return [
      {
        id: 1,
        timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
        editorName: 'Editor Admin',
        editorEmail: 'admin@thulobazaar.com',
        action: 'Approved Ad',
        actionType: 'ad_approval',
        targetType: 'ad',
        targetId: 1234,
        targetName: 'iPhone 13 Pro Max for Sale',
        details: 'Ad approved after review. All guidelines met.',
        ipAddress: '192.168.1.100',
        metadata: { category: 'Electronics', price: 95000 },
      },
      {
        id: 2,
        timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
        editorName: 'Editor User',
        editorEmail: 'editor@thulobazaar.com',
        action: 'Rejected Ad',
        actionType: 'ad_rejection',
        targetType: 'ad',
        targetId: 1235,
        targetName: 'Car for Sale - Good Condition',
        details: 'Ad rejected due to poor quality images. User notified to resubmit with clear photos.',
        ipAddress: '192.168.1.101',
        metadata: { reason: 'Poor Quality Images' },
      },
      {
        id: 3,
        timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
        editorName: 'Editor Admin',
        editorEmail: 'admin@thulobazaar.com',
        action: 'Suspended User',
        actionType: 'user_suspension',
        targetType: 'user',
        targetId: 567,
        targetName: 'john.doe@example.com',
        details: 'User suspended for 7 days due to spam-like activity. Multiple similar ads posted.',
        ipAddress: '192.168.1.100',
        metadata: { suspensionDays: 7, reason: 'Spam Activity' },
      },
      {
        id: 4,
        timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
        editorName: 'Editor Moderator',
        editorEmail: 'moderator@thulobazaar.com',
        action: 'Approved Business Verification',
        actionType: 'verification_approval',
        targetType: 'verification',
        targetId: 89,
        targetName: 'ABC Electronics Pvt Ltd',
        details: 'Business verification approved. All documents verified and valid.',
        ipAddress: '192.168.1.102',
        metadata: { businessType: 'Electronics Store' },
      },
      {
        id: 5,
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        editorName: 'Editor User',
        editorEmail: 'editor@thulobazaar.com',
        action: 'Deleted Ad',
        actionType: 'ad_deletion',
        targetType: 'ad',
        targetId: 1236,
        targetName: 'Prohibited Item Listing',
        details: 'Ad deleted permanently due to prohibited content violation. User warned.',
        ipAddress: '192.168.1.101',
        metadata: { reason: 'Prohibited Items', permanent: true },
      },
      {
        id: 6,
        timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        editorName: 'Editor Admin',
        editorEmail: 'admin@thulobazaar.com',
        action: 'Unsuspended User',
        actionType: 'user_unsuspension',
        targetType: 'user',
        targetId: 568,
        targetName: 'jane.smith@example.com',
        details: 'User suspension lifted after appeal review. Account restored to good standing.',
        ipAddress: '192.168.1.100',
        metadata: { appealId: 123 },
      },
      {
        id: 7,
        timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        editorName: 'Editor Moderator',
        editorEmail: 'moderator@thulobazaar.com',
        action: 'Rejected Verification',
        actionType: 'verification_rejection',
        targetType: 'verification',
        targetId: 90,
        targetName: 'XYZ Trading Company',
        details: 'Business verification rejected due to incomplete documents. User notified to resubmit.',
        ipAddress: '192.168.1.102',
        metadata: { reason: 'Incomplete Documents' },
      },
      {
        id: 8,
        timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        editorName: 'Editor Admin',
        editorEmail: 'admin@thulobazaar.com',
        action: 'Created Response Template',
        actionType: 'template_created',
        targetType: 'template',
        targetId: 12,
        targetName: 'Spam Warning Template',
        details: 'New response template created for spam warnings.',
        ipAddress: '192.168.1.100',
        metadata: { category: 'suspension' },
      },
      {
        id: 9,
        timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        editorName: 'Editor Admin',
        editorEmail: 'admin@thulobazaar.com',
        action: 'Approved Ad',
        actionType: 'ad_approval',
        targetType: 'ad',
        targetId: 1237,
        targetName: 'Apartment for Rent in Kathmandu',
        details: 'Ad approved. Property details verified.',
        ipAddress: '192.168.1.100',
        metadata: { category: 'Real Estate', price: 25000 },
      },
      {
        id: 10,
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        editorName: 'Editor User',
        editorEmail: 'editor@thulobazaar.com',
        action: 'Changed System Settings',
        actionType: 'settings_changed',
        targetType: 'system',
        targetName: 'Moderation Settings',
        details: 'Updated auto-approval threshold from 90% to 85%.',
        ipAddress: '192.168.1.101',
        metadata: { setting: 'auto_approval_threshold', oldValue: 90, newValue: 85 },
      },
    ];
  });

  const [loading, setLoading] = useState(false);
  const [actionTypeFilter, setActionTypeFilter] = useState<ActionTypeFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [page, setPage] = useState(1);
  const logsPerPage = 10;

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
  }, [authLoading, staff, isEditor, params.lang, router]);

  const filterLogsByTime = (log: AuditLog): boolean => {
    const now = Date.now();
    const logTime = new Date(log.timestamp).getTime();
    const diff = now - logTime;

    switch (timeFilter) {
      case 'today':
        return diff < 24 * 60 * 60 * 1000;
      case 'week':
        return diff < 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return diff < 30 * 24 * 60 * 60 * 1000;
      case 'all':
      default:
        return true;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesActionType = actionTypeFilter === 'all' || log.actionType === actionTypeFilter;
    const matchesTime = filterLogsByTime(log);
    const matchesSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.editorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesActionType && matchesTime && matchesSearch;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      ad_approval: '✅',
      ad_rejection: '❌',
      ad_deletion: '🗑️',
      user_suspension: '🚫',
      user_unsuspension: '🔓',
      verification_approval: '✓',
      verification_rejection: '✗',
      template_created: '📄',
      settings_changed: '⚙️',
    };
    return icons[actionType] || '📝';
  };

  const getActionBadge = (actionType: string) => {
    const badges: Record<string, string> = {
      ad_approval: 'bg-green-100 text-green-800 border-green-200',
      ad_rejection: 'bg-red-100 text-red-800 border-red-200',
      ad_deletion: 'bg-gray-100 text-gray-800 border-gray-200',
      user_suspension: 'bg-orange-100 text-orange-800 border-orange-200',
      user_unsuspension: 'bg-blue-100 text-blue-800 border-blue-200',
      verification_approval: 'bg-green-100 text-green-800 border-green-200',
      verification_rejection: 'bg-red-100 text-red-800 border-red-200',
      template_created: 'bg-purple-100 text-purple-800 border-purple-200',
      settings_changed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return badges[actionType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const handleExportLogs = () => {
    const csv = [
      ['Timestamp', 'Editor', 'Action', 'Target', 'Details', 'IP Address'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.editorName,
          log.action,
          log.targetName,
          `"${log.details}"`,
          log.ipAddress || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
            <div className="text-lg font-semibold text-gray-700">Loading audit logs...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">Track all editor actions and system changes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportLogs}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Total Actions</div>
                <div className="text-3xl font-bold text-blue-900">{filteredLogs.length}</div>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700 mb-1">Approvals</div>
                <div className="text-3xl font-bold text-green-900">
                  {logs.filter((l) => l.actionType.includes('approval')).length}
                </div>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-700 mb-1">Rejections</div>
                <div className="text-3xl font-bold text-red-900">
                  {logs.filter((l) => l.actionType.includes('rejection')).length}
                </div>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-700 mb-1">Suspensions</div>
                <div className="text-3xl font-bold text-orange-900">
                  {logs.filter((l) => l.actionType === 'user_suspension').length}
                </div>
              </div>
              <div className="text-4xl">🚫</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700 mb-1">Editors Active</div>
                <div className="text-3xl font-bold text-purple-900">
                  {new Set(logs.map((l) => l.editorEmail)).size}
                </div>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by action, editor, target, or details..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <select
              value={actionTypeFilter}
              onChange={(e) => {
                setActionTypeFilter(e.target.value as ActionTypeFilter);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="ad_approval">Ad Approvals</option>
              <option value="ad_rejection">Ad Rejections</option>
              <option value="ad_deletion">Ad Deletions</option>
              <option value="user_suspension">User Suspensions</option>
              <option value="user_unsuspension">User Unsuspensions</option>
              <option value="verification_approval">Verification Approvals</option>
              <option value="verification_rejection">Verification Rejections</option>
              <option value="template_created">Template Created</option>
              <option value="settings_changed">Settings Changed</option>
            </select>
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as TimeFilter);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Editor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <p>No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">{getTimeAgo(log.timestamp)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mr-2">
                            <span className="text-sm font-semibold text-teal-700">
                              {log.editorName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.editorName}</div>
                            <div className="text-xs text-gray-500">{log.editorEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex items-center gap-2 text-xs leading-5 font-semibold rounded-full border ${getActionBadge(
                            log.actionType
                          )}`}
                        >
                          <span>{getActionIcon(log.actionType)}</span>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.targetName}</div>
                        <div className="text-xs text-gray-500">
                          {log.targetType} {log.targetId && `#${log.targetId}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-md line-clamp-2">
                          {log.details}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="text-teal-600 hover:text-teal-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages} ({filteredLogs.length} total logs)
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Audit Log Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Log ID</div>
                    <div className="text-sm font-medium text-gray-900">#{selectedLog.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Timestamp</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Editor</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-teal-700">
                      {selectedLog.editorName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedLog.editorName}</div>
                    <div className="text-xs text-gray-500">{selectedLog.editorEmail}</div>
                    {selectedLog.ipAddress && (
                      <div className="text-xs text-gray-400">IP: {selectedLog.ipAddress}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Action</div>
                <div
                  className={`px-3 py-2 inline-flex items-center gap-2 text-sm font-semibold rounded-lg border ${getActionBadge(
                    selectedLog.actionType
                  )}`}
                >
                  <span className="text-lg">{getActionIcon(selectedLog.actionType)}</span>
                  {selectedLog.action}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Target</div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {selectedLog.targetName}
                </div>
                <div className="text-xs text-gray-500">
                  Type: {selectedLog.targetType} {selectedLog.targetId && `• ID: #${selectedLog.targetId}`}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Details</div>
                <div className="text-sm text-gray-700">{selectedLog.details}</div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Additional Metadata</div>
                  <div className="bg-white rounded p-3 font-mono text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
