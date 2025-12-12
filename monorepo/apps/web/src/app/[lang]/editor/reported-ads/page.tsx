'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getReportedAds, deleteAd, dismissReport, restoreAd } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface ReportedAd {
  reportId: number;
  adId: number;
  adSlug: string;
  adTitle: string;
  adDescription: string;
  price: number;
  adStatus: string;
  reason: string;
  description: string;
  status: string;
  reportedAt: string;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  sellerName: string;
  sellerEmail: string;
  adminNotes?: string;
}

type TabStatus = 'pending' | 'resolved' | 'dismissed';

const TABS: { id: TabStatus; label: string; icon: string; color: string }[] = [
  { id: 'pending', label: 'Pending Review', icon: '🚩', color: 'red' },
  { id: 'resolved', label: 'Deleted Ads', icon: '🗑️', color: 'green' },
  { id: 'dismissed', label: 'Dismissed', icon: '✅', color: 'gray' },
];

export default function ReportedAdsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [reports, setReports] = useState<ReportedAd[]>([]);
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

  const loadReportedAds = useCallback(async (status: TabStatus) => {
    try {
      setLoading(true);
      const response = await getReportedAds<ReportedAd>(undefined, {
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
      console.error('Error loading reported ads:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Load counts for all tabs
  const loadTabCounts = useCallback(async () => {
    try {
      const [pendingRes, resolvedRes, dismissedRes] = await Promise.all([
        getReportedAds<ReportedAd>(undefined, { status: 'pending', limit: 1 }),
        getReportedAds<ReportedAd>(undefined, { status: 'resolved', limit: 1 }),
        getReportedAds<ReportedAd>(undefined, { status: 'dismissed', limit: 1 }),
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
    loadReportedAds(activeTab);
    loadTabCounts();
  }, [authLoading, staff, isEditor, params.lang, router, loadReportedAds, loadTabCounts, activeTab]);

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
  };

  const handleDeleteAd = async (adId: number, reportReason: string) => {
    if (
      !confirm(
        `Are you sure you want to delete this ad?\n\nReason: ${reportReason}\n\nThis action cannot be undone.`
      )
    )
      return;

    try {
      setActionLoading(true);
      const response = await deleteAd(adId, `Deleted due to report: ${reportReason}`);

      if (response.success) {
        alert('Ad deleted successfully!');
        loadReportedAds(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: number) => {
    const reason = prompt('Enter reason for dismissing this report (optional):');
    if (reason === null) return; // User cancelled

    try {
      setActionLoading(true);
      const response = await dismissReport(reportId, reason || 'Report verified as false/invalid');

      if (response.success) {
        alert('Report dismissed successfully!');
        loadReportedAds(activeTab);
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

  const handleRestoreAd = async (adId: number, adTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to restore this ad?\n\nAd: "${adTitle}"\n\nThe ad will become visible to users again.`
      )
    )
      return;

    try {
      setActionLoading(true);
      const response = await restoreAd(adId);

      if (response.success) {
        alert('Ad restored successfully! The ad is now visible to users.');
        loadReportedAds(activeTab);
        loadTabCounts();
      } else {
        alert('Failed to restore ad');
      }
    } catch (error) {
      console.error('Error restoring ad:', error);
      alert('Error restoring ad');
    } finally {
      setActionLoading(false);
    }
  };

  const getReasonBadge = (reason: string) => {
    const badges: Record<string, string> = {
      spam: 'bg-red-100 text-red-800 border-red-200',
      fraud: 'bg-orange-100 text-orange-800 border-orange-200',
      scam: 'bg-orange-100 text-orange-800 border-orange-200',
      inappropriate: 'bg-purple-100 text-purple-800 border-purple-200',
      duplicate: 'bg-blue-100 text-blue-800 border-blue-200',
      misleading: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return badges[reason.toLowerCase()] || badges.other;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const filteredReports = reports.filter((report) =>
    searchTerm
      ? report.adTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  if (authLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900">Reported Ads</h1>
            <p className="text-gray-600 mt-1">Review and manage user-reported content</p>
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
                    ? 'bg-red-500 text-white shadow-md'
                    : tab.id === 'resolved'
                    ? 'bg-green-500 text-white shadow-md'
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
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">Pending Reports</div>
                  <div className="text-3xl font-bold text-red-900">{tabCounts.pending}</div>
                </div>
                <div className="text-4xl">🚩</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-orange-700 mb-1">Fraud/Scam</div>
                  <div className="text-3xl font-bold text-orange-900">
                    {filteredReports.filter((r) => ['scam', 'fraud'].includes(r.reason.toLowerCase())).length}
                  </div>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-purple-700 mb-1">Inappropriate</div>
                  <div className="text-3xl font-bold text-purple-900">
                    {filteredReports.filter((r) => r.reason.toLowerCase() === 'inappropriate').length}
                  </div>
                </div>
                <div className="text-4xl">🔞</div>
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
            placeholder="Search by ad title, reporter, seller, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4 animate-bounce">⏳</div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">
                {activeTab === 'pending' ? '✅' : activeTab === 'resolved' ? '🗑️' : '📋'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'pending'
                  ? 'No pending reports'
                  : activeTab === 'resolved'
                  ? 'No deleted ads yet'
                  : 'No dismissed reports'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending'
                  ? 'All reported ads have been reviewed'
                  : activeTab === 'resolved'
                  ? 'Deleted ads from reports will appear here'
                  : 'Dismissed reports will appear here'}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.reportId}
                className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-shadow ${
                  activeTab === 'pending'
                    ? 'border-red-100'
                    : activeTab === 'resolved'
                    ? 'border-green-100'
                    : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  {/* Report Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        activeTab === 'pending'
                          ? 'bg-red-100'
                          : activeTab === 'resolved'
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}>
                        <span className="text-2xl">
                          {activeTab === 'pending' ? '🚩' : activeTab === 'resolved' ? '🗑️' : '✅'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-gray-600">Report #</span>
                          <span className="text-sm font-bold text-gray-900">{report.reportId}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getReasonBadge(report.reason)}`}>
                            {report.reason.toUpperCase()}
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
                    {/* Left: Ad Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Reported Ad
                      </h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{report.adTitle}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.adDescription}</p>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <span className="text-gray-600">💰 NPR {report.price?.toLocaleString()}</span>
                          <span className="text-gray-600">Ad ID: #{report.adId}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              report.adStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : report.adStatus === 'deleted'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {report.adStatus}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Seller:</div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.sellerName} ({report.sellerEmail})
                          </div>
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
                          ? 'bg-red-50 border-red-200'
                          : activeTab === 'resolved'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="mb-3">
                          <div className={`text-xs mb-1 font-medium ${
                            activeTab === 'pending' ? 'text-red-700' : 'text-gray-700'
                          }`}>Reporter:</div>
                          <div className="text-sm text-gray-900">
                            {report.reporterName} ({report.reporterEmail})
                          </div>
                          <div className="text-xs text-gray-500 mt-1">User ID: #{report.reporterId}</div>
                        </div>
                        {report.description && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className={`text-xs mb-1 font-medium ${
                              activeTab === 'pending' ? 'text-red-700' : 'text-gray-700'
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
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 flex-wrap">
                    <button
                      onClick={() => window.open(`/${params.lang}/ad/${report.adSlug}`, '_blank')}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      👁️ View Ad
                    </button>

                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleDeleteAd(report.adId, report.reason)}
                          disabled={actionLoading}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🗑️ Delete Ad
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

                    {activeTab === 'resolved' && (
                      <button
                        onClick={() => handleRestoreAd(report.adId, report.adTitle)}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ♻️ Restore Ad
                      </button>
                    )}

                    <button
                      onClick={() =>
                        alert(`Contact Reporter: ${report.reporterEmail}\nContact Seller: ${report.sellerEmail}`)
                      }
                      className="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      📧 Contact
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
