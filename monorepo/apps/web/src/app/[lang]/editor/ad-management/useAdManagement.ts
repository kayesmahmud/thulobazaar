'use client';

import { useState, useCallback } from 'react';
import { getAds } from '@/lib/editorApi';
import { transformAd, type Ad, type TabStatus } from './types';

export function useAdManagement(initialPage: number = 1) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const loadAds = useCallback(async (activeTab: TabStatus, searchTerm: string, currentPage: number) => {
    try {
      setLoading(true);
      const includeDeleted = activeTab === 'deleted' ? 'only' : activeTab === 'all' ? 'true' : 'false';
      const status = activeTab === 'all' || activeTab === 'deleted' ? undefined : activeTab;

      const response = await getAds({
        status,
        includeDeleted,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      if (response.success && response.data) {
        setAds(response.data.map(transformAd));
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ads,
    loading,
    page,
    totalPages,
    setPage,
    loadAds,
  };
}
