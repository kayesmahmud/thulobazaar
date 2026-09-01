'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { RevokeDirectEditModal } from '@/components/editor';
import { getEditorNavSections } from '@/lib/navigation';
import { useUserManagement } from './useUserManagement';
import {
  StatsCards,
  FilterBar,
  UsersTable,
  SuspendModal,
} from './components';

export default function UserManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();

  const {
    staff,
    handleLogout,
    users,
    stats,
    loading,
    actionLoading,
    page,
    setPage,
    totalPages,
    searchTerm,
    handleSearch,
    statusFilter,
    setStatusFilter,
    selectedUser,
    showSuspendModal,
    suspendReason,
    setSuspendReason,
    suspendDuration,
    setSuspendDuration,
    openSuspendModal,
    closeSuspendModal,
    handleSuspend,
    handleUnsuspend,
    revokeTargetUser,
    openRevokeDirectEditModal,
    closeRevokeDirectEditModal,
    handleRevokeDirectEdit,
    handleRestoreDirectEdit,
  } = useUserManagement(params.lang);

  if (loading) {
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
            <div className="text-lg font-semibold text-gray-700">Loading users...</div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage and monitor platform users</p>
          </div>
        </div>

        {/* Stats */}
        <StatsCards
          total={stats.total}
          active={stats.active}
          suspended={stats.suspended}
          verified={stats.verified}
        />

        {/* Filters */}
        <FilterBar
          searchTerm={searchTerm}
          onSearch={handleSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Users Table */}
        <UsersTable
          users={users}
          lang={params.lang}
          actionLoading={actionLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSuspend={openSuspendModal}
          onUnsuspend={handleUnsuspend}
          onRevokeDirectEdit={openRevokeDirectEditModal}
          onRestoreDirectEdit={handleRestoreDirectEdit}
        />
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <SuspendModal
          user={selectedUser}
          reason={suspendReason}
          onReasonChange={setSuspendReason}
          duration={suspendDuration}
          onDurationChange={setSuspendDuration}
          loading={actionLoading}
          onClose={closeSuspendModal}
          onConfirm={handleSuspend}
        />
      )}

      {/* Revoke Direct Publish Modal */}
      {revokeTargetUser && (
        <RevokeDirectEditModal
          userName={revokeTargetUser.business_name || revokeTargetUser.full_name}
          onConfirm={handleRevokeDirectEdit}
          onCancel={closeRevokeDirectEditModal}
        />
      )}
    </DashboardLayout>
  );
}
