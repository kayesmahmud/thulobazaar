'use client';

import { useState, useCallback } from 'react';

type DeletionStep = 'idle' | 'confirm_intent' | 'sending_otp' | 'enter_otp' | 'deleting' | 'success';

interface UseAccountDeletionReturn {
  step: DeletionStep;
  error: string | null;
  otp: string;
  cooldown: number;
  maskedPhone: string | null;
  recoveryDeadline: string | null;
  isProcessing: boolean;
  startDeletion: () => void;
  confirmIntent: () => Promise<void>;
  verifyOtp: () => Promise<void>;
  setOtp: (otp: string) => void;
  cancel: () => void;
  resendOtp: () => Promise<void>;
}

export function useAccountDeletion(onSuccess?: () => void): UseAccountDeletionReturn {
  const [step, setStep] = useState<DeletionStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [recoveryDeadline, setRecoveryDeadline] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Start cooldown timer
  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startDeletion = useCallback(() => {
    setStep('confirm_intent');
    setError(null);
  }, []);

  const confirmIntent = useCallback(async () => {
    setStep('sending_otp');
    setError(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/user/deletion/request', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.cooldownRemaining) {
          startCooldown(data.cooldownRemaining);
        }
        throw new Error(data.message || 'Failed to send OTP');
      }

      setMaskedPhone(data.phone);
      setStep('enter_otp');
      startCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      setStep('confirm_intent');
    } finally {
      setIsProcessing(false);
    }
  }, [startCooldown]);

  const resendOtp = useCallback(async () => {
    if (cooldown > 0) return;

    setError(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/user/deletion/request', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.cooldownRemaining) {
          startCooldown(data.cooldownRemaining);
        }
        throw new Error(data.message || 'Failed to resend OTP');
      }

      startCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsProcessing(false);
    }
  }, [cooldown, startCooldown]);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setStep('deleting');
    setError(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/user/deletion/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      setRecoveryDeadline(data.recoveryDeadline);
      setStep('success');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      setStep('enter_otp');
    } finally {
      setIsProcessing(false);
    }
  }, [otp, onSuccess]);

  const cancel = useCallback(() => {
    setStep('idle');
    setError(null);
    setOtp('');
    setMaskedPhone(null);
    setCooldown(0);
  }, []);

  return {
    step,
    error,
    otp,
    cooldown,
    maskedPhone,
    recoveryDeadline,
    isProcessing,
    startDeletion,
    confirmIntent,
    verifyOtp,
    setOtp,
    cancel,
    resendOtp,
  };
}
