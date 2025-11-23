'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getReportedAds, deleteAd } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface ReportedAd {
  reportId: number;
  adId: number;
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
}

export default function ReportedAdsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [reports, setReports] = useState<ReportedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadReportedAds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getReportedAds(undefined, {
        status: 'pending',
        page,
        limit: 10,
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

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadReportedAds();
  }, [authLoading, staff, isEditor, params.lang, router, loadReportedAds]);

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
        loadReportedAds();
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

  const handleDismissReport = () => {
    alert('Report dismissal feature will be implemented soon');
  };

  const getReasonBadge = (reason: string) => {
    const badges: Record<string, string> = {
      spam: 'bg-red-100 text-red-800 border-red-200',
      scam: 'bg-orange-100 text-orange-800 border-orange-200',
      inappropriate: 'bg-purple-100 text-purple-800 border-purple-200',
      duplicate: 'bg-blue-100 text-blue-800 border-blue-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return badges[reason.toLowerCase()] || badges.other;
  };

  const filteredReports = reports.filter((report) =>
    searchTerm
      ? report.adTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

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
            <div className="text-lg font-semibold text-gray-700">Loading reported ads...</div>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-700 mb-1">Total Reports</div>
                <div className="text-3xl font-bold text-red-900">{filteredReports.length}</div>
              </div>
              <div className="text-4xl">🚩</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-700 mb-1">Scam Reports</div>
                <div className="text-3xl font-bold text-orange-900">
                  {filteredReports.filter((r) => r.reason.toLowerCase() === 'scam').length}
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
                  {
                    filteredReports.filter((r) => r.reason.toLowerCase() === 'inappropriate')
                      .length
                  }
                </div>
              </div>
              <div className="text-4xl">🔞</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-amber-700 mb-1">Avg. Response</div>
                <div className="text-3xl font-bold text-amber-900">2.1h</div>
              </div>
              <div className="text-4xl">⏱️</div>
            </div>
          </div>
        </div>

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
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending reports</h3>
              <p className="text-gray-600">All reported ads have been reviewed</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.reportId}
                className="bg-white rounded-xl shadow-sm border-2 border-red-100 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Report Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🚩</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-600">Report #</span>
                          <span className="text-sm font-bold text-gray-900">
                            {report.reportId}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold border ${getReasonBadge(report.reason)}`}
                          >
                            {report.reason.toUpperCase()}
                          </span>
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
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {report.adTitle}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {report.adDescription}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            💰 NPR {report.price?.toLocaleString()}
                          </span>
                          <span className="text-gray-600">Ad ID: #{report.adId}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              report.adStatus === 'active'
                                ? 'bg-green-100 text-green-800'
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
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="mb-3">
                          <div className="text-xs text-red-700 mb-1 font-medium">Reporter:</div>
                          <div className="text-sm text-gray-900">
                            {report.reporterName} ({report.reporterEmail})
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            User ID: #{report.reporterId}
                          </div>
                        </div>
                        {report.description && (
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <div className="text-xs text-red-700 mb-1 font-medium">
                              Description:
                            </div>
                            <div className="text-sm text-gray-900">{report.description}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => window.open(`/${params.lang}/ad/${report.adId}`, '_blank')}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      👁️ View Ad
                    </button>
                    <button
                      onClick={() => handleDeleteAd(report.adId, report.reason)}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🗑️ Delete Ad
                    </button>
                    <button
                      onClick={handleDismissReport}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Dismiss Report
                    </button>
                    <button
                      onClick={() =>
                        alert(`Contact Reporter: ${report.reporterEmail}\nContact Seller: ${report.sellerEmail}`)
                      }
                      className="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      📧 Contact Parties
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
