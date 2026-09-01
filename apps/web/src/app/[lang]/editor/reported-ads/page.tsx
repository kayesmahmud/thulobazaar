'use client';

import { useEffect, useRef, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { EditorSearchBar } from '@/components/editor';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/navigation';
import { markSectionSeen } from '@/lib/editorApi';
import { ReportTabs, StatsCards, ReportsList } from './components';
import { useReportedAds } from './useReportedAds';
import { TABS, type TabStatus } from './types';
import Pagination from '../ad-management/components/Pagination';

export default function ReportedAdsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const {
    reports,
    loading,
    actionLoading,
    tabCounts,
    totalPages,
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

  // Mark this section as seen once per visit → clears the dashboard "Reported Ads" badge.
  const markedSeen = useRef(false);
  useEffect(() => {
    if (authLoading || !staff || !isEditor || markedSeen.current) return;
    markedSeen.current = true;
    markSectionSeen('reported_ads').catch(() => {});
  }, [authLoading, staff, isEditor]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadReportedAds(activeTab, page, searchTerm);
    loadTabCounts();
  }, [authLoading, staff, isEditor, params.lang, router, loadReportedAds, loadTabCounts, activeTab, page, searchTerm]);

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
  };

  // Search is server-side across every page; it only runs on an explicit submit
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

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
      userEmail={staff?.email || 'editor@thulobazaar.com.np'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reported Ads</h1>
            <p className="text-gray-600 mt-1">Review and manage user-reported content</p>
          </div>
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
          <StatsCards tabCounts={tabCounts} filteredReports={reports} />
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <EditorSearchBar
            value={searchTerm}
            onSearch={handleSearch}
            placeholder="Search by ad title, reporter, seller, or reason..."
          />
        </div>

        {/* Reports List */}
        <ReportsList
          reports={reports}
          loading={loading}
          activeTab={activeTab}
          lang={params.lang}
          actionLoading={actionLoading}
          onDeleteAd={(adId, reason) => handleDeleteAd(adId, reason, activeTab)}
          onDismissReport={(reportId) => handleDismissReport(reportId, activeTab)}
          onRestoreAd={(adId, title) => handleRestoreAd(adId, title, activeTab)}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </DashboardLayout>
  );
}
