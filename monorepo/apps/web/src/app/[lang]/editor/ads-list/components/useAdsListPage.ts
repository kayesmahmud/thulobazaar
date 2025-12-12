'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import type { Ad, TabStatus, SuspendModalData, DeleteModalData } from './types';

const LIMIT = 20;

export function useAdsListPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [suspendModal, setSuspendModal] = useState<SuspendModalData | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalData | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  const loadAds = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * LIMIT;

      let statusParam = 'all';
      let includeDeleted = 'false';

      if (activeTab === 'deleted') {
        statusParam = 'all';
        includeDeleted = 'only';
      } else if (activeTab === 'all') {
        statusParam = 'all';
        includeDeleted = 'false';
      } else {
        statusParam = activeTab;
        includeDeleted = 'false';
      }

      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads?status=${statusParam}&includeDeleted=${includeDeleted}&limit=${LIMIT}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setAds(data.data);
        setTotal(data.pagination?.total || data.data.length);
      } else {
        setAds([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      setAds([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }
    loadAds();
  }, [authLoading, staff, isEditor, lang, router, loadAds]);

  const handleSuspend = async () => {
    if (!suspendModal || !suspendModal.reason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${suspendModal.ad.id}/suspend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: suspendModal.reason }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad suspended successfully!');
        setSuspendModal(null);
        loadAds();
      } else {
        alert(data.message || 'Failed to suspend ad');
      }
    } catch (error) {
      console.error('Error suspending ad:', error);
      alert('Error suspending ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (adId: number) => {
    if (!confirm('Are you sure you want to unsuspend this ad?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${adId}/unsuspend`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad unsuspended successfully!');
        loadAds();
      } else {
        alert(data.message || 'Failed to unsuspend ad');
      }
    } catch (error) {
      console.error('Error unsuspending ad:', error);
      alert('Error unsuspending ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (adId: number) => {
    if (!confirm('Are you sure you want to restore this ad?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${adId}/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad restored successfully!');
        loadAds();
      } else {
        alert(data.message || 'Failed to restore ad');
      }
    } catch (error) {
      console.error('Error restoring ad:', error);
      alert('Error restoring ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftDelete = async (adId: number, adTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${adTitle}"? This can be restored later.`)) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${adId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: 'Soft deleted by editor' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad deleted successfully (can be restored)');
        loadAds();
      } else {
        alert(data.message || 'Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteModal) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${deleteModal.ad.id}/permanent`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: deleteModal.reason || 'Permanently deleted by editor' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad permanently deleted! This action cannot be undone.');
        setDeleteModal(null);
        loadAds();
      } else {
        alert(data.message || 'Failed to permanently delete ad');
      }
    } catch (error) {
      console.error('Error permanently deleting ad:', error);
      alert('Error permanently deleting ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    loadAds();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return {
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
  };
}
