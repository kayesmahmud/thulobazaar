'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getUsers, suspendUser, unsuspendUser, setDirectEditPrivilege } from '@/lib/editorApi';
import type { UserManagementStats } from '@/lib/editorApi';
import type { User, StatusFilter } from './types';

const EMPTY_STATS: UserManagementStats = { total: 0, active: 0, suspended: 0, verified: 0 };

interface UseUserManagementReturn {
  // Auth
  staff: ReturnType<typeof useStaffAuth>['staff'];
  handleLogout: () => Promise<void>;

  // Data
  users: User[];
  stats: UserManagementStats;
  loading: boolean;
  actionLoading: boolean;

  // Pagination
  page: number;
  setPage: (page: number) => void;
  totalPages: number;

  // Filters
  searchTerm: string;
  /** Commit a search term (explicit submit) and jump back to page 1. */
  handleSearch: (term: string) => void;
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

  // Direct-publish privilege
  revokeTargetUser: User | null;
  openRevokeDirectEditModal: (user: User) => void;
  closeRevokeDirectEditModal: () => void;
  handleRevokeDirectEdit: (reason: string) => Promise<void>;
  handleRestoreDirectEdit: (user: User) => Promise<void>;
}

export function useUserManagement(lang: string): UseUserManagementReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserManagementStats>(EMPTY_STATS);
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
  const [revokeTargetUser, setRevokeTargetUser] = useState<User | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

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
        if (response.stats) {
          setStats(response.stats);
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

  const openRevokeDirectEditModal = (user: User) => {
    setRevokeTargetUser(user);
  };

  const closeRevokeDirectEditModal = () => {
    setRevokeTargetUser(null);
  };

  // Merge the PUT response into local state — the users list endpoint doesn't
  // return direct_edit fields, so the response is our source of truth here.
  const applyDirectEditResult = (updated: {
    id: number;
    direct_edit_revoked: boolean;
    direct_edit_revoked_at: string | null;
    direct_edit_revoke_reason: string | null;
  }) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === updated.id
          ? {
              ...u,
              direct_edit_revoked: updated.direct_edit_revoked,
              direct_edit_revoked_at: updated.direct_edit_revoked_at,
              direct_edit_revoke_reason: updated.direct_edit_revoke_reason,
            }
          : u
      )
    );
  };

  const handleRevokeDirectEdit = async (reason: string) => {
    if (!revokeTargetUser || !reason.trim()) return;

    try {
      setActionLoading(true);
      const response = await setDirectEditPrivilege(revokeTargetUser.id, true, reason);

      if (response.success && response.data) {
        applyDirectEditResult(response.data);
        closeRevokeDirectEditModal();
      } else {
        alert(response.message || 'Failed to revoke direct publish');
      }
    } catch (error) {
      console.error('Error revoking direct publish:', error);
      alert('Error revoking direct publish');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreDirectEdit = async (user: User) => {
    if (!confirm(`Restore direct publish for ${user.full_name}?`)) return;

    try {
      setActionLoading(true);
      const response = await setDirectEditPrivilege(user.id, false);

      if (response.success && response.data) {
        applyDirectEditResult(response.data);
      } else {
        alert(response.message || 'Failed to restore direct publish');
      }
    } catch (error) {
      console.error('Error restoring direct publish:', error);
      alert('Error restoring direct publish');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    staff,
    handleLogout,
    users,
    stats,
    loading,
    actionLoading,
    page,
    setPage,
    totalPages,
    searchTerm,
    handleSearch,
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
    revokeTargetUser,
    openRevokeDirectEditModal,
    closeRevokeDirectEditModal,
    handleRevokeDirectEdit,
    handleRestoreDirectEdit,
  };
}
