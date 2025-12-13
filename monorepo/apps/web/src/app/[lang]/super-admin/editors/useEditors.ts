'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/navigation';
import type { Editor, StatusFilter } from './types';
import { transformBackendEditor } from './types';

export interface UseEditorsReturn {
  // Auth
  staff: ReturnType<typeof useStaffAuth>['staff'];
  navSections: ReturnType<typeof getSuperAdminNavSections>;
  handleLogout: () => Promise<void>;

  // Data
  editors: Editor[];
  filteredEditors: Editor[];
  loading: boolean;
  loadEditors: () => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;

  // Modals
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  selectedEditor: Editor | null;
  setSelectedEditor: (editor: Editor | null) => void;

  // Stats
  activeCount: number;
  suspendedCount: number;
  totalAdsApproved: number;
}

export function useEditors(lang: string): UseEditorsReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [editors, setEditors] = useState<Editor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);

  const navSections = useMemo(
    () => getSuperAdminNavSections(lang, { editors: editors.length }),
    [lang, editors.length]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadEditors = useCallback(async () => {
    try {
      const response = await apiClient.getEditors();
      if (response.success && response.data) {
        const transformedEditors = response.data.map(transformBackendEditor);
        setEditors(transformedEditors);
      }
    } catch (error) {
      console.error('Error loading editors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    loadEditors();
  }, [authLoading, staff, isSuperAdmin, lang, router, loadEditors]);

  const filteredEditors = useMemo(() => {
    return editors.filter((editor) => {
      const matchesSearch =
        editor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        editor.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || editor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [editors, searchQuery, statusFilter]);

  const activeCount = editors.filter((e) => e.status === 'active').length;
  const suspendedCount = editors.filter((e) => e.status === 'suspended').length;
  const totalAdsApproved = editors.reduce((sum, e) => sum + e.stats.adsApproved, 0);

  return {
    staff,
    navSections,
    handleLogout,
    editors,
    filteredEditors,
    loading: authLoading || loading,
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
  };
}
