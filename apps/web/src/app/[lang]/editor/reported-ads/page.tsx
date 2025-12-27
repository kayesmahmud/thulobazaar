'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/navigation';
import { ReportTabs, StatsCards, SearchBar, ReportsList } from './components';
import { useReportedAds } from './useReportedAds';
import { TABS, type TabStatus } from './types';

export default function ReportedAdsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const {
    reports,
    loading,
    actionLoading,
    tabCounts,
    loadReportedAds,
    loadTabCounts,
    handleDeleteAd,
    handleDismissReport,
    handleRestoreAd,
  } = useReportedAds();

  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

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
    loadReportedAds(activeTab, page);
    loadTabCounts();
  }, [authLoading, staff, isEditor, params.lang, router, loadReportedAds, loadTabCounts, activeTab, page]);

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
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
        <ReportTabs
          tabs={TABS}
          activeTab={activeTab}
          tabCounts={tabCounts}
          onTabChange={handleTabChange}
        />

        {/* Stats - Only show for pending tab */}
        {activeTab === 'pending' && (
          <StatsCards tabCounts={tabCounts} filteredReports={filteredReports} />
        )}

        {/* Search Bar */}
        <SearchBar value={searchTerm} onChange={setSearchTerm} />

        {/* Reports List */}
        <ReportsList
          reports={filteredReports}
          loading={loading}
          activeTab={activeTab}
          lang={params.lang}
          actionLoading={actionLoading}
          onDeleteAd={(adId, reason) => handleDeleteAd(adId, reason, activeTab)}
          onDismissReport={(reportId) => handleDismissReport(reportId, activeTab)}
          onRestoreAd={(adId, title) => handleRestoreAd(adId, title, activeTab)}
        />
      </div>
    </DashboardLayout>
  );
}
