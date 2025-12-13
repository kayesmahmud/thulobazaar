'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { CreateEditorModal } from '@/components/admin/editors/CreateEditorModal';
import { EditEditorModal } from '@/components/admin/editors/EditEditorModal';
import { useEditors } from './useEditors';
import { StatsCards, SearchFilters, EditorsTable } from './components';

export default function EditorsManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();

  const {
    staff,
    navSections,
    handleLogout,
    editors,
    filteredEditors,
    loading,
    loadEditors,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    selectedEditor,
    setSelectedEditor,
    activeCount,
    suspendedCount,
    totalAdsApproved,
  } = useEditors(params.lang);

  if (loading) {
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
            <div className="text-lg font-semibold text-gray-700">Loading editors...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Admin User'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Editor Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage editor accounts, track their activities, and monitor performance
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Editor</span>
          </button>
        </div>
      </div>

      <StatsCards
        totalEditors={editors.length}
        activeCount={activeCount}
        suspendedCount={suspendedCount}
        totalAdsApproved={totalAdsApproved}
      />

      <SearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        totalEditors={editors.length}
        activeCount={activeCount}
        suspendedCount={suspendedCount}
      />

      <EditorsTable
        editors={filteredEditors}
        lang={params.lang}
        onEdit={(editor) => {
          setSelectedEditor(editor);
          setShowEditModal(true);
        }}
        onView={(editorId) => router.push(`/${params.lang}/super-admin/editors/${editorId}`)}
      />

      {/* Create Editor Modal */}
      <CreateEditorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadEditors();
        }}
      />

      {/* Edit Editor Modal */}
      <EditEditorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEditor(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedEditor(null);
          loadEditors();
        }}
        editor={selectedEditor}
      />
    </DashboardLayout>
  );
}
