'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';
import type { VerificationPricing, EditForm } from './types';
import { DEFAULT_EDIT_FORM } from './types';

export interface UseVerificationPricingReturn {
  // Auth & nav
  staff: ReturnType<typeof useStaffAuth>['staff'];
  authLoading: boolean;
  navSections: ReturnType<typeof getSuperAdminNavSections>;
  handleLogout: () => Promise<void>;

  // Data
  pricings: VerificationPricing[];
  loading: boolean;
  saving: boolean;
  groupedPricings: Record<string, VerificationPricing[]>;

  // Editing
  editingId: number | null;
  editForm: EditForm;
  handleEdit: (pricing: VerificationPricing) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: (id: number) => Promise<void>;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
}

export function useVerificationPricing(lang: string): UseVerificationPricingReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [pricings, setPricings] = useState<VerificationPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(DEFAULT_EDIT_FORM);
  const [saving, setSaving] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const navSections = useMemo(() => getSuperAdminNavSections(lang), [lang]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/admin/verification-pricing', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setPricings(data.data.pricings);
      }
    } catch (error) {
      console.error('Error loading verification pricing:', error);
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

    loadData();
  }, [authLoading, staff, isSuperAdmin, lang, router, loadData]);

  const handleEdit = (pricing: VerificationPricing) => {
    setEditingId(pricing.id);
    setEditForm({
      price: pricing.price,
      isActive: pricing.isActive,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(DEFAULT_EDIT_FORM);
  };

  const handleSaveEdit = async (id: number) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/admin/verification-pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          price: editForm.price,
          isActive: editForm.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        loadData();
      } else {
        alert('Failed to update pricing: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      alert('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  // Group pricings by verification type
  const groupedPricings = useMemo(() => {
    return pricings.reduce((acc, pricing) => {
      if (!acc[pricing.verificationType]) {
        acc[pricing.verificationType] = [];
      }
      acc[pricing.verificationType]!.push(pricing);
      return acc;
    }, {} as Record<string, VerificationPricing[]>);
  }, [pricings]);

  return {
    staff,
    authLoading,
    navSections,
    handleLogout,
    pricings,
    loading,
    saving,
    groupedPricings,
    editingId,
    editForm,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    setEditForm,
  };
}
