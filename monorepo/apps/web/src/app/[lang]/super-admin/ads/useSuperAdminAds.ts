'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/navigation';
import type { Ad, StatusFilter } from './types';

export interface UseSuperAdminAdsReturn {
  // Auth
  staff: ReturnType<typeof useStaffAuth>['staff'];
  navSections: ReturnType<typeof getSuperAdminNavSections>;
  handleLogout: () => Promise<void>;

  // Data
  ads: Ad[];
  loading: boolean;
  totalAds: number;
  totalPages: number;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  page: number;
  setPage: (page: number) => void;

  // Actions
  loadAds: () => void;
  handleApprove: (adId: number) => Promise<void>;
  handleReject: (adId: number) => Promise<void>;
  actionLoading: number | null;

  // Counts
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export function useSuperAdminAds(lang: string): UseSuperAdminAdsReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams?.get('status') as StatusFilter) || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const navSections = useMemo(() => getSuperAdminNavSections(lang), [lang]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadAds = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.getEditorAds({
        status: statusFilter,  // Pass 'all' explicitly to get all statuses
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        location: locationFilter || undefined,
        page,
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'DESC',
        includeDeleted: 'false',
      });

      console.log('📊 [SuperAdmin Ads] API Response:', response);
      if (response.success) {
        // API returns { success, data: [...ads], pagination: {...} }
        const ads = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        const pagination = response.pagination || response.data?.pagination;
        console.log('📊 [SuperAdmin Ads] Parsed ads:', ads?.length, 'pagination:', pagination);
        setAds(ads);
        setTotalPages(pagination?.totalPages || Math.ceil((pagination?.total || 0) / 20) || 1);
        setTotalAds(pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, categoryFilter, locationFilter, page]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    loadAds();
  }, [authLoading, staff, isSuperAdmin, lang, router, loadAds]);

  const handleApprove = async (adId: number) => {
    if (!confirm('Are you sure you want to approve this ad?')) return;

    try {
      setActionLoading(adId);
      const response = await apiClient.approveAd(adId);

      if (response.success) {
        loadAds();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve ad');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (adId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setActionLoading(adId);
      const response = await apiClient.rejectAd(adId, reason);

      if (response.success) {
        loadAds();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject ad');
    } finally {
      setActionLoading(null);
    }
  };

  // Count ads by status
  const pendingCount = ads.filter((ad) => ad.status === 'pending').length;
  const approvedCount = ads.filter((ad) => ad.status === 'approved').length;
  const rejectedCount = ads.filter((ad) => ad.status === 'rejected').length;

  return {
    staff,
    navSections,
    handleLogout,
    ads,
    loading: authLoading || loading,
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
  };
}
