'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/navigation';
import { useAdActions } from '@/hooks/useAdActions';
import { RejectAdModal, SuspendAdModal, PermanentDeleteAdModal } from '@/components/editor';
import { AdTabs, AdSearchBar, AdsList, Pagination } from './components';
import { useAdManagement } from './useAdManagement';
import type { Ad, TabStatus } from './types';

export default function AdManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { staff, isLoading: authLoading, logout } = useStaffAuth();

  // Read initial values from URL
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialTab = (searchParams.get('status') as TabStatus) || 'pending';
  const initialSearch = searchParams.get('search') || '';

  const { ads, loading, page, totalPages, setPage, loadAds } = useAdManagement(initialPage);

  const [activeTab, setActiveTab] = useState<TabStatus>(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  // Update URL when filters change
  const updateUrl = useCallback((newPage: number, newTab: TabStatus, newSearch: string) => {
    const urlParams = new URLSearchParams();
    if (newPage > 1) urlParams.set('page', newPage.toString());
    if (newTab !== 'pending') urlParams.set('status', newTab);
    if (newSearch) urlParams.set('search', newSearch);
    const queryString = urlParams.toString();
    router.push(`/${params.lang}/editor/ad-management${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [router, params.lang]);

  // Handle page change with URL update
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    updateUrl(newPage, activeTab, searchTerm);
  }, [setPage, updateUrl, activeTab, searchTerm]);

  // Handle tab change with URL update
  const handleTabChange = useCallback((newTab: TabStatus) => {
    setActiveTab(newTab);
    setPage(1);
    updateUrl(1, newTab, searchTerm);
  }, [setPage, updateUrl, searchTerm]);

  // Handle search change with URL update (debounced effect handles the actual search)
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearchTerm(newSearch);
  }, []);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const reloadAds = useCallback(() => {
    loadAds(activeTab, searchTerm, page);
  }, [loadAds, activeTab, searchTerm, page]);

  const actions = useAdActions(reloadAds);

  useEffect(() => {
    if (staff) {
      loadAds(activeTab, searchTerm, page);
    }
  }, [staff, activeTab, searchTerm, page, loadAds]);

  // Update URL when search changes (with debounce effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== initialSearch) {
        setPage(1);
        updateUrl(1, activeTab, searchTerm);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, initialSearch, activeTab, setPage, updateUrl]);

  // Modal handlers
  const openRejectModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowRejectModal(true);
  };

  const openSuspendModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowSuspendModal(true);
  };

  const openPermanentDeleteModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowPermanentDeleteModal(true);
  };

  const closeModals = () => {
    setShowRejectModal(false);
    setShowSuspendModal(false);
    setShowPermanentDeleteModal(false);
    setSelectedAd(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="w-10 h-10 text-white" />
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
            <h1 className="text-3xl font-bold text-gray-900">Ad Management</h1>
            <p className="text-gray-600 mt-1">Review and manage classified ads</p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <AdTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Search */}
        <AdSearchBar value={searchTerm} onChange={handleSearchChange} />

        {/* Ads List */}
        <AdsList
          ads={ads}
          activeTab={activeTab}
          searchTerm={searchTerm}
          lang={params.lang}
          actions={actions}
          onReject={openRejectModal}
          onSuspend={openSuspendModal}
          onPermanentDelete={openPermanentDeleteModal}
        />

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      {/* Modals */}
      {showRejectModal && selectedAd && (
        <RejectAdModal
          adTitle={selectedAd.title}
          onConfirm={async (reason) => {
            await actions.handleReject(selectedAd.id, reason);
            closeModals();
          }}
          onCancel={closeModals}
        />
      )}

      {showSuspendModal && selectedAd && (
        <SuspendAdModal
          adTitle={selectedAd.title}
          onConfirm={async (reason, duration) => {
            await actions.handleSuspend(selectedAd.id, reason, duration);
            closeModals();
          }}
          onCancel={closeModals}
        />
      )}

      {showPermanentDeleteModal && selectedAd && (
        <PermanentDeleteAdModal
          adTitle={selectedAd.title}
          onConfirm={async (reason) => {
            await actions.handlePermanentDelete(selectedAd.id, reason);
            closeModals();
          }}
          onCancel={closeModals}
        />
      )}
    </DashboardLayout>
  );
}
