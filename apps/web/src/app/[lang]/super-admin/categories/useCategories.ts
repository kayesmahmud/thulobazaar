'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSession } from 'next-auth/react';
import type { Category, CategoryFormData } from './types';
import { DEFAULT_FORM_DATA, generateSlug } from './types';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  authLoading: boolean;
  staff: ReturnType<typeof useStaffAuth>['staff'];
  error: string;
  success: string;
  showModal: boolean;
  editingCategory: Category | null;
  formData: CategoryFormData;
  parentCategories: Category[];
  getSubcategories: (parentId: number) => Category[];
  handleOpenModal: (category?: Category) => void;
  handleCloseModal: () => void;
  handleNameChange: (name: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: (category: Category) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export function useCategories(lang: string): UseCategoriesReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(DEFAULT_FORM_DATA);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthToken = async () => {
    const session = await getSession();
    if (!session) return null;
    return session?.user?.backendToken || (session as any)?.backendToken || null;
  };

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setCategories(data.data);
      } else {
        throw new Error(data.error || 'Failed to load categories');
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setError(error.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadCategories();
    }
  }, [authLoading, staff, isSuperAdmin, lang, router, loadCategories]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        icon: category.icon || '',
        parent_id: category.parent_id?.toString() || '',
        form_template: category.form_template || ''
      });
    } else {
      setEditingCategory(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(DEFAULT_FORM_DATA);
    setError('');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const data = {
        name: formData.name,
        slug: formData.slug,
        icon: formData.icon || undefined,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined,
        form_template: formData.form_template || undefined
      };

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
      }

      setSuccess(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      await loadCategories();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      setError('');
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete category');
      }

      setSuccess('Category deleted successfully');
      await loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      setTimeout(() => setError(''), 5000);
    }
  };

  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: number) => categories.filter(c => c.parent_id === parentId);

  return {
    categories,
    loading,
    authLoading,
    staff,
    error,
    success,
    showModal,
    editingCategory,
    formData,
    parentCategories,
    getSubcategories,
    handleOpenModal,
    handleCloseModal,
    handleNameChange,
    setFormData,
    handleSubmit,
    handleDelete,
    handleLogout,
  };
}
