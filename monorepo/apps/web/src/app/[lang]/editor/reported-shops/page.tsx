'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getReportedShops, dismissShopReport, suspendShopFromReport, unsuspendShopFromReport } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface ReportedShop {
  reportId: number;
  shopId: number;
  reporterId: number;
  reason: string;
  description: string;
  status: string;
  adminNotes?: string;
  resolvedBy?: number;
  reportedAt: string;
  updatedAt: string;
  // Shop details
  shopName: string;
  shopEmail: string;
  shopAvatar: string | null;
  shopSlug: string;
  shopIsActive: boolean;
  shopAccountType: string | null;
  shopVerificationStatus: string | null;
  shopIndividualVerified: boolean;
  // Reporter details
  reporterName: string;
  reporterEmail: string;
  reporterAvatar: string | null;
  // Resolver (editor) details
  resolverName?: string | null;
  resolverEmail?: string | null;
  resolverRole?: string | null;
}

type TabStatus = 'pending' | 'resolved' | 'dismissed';

const TABS: { id: TabStatus; label: string; icon: string; color: string }[] = [
  { id: 'pending', label: 'Pending Review', icon: '🏪', color: 'orange' },
  { id: 'resolved', label: 'Suspended Shops', icon: '🚫', color: 'red' },
  { id: 'dismissed', label: 'Dismissed', icon: '✅', color: 'gray' },
];

const REASON_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  fraud: { label: 'Fraud/Scam', icon: '⚠️', color: 'red' },
  harassment: { label: 'Harassment', icon: '🚫', color: 'purple' },
  fake_products: { label: 'Fake Products', icon: '📦', color: 'orange' },
  poor_service: { label: 'Poor Service', icon: '👎', color: 'yellow' },
  impersonation: { label: 'Impersonation', icon: '🎭', color: 'blue' },
  other: { label: 'Other', icon: '📝', color: 'gray' },
};

