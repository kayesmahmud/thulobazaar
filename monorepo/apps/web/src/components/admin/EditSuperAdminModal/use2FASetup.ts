import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { SuperAdmin, TwoFactorState } from './types';

interface Use2FASetupProps {
  superAdmin: SuperAdmin | null;
  onSuccess: () => void;
  setErrors: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
}

export function use2FASetup({ superAdmin, onSuccess, setErrors }: Use2FASetupProps) {
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>({
    show2FASetup: false,
    qrCode: '',
    secret: '',
    verificationCode: '',
    backupCodes: [],
    showBackupCodes: false,
    twoFactorLoading: false,
    twoFactorEnabled: superAdmin?.two_factor_enabled || false,
  });

  const setTwoFactorEnabled = useCallback((enabled: boolean) => {
    setTwoFactorState(prev => ({ ...prev, twoFactorEnabled: enabled }));
  }, []);

  const handle2FAToggle = useCallback(async (enabled: boolean) => {
    if (!superAdmin) return;

    if (enabled) {
      // Enable 2FA - Show setup modal
      setTwoFactorState(prev => ({ ...prev, twoFactorLoading: true }));
      try {
        const response = await apiClient.setup2FA(superAdmin.id);
        if (response.success && response.data) {
          setTwoFactorState(prev => ({
            ...prev,
            qrCode: response.data!.qrCode,
            secret: response.data!.secret,
            show2FASetup: true,
            verificationCode: '',
            twoFactorLoading: false,
          }));
        } else {
          setErrors(prev => ({ ...prev, twoFactor: 'Failed to setup 2FA. Please try again.' }));
          setTwoFactorState(prev => ({ ...prev, twoFactorEnabled: false, twoFactorLoading: false }));
        }
      } catch (error: any) {
        console.error('Error setting up 2FA:', error);
        setErrors(prev => ({ ...prev, twoFactor: error.response?.data?.message || 'Failed to setup 2FA. Please try again.' }));
        setTwoFactorState(prev => ({ ...prev, twoFactorEnabled: false, twoFactorLoading: false }));
      }
    } else {
      // Disable 2FA - Confirm first
      if (confirm('Are you sure you want to disable 2FA? This will reduce account security.')) {
        setTwoFactorState(prev => ({ ...prev, twoFactorLoading: true }));
        try {
          const response = await apiClient.disable2FA(superAdmin.id);
          if (response.success) {
            setTwoFactorState(prev => ({ ...prev, twoFactorEnabled: false, twoFactorLoading: false }));
            onSuccess();
          } else {
            setErrors(prev => ({ ...prev, twoFactor: 'Failed to disable 2FA. Please try again.' }));
            setTwoFactorState(prev => ({ ...prev, twoFactorEnabled: true, twoFactorLoading: false }));
          }
        } catch (error: any) {
          console.error('Error disabling 2FA:', error);
          setErrors(prev => ({ ...prev, twoFactor: error.response?.data?.message || 'Failed to disable 2FA. Please try again.' }));
          setTwoFactorState(prev => ({ ...prev, twoFactorEnabled: true, twoFactorLoading: false }));
        }
      } else {
        setTwoFactorState(prev => ({ ...prev, twoFactorEnabled: true }));
      }
    }
  }, [superAdmin, onSuccess, setErrors]);

  const handleVerify2FA = useCallback(async () => {
    if (!superAdmin) return;

    if (!twoFactorState.verificationCode || twoFactorState.verificationCode.length !== 6) {
      setErrors(prev => ({ ...prev, verification: 'Please enter a valid 6-digit code' }));
      return;
    }

    setTwoFactorState(prev => ({ ...prev, twoFactorLoading: true }));
    try {
      const response = await apiClient.verify2FA(superAdmin.id, {
        secret: twoFactorState.secret,
        token: twoFactorState.verificationCode,
      });

      if (response.success && response.data) {
        setTwoFactorState(prev => ({
          ...prev,
          backupCodes: response.data!.backupCodes,
          show2FASetup: false,
          showBackupCodes: true,
          twoFactorEnabled: true,
          twoFactorLoading: false,
        }));
        onSuccess();
      } else {
        setErrors(prev => ({ ...prev, verification: (response as any).message || 'Invalid verification code. Please try again.' }));
        setTwoFactorState(prev => ({ ...prev, twoFactorLoading: false }));
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      setErrors(prev => ({ ...prev, verification: error.response?.data?.message || 'Invalid verification code. Please try again.' }));
      setTwoFactorState(prev => ({ ...prev, twoFactorLoading: false }));
    }
  }, [superAdmin, twoFactorState.verificationCode, twoFactorState.secret, onSuccess, setErrors]);

  const close2FASetup = useCallback(() => {
    setTwoFactorState(prev => ({
      ...prev,
      show2FASetup: false,
      qrCode: '',
      secret: '',
      verificationCode: '',
      twoFactorEnabled: superAdmin?.two_factor_enabled || false,
    }));
    setErrors(() => ({}));
  }, [superAdmin, setErrors]);

  const closeBackupCodes = useCallback(() => {
    setTwoFactorState(prev => ({
      ...prev,
      showBackupCodes: false,
      backupCodes: [],
    }));
  }, []);

  const copyBackupCodes = useCallback(() => {
    const text = twoFactorState.backupCodes.join('\n');
    navigator.clipboard.writeText(text);
  }, [twoFactorState.backupCodes]);

  const setVerificationCode = useCallback((code: string) => {
    setTwoFactorState(prev => ({ ...prev, verificationCode: code }));
  }, []);

  const syncTwoFactorEnabled = useCallback((enabled: boolean) => {
    setTwoFactorState(prev => ({ ...prev, twoFactorEnabled: enabled }));
  }, []);

  return {
    twoFactorState,
    setTwoFactorEnabled,
    handle2FAToggle,
    handleVerify2FA,
    close2FASetup,
    closeBackupCodes,
    copyBackupCodes,
    setVerificationCode,
    syncTwoFactorEnabled,
  };
}
