'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/editorNavigation';
import {
  useAdsListPage,
  AdCard,
  SuspendModal,
  DeleteModal,
  TabStatus,
} from './components';

export default function AdsListPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);

  const {
    staff,
    authLoading,
    handleLogout,
    ads,
    loading,
    activeTab,
    searchTerm,
    setSearchTerm,
    actionLoading,
    page,
    setPage,
    total,
    totalPages,
    suspendModal,
    setSuspendModal,
    deleteModal,
    setDeleteModal,
    handleSuspend,
    handleUnsuspend,
    handleRestore,
    handleSoftDelete,
    handlePermanentDelete,
    handleTabChange,
    handleSearch,
    handleClearSearch,
  } = useAdsListPage(params.lang);

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
            <div className="text-lg font-semibold text-gray-700">Loading ads...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">📋 All Ads Management</h1>
            <p className="text-gray-600 mt-1">Manage all ads: suspend, restore, or permanently delete</p>
          </div>
          <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
            Total: <span className="font-bold text-gray-900">{total}</span> ads
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex flex-wrap gap-1">
          {(['all', 'approved', 'pending', 'suspended', 'rejected', 'deleted'] as TabStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'all' && '📊 All'}
              {tab === 'approved' && '✅ Approved'}
              {tab === 'pending' && '⏳ Pending'}
              {tab === 'suspended' && '⏸️ Suspended'}
              {tab === 'rejected' && '❌ Rejected'}
              {tab === 'deleted' && '🗑️ Deleted'}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search ads by title, ID, or user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              🔍 Search
            </button>
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Ads List */}
        <div className="space-y-4">
          {ads.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No ads found</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : `No ${activeTab === 'all' ? '' : activeTab} ads at the moment`}
              </p>
            </div>
          ) : (
            ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                lang={params.lang}
                actionLoading={actionLoading}
                onSuspend={() => setSuspendModal({ ad, reason: '' })}
                onUnsuspend={() => handleUnsuspend(ad.id)}
                onRestore={() => handleRestore(ad.id)}
                onSoftDelete={() => handleSoftDelete(ad.id, ad.title)}
                onPermanentDelete={() => setDeleteModal({ ad, reason: '' })}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {ads.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {suspendModal && (
        <SuspendModal
          data={suspendModal}
          actionLoading={actionLoading}
          onReasonChange={(reason) => setSuspendModal({ ...suspendModal, reason })}
          onConfirm={handleSuspend}
          onCancel={() => setSuspendModal(null)}
        />
      )}

      {deleteModal && (
        <DeleteModal
          data={deleteModal}
          actionLoading={actionLoading}
          onReasonChange={(reason) => setDeleteModal({ ...deleteModal, reason })}
          onConfirm={handlePermanentDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </DashboardLayout>
  );
}
