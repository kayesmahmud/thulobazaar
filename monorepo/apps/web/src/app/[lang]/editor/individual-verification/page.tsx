'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/editorNavigation';
import {
  useIndividualVerificationPage,
  VerificationTabs,
  VerificationStats,
  VerificationCard,
  RejectModal,
} from './components';

export default function IndividualVerificationPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const {
    staff,
    authLoading,
    loading,
    verifications,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    selectedVerification,
    showRejectModal,
    rejectReason,
    setRejectReason,
    actionLoading,
    handleLogout,
    handleApprove,
    handleReject,
    openRejectModal,
    closeRejectModal,
  } = useIndividualVerificationPage(params.lang);

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
            <div className="text-lg font-semibold text-gray-700">Loading verifications...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Individual Verification</h1>
            <p className="text-gray-600 mt-1">
              Review and approve individual seller verification requests
            </p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <VerificationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          count={verifications.length}
        />

        {/* Stats */}
        <VerificationStats activeTab={activeTab} verifications={verifications} />

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search by name, email, or seller name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Verifications List */}
        <div className="space-y-4">
          {verifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">
                {activeTab === 'pending' ? '🪪' : activeTab === 'rejected' ? '📋' : '✅'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'pending' ? 'No pending verifications' :
                 activeTab === 'rejected' ? 'No rejected verifications' :
                 'No verified users yet'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending' ? 'All individual verification requests have been processed' :
                 activeTab === 'rejected' ? 'No individual verification applications have been rejected' :
                 'No users have been verified through individual verification'}
              </p>
            </div>
          ) : (
            verifications.map((verification) => (
              <VerificationCard
                key={verification.id}
                verification={verification}
                activeTab={activeTab}
                lang={params.lang}
                actionLoading={actionLoading}
                onApprove={handleApprove}
                onReject={openRejectModal}
              />
            ))
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <RejectModal
        show={showRejectModal}
        verification={selectedVerification}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        actionLoading={actionLoading}
        onClose={closeRejectModal}
        onReject={handleReject}
      />
    </DashboardLayout>
  );
}
