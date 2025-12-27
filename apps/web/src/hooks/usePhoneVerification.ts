'use client';

import { useState, useEffect, useCallback } from 'react';

type VerifyStep = 'idle' | 'enter_phone' | 'enter_otp';

interface UsePhoneVerificationOptions {
  onSuccess?: () => void;
}

interface UsePhoneVerificationReturn {
  // State
  step: VerifyStep;
  phoneToVerify: string;
  otp: string;
  error: string;
  success: string;
  isSendingOtp: boolean;
  isVerifying: boolean;
  cooldown: number;

  // Actions
  setPhoneToVerify: (phone: string) => void;
  setOtp: (otp: string) => void;
  sendOtp: () => Promise<void>;
  verifyOtp: () => Promise<void>;
  startVerification: () => void;
  cancelVerification: () => void;
  changeNumber: () => void;
  clearMessages: () => void;
}

export function usePhoneVerification(
  options: UsePhoneVerificationOptions = {}
): UsePhoneVerificationReturn {
  const { onSuccess } = options;

  const [step, setStep] = useState<VerifyStep>('idle');
  const [phoneToVerify, setPhoneToVerify] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  const sendOtp = useCallback(async () => {
    if (!phoneToVerify || phoneToVerify.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSendingOtp(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phoneToVerify,
          purpose: 'phone_verification',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('enter_otp');
        setCooldown(60);
        setError('');
      } else {
        setError(data.message || 'Failed to send OTP');
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining);
        }
      }
    } catch (err) {
      console.error('Send phone OTP error:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  }, [phoneToVerify]);

  const verifyOtp = useCallback(async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // First verify the OTP
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phoneToVerify,
          otp: otp,
          purpose: 'phone_verification',
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setError(verifyData.message || 'Invalid OTP');
        setIsVerifying(false);
        return;
      }

      // Now update the phone number
      const updateResponse = await fetch('/api/auth/update-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phoneToVerify,
          verificationToken: verifyData.verificationToken,
        }),
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        setSuccess('Phone number verified successfully!');
        setStep('idle');
        setPhoneToVerify('');
        setOtp('');
        onSuccess?.();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(updateData.message || 'Failed to update phone number');
      }
    } catch (err) {
      console.error('Verify phone error:', err);
      setError('Failed to verify phone. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [otp, phoneToVerify, onSuccess]);

  const startVerification = useCallback(() => {
    setStep('enter_phone');
    setPhoneToVerify('');
    setOtp('');
    setError('');
  }, []);

  const cancelVerification = useCallback(() => {
    setStep('idle');
    setError('');
  }, []);

  const changeNumber = useCallback(() => {
    setStep('enter_phone');
    setOtp('');
    setError('');
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return {
    step,
    phoneToVerify,
    otp,
    error,
    success,
    isSendingOtp,
    isVerifying,
    cooldown,
    setPhoneToVerify,
    setOtp,
    sendOtp,
    verifyOtp,
    startVerification,
    cancelVerification,
    changeNumber,
    clearMessages,
  };
}
