'use client';

import { useState, useCallback } from 'react';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UseChangePasswordReturn {
  // State
  passwordData: PasswordData;
  error: string;
  success: string;
  isChanging: boolean;

  // Actions
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  changePassword: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  clearMessages: () => void;

  // Validation
  isValid: boolean;
}

const initialPasswordData: PasswordData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function useChangePassword(): UseChangePasswordReturn {
  const [passwordData, setPasswordData] = useState<PasswordData>(initialPasswordData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const setCurrentPassword = useCallback((value: string) => {
    setPasswordData(prev => ({ ...prev, currentPassword: value }));
  }, []);

  const setNewPassword = useCallback((value: string) => {
    setPasswordData(prev => ({ ...prev, newPassword: value }));
  }, []);

  const setConfirmPassword = useCallback((value: string) => {
    setPasswordData(prev => ({ ...prev, confirmPassword: value }));
  }, []);

  const changePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsChanging(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password changed successfully!');
        setPasswordData(initialPasswordData);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setIsChanging(false);
    }
  }, [passwordData]);

  const reset = useCallback(() => {
    setPasswordData(initialPasswordData);
    setError('');
    setSuccess('');
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const isValid = Boolean(
    passwordData.currentPassword &&
    passwordData.newPassword &&
    passwordData.confirmPassword
  );

  return {
    passwordData,
    error,
    success,
    isChanging,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    changePassword,
    reset,
    clearMessages,
    isValid,
  };
}