export default function ReportedShopsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [reports, setReports] = useState<ReportedShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabCounts, setTabCounts] = useState({ pending: 0, resolved: 0, dismissed: 0 });

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadReportedShops = useCallback(async (status: TabStatus) => {
    try {
      setLoading(true);
      const response = await getReportedShops(undefined, {
        status,
        page,
        limit: 50,
      });

      if (response.success && Array.isArray(response.data)) {
        setReports(response.data);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reported shops:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Load counts for all tabs
  const loadTabCounts = useCallback(async () => {
    try {
      const [pendingRes, resolvedRes, dismissedRes] = await Promise.all([
        getReportedShops(undefined, { status: 'pending', limit: 1 }),
        getReportedShops(undefined, { status: 'resolved', limit: 1 }),
        getReportedShops(undefined, { status: 'dismissed', limit: 1 }),
      ]);

      setTabCounts({
        pending: pendingRes.pagination?.total || 0,
        resolved: resolvedRes.pagination?.total || 0,
        dismissed: dismissedRes.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error loading tab counts:', error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadReportedShops(activeTab);
    loadTabCounts();
  }, [authLoading, staff, isEditor, params.lang, router, loadReportedShops, loadTabCounts, activeTab]);

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
  };

  const handleSuspendShop = async (shopId: number, reportId: number, reportReason: string) => {
    const reason = prompt(`Enter reason for suspending this shop:\n\nReport reason: ${reportReason}`);
    if (!reason) return;

    try {
      setActionLoading(true);
      const response = await suspendShopFromReport(shopId, reportId, reason);

      if (response.success) {
        alert('Shop suspended successfully!');
        loadReportedShops(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to suspend shop');
      }
    } catch (error) {
      console.error('Error suspending shop:', error);
      alert('Error suspending shop');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: number) => {
    const reason = prompt('Enter reason for dismissing this report (optional):');
    if (reason === null) return; // User cancelled

    try {
      setActionLoading(true);
      const response = await dismissShopReport(reportId, reason || 'Report verified as false/invalid');

      if (response.success) {
        alert('Report dismissed successfully!');
        loadReportedShops(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to dismiss report');
      }
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Error dismissing report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendShop = async (shopId: number, reportId: number, shopName: string) => {
    if (
      !confirm(
        `Are you sure you want to restore this shop?\n\nShop: "${shopName}"\n\nThe shop will become active and visible to users again.`
      )
    )
      return;

    try {
      setActionLoading(true);
      const response = await unsuspendShopFromReport(shopId, reportId);

      if (response.success) {
        alert('Shop restored successfully! The shop is now active.');
        loadReportedShops(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to restore shop');
      }
    } catch (error) {
      console.error('Error restoring shop:', error);
      alert('Error restoring shop');
    } finally {
      setActionLoading(false);
    }
  };

  const getReasonBadge = (reason: string) => {
    const reasonInfo = REASON_LABELS[reason.toLowerCase()] || REASON_LABELS.other;
    const colorClasses: Record<string, string> = {
      red: 'bg-red-100 text-red-800 border-red-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return {
      className: colorClasses[reasonInfo.color] || colorClasses.gray,
      label: reasonInfo.label,
      icon: reasonInfo.icon,
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const filteredReports = reports.filter((report) =>
    searchTerm
      ? report.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.shopEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">🏪</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Reported Shops</h1>
            <p className="text-gray-600 mt-1">Review and manage shop/seller reports</p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? tab.id === 'pending'
                    ? 'bg-orange-500 text-white shadow-md'
                    : tab.id === 'resolved'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Stats - Only show for pending tab */}
        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-orange-700 mb-1">Pending Reports</div>
                  <div className="text-3xl font-bold text-orange-900">{tabCounts.pending}</div>
                </div>
                <div className="text-4xl">🏪</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">Fraud/Scam</div>
                  <div className="text-3xl font-bold text-red-900">
                    {filteredReports.filter((r) => r.reason.toLowerCase() === 'fraud').length}
                  </div>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-purple-700 mb-1">Harassment</div>
                  <div className="text-3xl font-bold text-purple-900">
                    {filteredReports.filter((r) => r.reason.toLowerCase() === 'harassment').length}
                  </div>
                </div>
                <div className="text-4xl">🚫</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-700 mb-1">Total Resolved</div>
                  <div className="text-3xl font-bold text-green-900">{tabCounts.resolved + tabCounts.dismissed}</div>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search by shop name, reporter, email, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4 animate-bounce">🏪</div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">
                {activeTab === 'pending' ? '✅' : activeTab === 'resolved' ? '🚫' : '📋'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'pending'
                  ? 'No pending shop reports'
                  : activeTab === 'resolved'
                  ? 'No suspended shops yet'
                  : 'No dismissed reports'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending'
                  ? 'All shop reports have been reviewed'
                  : activeTab === 'resolved'
                  ? 'Suspended shops from reports will appear here'
                  : 'Dismissed reports will appear here'}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const reasonBadge = getReasonBadge(report.reason);
              return (
                <div
                  key={report.reportId}
                  className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-shadow ${
                    activeTab === 'pending'
                      ? 'border-orange-100'
                      : activeTab === 'resolved'
                      ? 'border-red-100'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="p-6">
                    {/* Report Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          activeTab === 'pending'
                            ? 'bg-orange-100'
                            : activeTab === 'resolved'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                        }`}>
                          <span className="text-2xl">
                            {activeTab === 'pending' ? '🏪' : activeTab === 'resolved' ? '🚫' : '✅'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-gray-600">Report #</span>
                            <span className="text-sm font-bold text-gray-900">{report.reportId}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${reasonBadge.className}`}>
                              {reasonBadge.icon} {reasonBadge.label}
                            </span>
                            {activeTab !== 'pending' && (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(report.status)}`}>
                                {report.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Reported {new Date(report.reportedAt).toLocaleString('en-US')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Shop Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Reported Shop
                        </h4>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            {report.shopAvatar && (report.shopAvatar.startsWith('http') || report.shopAvatar.startsWith('/')) ? (
                              <img
                                src={report.shopAvatar}
                                alt={report.shopName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                                <span className="text-xl font-bold text-orange-700">
                                  {report.shopName?.charAt(0)?.toUpperCase() || '🏪'}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{report.shopName}</h3>
                              <p className="text-sm text-gray-600">{report.shopEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <span className="text-gray-600">Shop ID: #{report.shopId}</span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                report.shopIsActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {report.shopIsActive ? 'Active' : 'Suspended'}
                            </span>
                            {report.shopVerificationStatus === 'approved' && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Verified Business
                              </span>
                            )}
                            {report.shopIndividualVerified && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Verified Individual
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Report Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Report Details
                        </h4>
                        <div className={`p-4 rounded-lg border ${
                          activeTab === 'pending'
                            ? 'bg-orange-50 border-orange-200'
                            : activeTab === 'resolved'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="mb-3">
                            <div className={`text-xs mb-1 font-medium ${
                              activeTab === 'pending' ? 'text-orange-700' : 'text-gray-700'
                            }`}>Reporter:</div>
                            <div className="text-sm text-gray-900">
                              {report.reporterName} ({report.reporterEmail})
                            </div>
                            <div className="text-xs text-gray-500 mt-1">User ID: #{report.reporterId}</div>
                          </div>
                          {report.description && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className={`text-xs mb-1 font-medium ${
                                activeTab === 'pending' ? 'text-orange-700' : 'text-gray-700'
                              }`}>Description:</div>
                              <div className="text-sm text-gray-900">{report.description}</div>
                            </div>
                          )}
                          {report.adminNotes && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs text-green-700 mb-1 font-medium">Resolution Notes:</div>
                              <div className="text-sm text-gray-900">{report.adminNotes}</div>
                            </div>
                          )}
                          {report.resolverName && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs text-blue-700 mb-1 font-medium">Handled By:</div>
                              <div className="text-sm text-gray-900 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  {report.resolverName}
                                </span>
                                <span className="text-gray-500">({report.resolverEmail})</span>
                                {report.resolverRole && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    report.resolverRole === 'super_admin'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {report.resolverRole === 'super_admin' ? 'Super Admin' : 'Editor'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {report.updatedAt && `Resolved on ${new Date(report.updatedAt).toLocaleString('en-US')}`}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 flex-wrap">
                      <button
                        onClick={() => window.open(`/${params.lang}/shop/${report.shopSlug}`, '_blank')}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        👁️ View Shop
                      </button>

                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleSuspendShop(report.shopId, report.reportId, report.reason)}
                            disabled={actionLoading || !report.shopIsActive}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            🚫 Suspend Shop
                          </button>
                          <button
                            onClick={() => handleDismissReport(report.reportId)}
                            disabled={actionLoading}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✓ Dismiss Report
                          </button>
                        </>
                      )}

                      {activeTab === 'resolved' && !report.shopIsActive && (
                        <button
                          onClick={() => handleUnsuspendShop(report.shopId, report.reportId, report.shopName)}
                          disabled={actionLoading}
                          className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ♻️ Restore Shop
                        </button>
                      )}

                      <button
                        onClick={() =>
                          alert(`Contact Reporter: ${report.reporterEmail}\nContact Shop: ${report.shopEmail}`)
                        }
                        className="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        📧 Contact
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
