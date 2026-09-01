'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, FileClock } from 'lucide-react';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/navigation';
import { useAdActions } from '@/hooks/useAdActions';
import {
  RejectAdModal,
  SuspendAdModal,
  PermanentDeleteAdModal,
  AdHistoryModal,
  EditHistoryModal,
  RecentOwnerEditsModal,
  EditorSearchBar,
} from '@/components/editor';
import { AdTabs, AdsList, Pagination } from './components';
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

  // Search runs only on an explicit submit (Search button / Enter), never per keystroke
  const handleSearch = useCallback((newSearch: string) => {
    setSearchTerm(newSearch);
    setPage(1);
    updateUrl(1, activeTab, newSearch);
  }, [setPage, updateUrl, activeTab]);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [showOwnerEditsModal, setShowOwnerEditsModal] = useState(false);

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

  const openHistoryModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowHistoryModal(true);
  };

  const openEditHistoryModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowEditHistoryModal(true);
  };

  const closeModals = () => {
    setShowRejectModal(false);
    setShowSuspendModal(false);
    setShowPermanentDeleteModal(false);
    setShowHistoryModal(false);
    setShowEditHistoryModal(false);
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
      userEmail={staff?.email || 'editor@thulobazaar.com.np'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ad Management</h1>
          <p className="text-gray-600 mt-1">Review and manage classified ads</p>
        </div>

        {/* Tabs + Owner edits feed */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <AdTabs activeTab={activeTab} onTabChange={handleTabChange} />
          <button
            onClick={() => setShowOwnerEditsModal(true)}
            className="px-4 py-2 bg-white border border-gray-200 shadow-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
          >
            <FileClock size={16} />
            Owner Edits
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <EditorSearchBar
            value={searchTerm}
            onSearch={handleSearch}
            placeholder="Search ads by title, description, seller..."
          />
        </div>

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
          onHistory={openHistoryModal}
          onEditHistory={openEditHistoryModal}
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

      {showHistoryModal && selectedAd && (
        <AdHistoryModal
          adId={selectedAd.id}
          adTitle={selectedAd.title}
          onClose={closeModals}
        />
      )}

      {showEditHistoryModal && selectedAd && (
        <EditHistoryModal
          adId={selectedAd.id}
          adTitle={selectedAd.title}
          onClose={closeModals}
        />
      )}

      {showOwnerEditsModal && (
        <RecentOwnerEditsModal
          lang={params.lang}
          onClose={() => setShowOwnerEditsModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
