'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { StatsCards, SearchBar, VerificationTable, SuspendedTable } from './components';
import { useVerifications } from './useVerifications';
import { filterBySearch, filterSuspendedBySearch, type TabType, type TabConfig } from './types';

export default function VerificationsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    pendingVerifications,
    verifiedBusiness,
    verifiedIndividual,
    suspendedRejected,
    verificationStats,
    loading,
    loadData,
  } = useVerifications();

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadData();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadData]);

  const navSections = getSuperAdminNavSections(params.lang);

  const tabCounts = {
    pending: verificationStats.pending || pendingVerifications.length,
    verifiedBusiness: verificationStats.verifiedBusiness || verifiedBusiness.length,
    verifiedIndividual: verificationStats.verifiedIndividual || verifiedIndividual.length,
    suspendedRejected: verificationStats.suspendedRejected || suspendedRejected.length,
  };

  const tabs: TabConfig[] = [
    { id: 'pending', label: 'Pending', count: tabCounts.pending, icon: '⏳', color: 'amber' },
    { id: 'verified-business', label: 'Verified Business', count: tabCounts.verifiedBusiness, icon: '👔', color: 'blue' },
    { id: 'verified-individual', label: 'Verified Individual', count: tabCounts.verifiedIndividual, icon: '👤', color: 'emerald' },
    { id: 'suspended-rejected', label: 'Suspended/Rejected', count: tabCounts.suspendedRejected, icon: '🚫', color: 'rose' },
  ];

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
            <div className="text-lg font-semibold text-gray-700">Loading verifications...</div>
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Verification Overview
        </h1>
        <p className="text-gray-600 text-lg">
          View all verification requests and account statuses (read-only)
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Content based on active tab */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {activeTab === 'pending' && (
          <VerificationTable
            verifications={filterBySearch(pendingVerifications, searchQuery)}
            title="Pending Verification Requests"
            emptyMessage="No pending verifications"
            showStatus
          />
        )}

        {activeTab === 'verified-business' && (
          <VerificationTable
            verifications={filterBySearch(verifiedBusiness, searchQuery)}
            title="Verified Business Accounts"
            emptyMessage="No verified business accounts"
          />
        )}

        {activeTab === 'verified-individual' && (
          <VerificationTable
            verifications={filterBySearch(verifiedIndividual, searchQuery)}
            title="Verified Individual Accounts"
            emptyMessage="No verified individual accounts"
          />
        )}

        {activeTab === 'suspended-rejected' && (
          <SuspendedTable users={filterSuspendedBySearch(suspendedRejected, searchQuery)} />
        )}
      </div>
    </DashboardLayout>
  );
}
