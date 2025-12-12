'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout, StatsCard } from '@/components/admin';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';
import {
  useEditorDetailPage,
  EditorProfile,
  TimeFilter,
  EditorTabs,
  ActivitySummary,
  SuspendModal,
  DeleteModal,
} from './components';

export default function EditorDetailPage({ params: paramsPromise }: { params: Promise<{ lang: string; id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();

  const lang = params.lang;
  const editorId = parseInt(params.id);

  const {
    staff,
    authLoading,
    handleLogout,
    editor,
    loading,
    activeTab,
    setActiveTab,
    showSuspendModal,
    setShowSuspendModal,
    showDeleteModal,
    setShowDeleteModal,
    pendingMonth,
    setPendingMonth,
    pendingYear,
    setPendingYear,
    monthOptions,
    yearOptions,
    handleSuspend,
    handleDelete,
    handleApplyFilter,
  } = useEditorDetailPage(lang, editorId);

  const navSections = getSuperAdminNavSections(lang, {
    pendingAds: 23,
    editors: 5,
    verifications: 15,
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading editor details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <DashboardLayout
        lang={lang}
        userName={staff?.fullName || 'Admin User'}
        userEmail={staff?.email || 'admin@thulobazaar.com'}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Editor Not Found</h2>
          <p className="text-gray-600 mb-6">The editor you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push(`/${lang}/super-admin/editors`)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Back to Editors
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={lang}
      userName={staff?.fullName || 'Admin User'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/${lang}/super-admin/editors`)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Editors
        </button>
      </div>

      {/* Editor Profile Header */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-8 mb-8">
        <TimeFilter
          monthLabel={editor.monthLabel}
          pendingMonth={pendingMonth}
          setPendingMonth={setPendingMonth}
          pendingYear={pendingYear}
          setPendingYear={setPendingYear}
          monthOptions={monthOptions}
          yearOptions={yearOptions}
          onApply={handleApplyFilter}
        />
        <EditorProfile
          editor={editor}
          onSuspend={() => setShowSuspendModal(true)}
          onDelete={() => setShowDeleteModal(true)}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Ads Approved"
          value={editor.stats.adsApproved}
          icon="✅"
          color="success"
          theme="superadmin"
        />
        <StatsCard
          title="Ads Rejected"
          value={editor.stats.adsRejected}
          icon="❌"
          color="danger"
          theme="superadmin"
        />
        <StatsCard
          title="Business Verified"
          value={editor.stats.businessApproved}
          icon="🏢"
          color="primary"
          theme="superadmin"
        />
        <StatsCard
          title="Individual Verified"
          value={editor.stats.individualApproved}
          icon="👤"
          color="primary"
          theme="superadmin"
        />
        <StatsCard
          title="Support Tickets"
          value={editor.stats.supportTickets}
          icon="🎫"
          color="warning"
          theme="superadmin"
        />
      </div>

      {/* Activity Summary */}
      <ActivitySummary timeBuckets={editor.timeBuckets} />

      {/* Tabs */}
      <EditorTabs
        editor={editor}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Modals */}
      {showSuspendModal && (
        <SuspendModal
          editor={editor}
          onConfirm={handleSuspend}
          onCancel={() => setShowSuspendModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          editorName={editor.fullName}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
