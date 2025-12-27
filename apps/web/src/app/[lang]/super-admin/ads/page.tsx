'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin';
import { useSuperAdminAds } from './useSuperAdminAds';
import { StatsCards, SearchFilters, AdsTable } from './components';

export default function AdManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);

  const {
    staff,
    navSections,
    handleLogout,
    ads,
    loading,
    totalAds,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    loadAds,
    handleApprove,
    handleReject,
    actionLoading,
    pendingCount,
    approvedCount,
    rejectedCount,
  } = useSuperAdminAds(params.lang);

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
            <div className="text-lg font-semibold text-gray-700">Loading ads...</div>
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
      systemAlert={{ message: 'Storage: 86% used', type: 'warning' }}
      notificationCount={5}
      theme="superadmin"
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Ad Management
            </h1>
            <p className="text-gray-600 text-lg">
              Review, approve, reject, and manage all advertisements on the platform
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalAds={totalAds}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        rejectedCount={rejectedCount}
      />

      {/* Search and Filters */}
      <SearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(status) => {
          setStatusFilter(status);
          setPage(1);
        }}
        onSearch={loadAds}
      />

      {/* Ads Table */}
      <AdsTable
        ads={ads}
        lang={params.lang}
        page={page}
        totalPages={totalPages}
        totalAds={totalAds}
        actionLoading={actionLoading}
        onPageChange={setPage}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </DashboardLayout>
  );
}
