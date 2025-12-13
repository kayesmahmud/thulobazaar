'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/editorNavigation';
import {
  useReportedShopsPage,
  TabsBar,
  StatsCards,
  ReportCard,
} from './components';

export default function ReportedShopsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const lang = params.lang;

  const {
    staff,
    authLoading,
    reports,
    loading,
    actionLoading,
    activeTab,
    searchTerm,
    setSearchTerm,
    tabCounts,
    handleLogout,
    handleTabChange,
    handleSuspendShop,
    handleDismissReport,
    handleUnsuspendShop,
  } = useReportedShopsPage(lang);

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
      lang={lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(lang)}
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
            onClick={() => router.push(`/${lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <TabsBar activeTab={activeTab} tabCounts={tabCounts} onTabChange={handleTabChange} />

        {/* Stats - Only show for pending tab */}
        {activeTab === 'pending' && <StatsCards tabCounts={tabCounts} filteredReports={reports} />}

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
          ) : reports.length === 0 ? (
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
            reports.map((report) => (
              <ReportCard
                key={report.reportId}
                report={report}
                activeTab={activeTab}
                lang={lang}
                actionLoading={actionLoading}
                onSuspendShop={handleSuspendShop}
                onDismissReport={handleDismissReport}
                onUnsuspendShop={handleUnsuspendShop}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
