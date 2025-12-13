'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';
import type { Announcement, AnnouncementDetail, CreateFormData } from './types';

const INITIAL_FORM: CreateFormData = {
  title: '',
  content: '',
  targetAudience: 'all_users',
  expiresAt: '',
};

export function useAnnouncementsPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);

  const navSections = useMemo(() => getSuperAdminNavSections(lang), [lang]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/super-admin/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
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

    loadAnnouncements();
  }, [authLoading, staff, isSuperAdmin, lang, router, loadAnnouncements]);

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      alert('Title and content are required');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/super-admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setCreateForm(INITIAL_FORM);
        loadAnnouncements();
      } else {
        alert(data.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetails = async (announcement: Announcement) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch(`/api/super-admin/announcements/${announcement.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSelectedAnnouncement(data.data);
      }
    } catch (error) {
      console.error('Failed to load announcement details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const token = localStorage.getItem('editorToken');

      const response = await fetch(`/api/super-admin/announcements/${announcement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !announcement.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        loadAnnouncements();
      }
    } catch (error) {
      console.error('Failed to toggle announcement status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('editorToken');

      const response = await fetch(`/api/super-admin/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        loadAnnouncements();
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAnnouncement(null);
  };

  // Stats
  const stats = useMemo(() => ({
    total: announcements.length,
    active: announcements.filter((a) => a.isActive).length,
    totalReach: announcements.reduce((sum, a) => sum + a.stats.totalAudience, 0),
    totalReads: announcements.reduce((sum, a) => sum + a.stats.readCount, 0),
  }), [announcements]);

  return {
    staff,
    authLoading,
    loading,
    announcements,
    stats,
    navSections,
    showCreateModal,
    setShowCreateModal,
    showDetailModal,
    selectedAnnouncement,
    detailLoading,
    createForm,
    setCreateForm,
    creating,
    handleLogout,
    handleCreate,
    handleViewDetails,
    handleToggleActive,
    handleDelete,
    closeDetailModal,
  };
}
