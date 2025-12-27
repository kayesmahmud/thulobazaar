'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getUsers, suspendUser, unsuspendUser } from '@/lib/editorApi';
import type { User, StatusFilter } from './types';

interface UseUserManagementReturn {
  // Auth
  staff: ReturnType<typeof useStaffAuth>['staff'];
  handleLogout: () => Promise<void>;

  // Data
  users: User[];
  loading: boolean;
  actionLoading: boolean;

  // Pagination
  page: number;
  setPage: (page: number) => void;
  totalPages: number;

  // Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;

  // Modal
  selectedUser: User | null;
  showSuspendModal: boolean;
  suspendReason: string;
  setSuspendReason: (reason: string) => void;
  suspendDuration: number | undefined;
  setSuspendDuration: (duration: number | undefined) => void;

  // Actions
  openSuspendModal: (user: User) => void;
  closeSuspendModal: () => void;
  handleSuspend: () => Promise<void>;
  handleUnsuspend: (user: User) => Promise<void>;
}

export function useUserManagement(lang: string): UseUserManagementReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState<number | undefined>(undefined);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUsers<User>(undefined, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });

      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }
    loadUsers();
  }, [authLoading, staff, isEditor, lang, router, loadUsers]);

  const openSuspendModal = (user: User) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const closeSuspendModal = () => {
    setShowSuspendModal(false);
    setSuspendReason('');
    setSuspendDuration(undefined);
    setSelectedUser(null);
  };

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    try {
      setActionLoading(true);
      const response = await suspendUser(
        selectedUser.id,
        suspendReason,
        suspendDuration
      );

      if (response.success) {
        alert('User suspended successfully!');
        closeSuspendModal();
        loadUsers();
      } else {
        alert('Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (user: User) => {
    if (!confirm(`Are you sure you want to unsuspend ${user.full_name}?`)) return;

    try {
      setActionLoading(true);
      const response = await unsuspendUser(user.id);

      if (response.success) {
        alert('User unsuspended successfully!');
        loadUsers();
      } else {
        alert('Failed to unsuspend user');
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Error unsuspending user');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    staff,
    handleLogout,
    users,
    loading,
    actionLoading,
    page,
    setPage,
    totalPages,
    searchTerm,
    setSearchTerm,
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
  };
}
