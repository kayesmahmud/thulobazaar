'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { EditorSearchBar } from '@/components/editor';
import { getEditorNavSections } from '@/lib/navigation';
import { useReportedUsersPage, TabsBar, StatsCards, ReportCard } from './components';

export default function ReportedUsersPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
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
    handleSearch,
    tabCounts,
    handleLogout,
    handleTabChange,
    handleSuspendUser,
    handleDismissReport,
  } = useReportedUsersPage(lang);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">👤</span>
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
      userEmail={staff?.email || 'editor@thulobazaar.com.np'}
      navSections={getEditorNavSections(lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reported Users</h1>
            <p className="text-gray-600 mt-1">Review and manage user reports from chat</p>
          </div>
        </div>

        {/* Tabs */}
        <TabsBar activeTab={activeTab} tabCounts={tabCounts} onTabChange={handleTabChange} />

        {/* Stats - Only show for pending tab */}
        {activeTab === 'pending' && <StatsCards tabCounts={tabCounts} filteredReports={reports} />}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <EditorSearchBar
            value={searchTerm}
            onSearch={handleSearch}
            placeholder="Search by user name, reporter, email, or reason..."
          />
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4 animate-bounce">👤</div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">
                {activeTab === 'pending' ? '✅' : activeTab === 'resolved' ? '🚫' : '📋'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'pending'
                  ? 'No pending user reports'
                  : activeTab === 'resolved'
                  ? 'No suspended users yet'
                  : 'No dismissed reports'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending'
                  ? 'All user reports have been reviewed'
                  : activeTab === 'resolved'
                  ? 'Suspended users from reports will appear here'
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
                onSuspendUser={handleSuspendUser}
                onDismissReport={handleDismissReport}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
