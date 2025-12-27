import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { SuperAdmin, FormData } from './types';

interface UseEditSuperAdminFormProps {
  superAdmin: SuperAdmin | null;
  onSuccess: () => void;
  onClose: () => void;
}

const initialFormData: FormData = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function useEditSuperAdminForm({ superAdmin, onSuccess, onClose }: UseEditSuperAdminFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form when superAdmin changes
  useEffect(() => {
    if (superAdmin) {
      setFormData({
        fullName: superAdmin.full_name,
        email: superAdmin.email,
        password: '',
        confirmPassword: '',
      });
    }
  }, [superAdmin]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password is optional for editing
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !superAdmin) {
      return;
    }

    setLoading(true);

    try {
      // Prepare update data - only include changed fields (2FA is handled separately)
      const updateData: Record<string, string> = {};
      if (formData.fullName !== superAdmin.full_name) updateData.full_name = formData.fullName;
      if (formData.email !== superAdmin.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;

      // Call API to update super admin
      const response = await apiClient.updateSuperAdmin(superAdmin.id, updateData);

      if (response.success) {
        // Reset form
        setFormData(initialFormData);
        setErrors({});
        onSuccess();
        onClose();
      } else {
        setErrors({ submit: response.message || 'Failed to update super admin. Please try again.' });
      }
    } catch (error: any) {
      console.error('Error updating super admin:', error);
      setErrors({ submit: error.response?.data?.message || error.message || 'Failed to update super admin. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [validateForm, superAdmin, formData, onSuccess, onClose]);

  const updateFormData = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    formData,
    loading,
    errors,
    setErrors,
    handleSubmit,
    updateFormData,
  };
}
