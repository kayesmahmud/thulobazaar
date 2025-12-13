'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin';
import {
  useAnnouncementsPage,
  StatsCards,
  AnnouncementsTable,
  CreateModal,
  DetailModal,
} from './components';

export default function AnnouncementsPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: string }>;
}) {
  const params = use(paramsPromise);
  const lang = params.lang;

  const {
    staff,
    authLoading,
    loading,
    announcements,
    stats,
    navSections,
    showCreateModal,
    setShowCreateModal,
    showDetailModal,
    selectedAnnouncement,
    detailLoading,
    createForm,
    setCreateForm,
    creating,
    handleLogout,
    handleCreate,
    handleViewDetails,
    handleToggleActive,
    handleDelete,
    closeDetailModal,
  } = useAnnouncementsPage(lang);

  if (authLoading || loading) {
    return (
      <DashboardLayout
        lang={lang}
        userName={staff?.fullName || 'Super Admin'}
        userEmail={staff?.email || 'admin@thulobazaar.com'}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading announcements...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={lang}
      userName={staff?.fullName || 'Super Admin'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Broadcast Announcements</h1>
            <p className="text-gray-600 mt-1">Send announcements to all users or specific groups</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> New Announcement
          </button>
        </div>

        {/* Stats */}
        <StatsCards
          total={stats.total}
          active={stats.active}
          totalReach={stats.totalReach}
          totalReads={stats.totalReads}
        />

        {/* Announcements Table */}
        <AnnouncementsTable
          announcements={announcements}
          onViewDetails={handleViewDetails}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
        />

        {/* Create Modal */}
        {showCreateModal && (
          <CreateModal
            form={createForm}
            setForm={setCreateForm}
            creating={creating}
            onSubmit={handleCreate}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {/* Detail Modal */}
        {showDetailModal && (
          <DetailModal
            announcement={selectedAnnouncement}
            loading={detailLoading}
            onClose={closeDetailModal}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
