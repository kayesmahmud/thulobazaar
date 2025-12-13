'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ResetStep, UseResetPasswordReturn } from './types';
import { maskIdentifier } from './types';

export function useResetPassword(
  lang: string,
  method: string,
  identifier: string
): UseResetPasswordReturn {
  const router = useRouter();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<ResetStep>('otp');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  // Redirect if no identifier
  useEffect(() => {
    if (!identifier) {
      router.push(`/${lang}/auth/forgot-password`);
    }
  }, [identifier, router, lang]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = digit;
      return newOtp;
    });

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerifyOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      const otpCode = otp.join('');
      if (otpCode.length !== 6) {
        setError('Please enter the complete 6-digit code');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: method === 'phone' ? identifier : undefined,
            email: method === 'email' ? identifier : undefined,
            otp: otpCode,
            purpose: 'password_reset',
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStep('password');
        } else {
          setError(data.message || 'Invalid OTP. Please try again.');
        }
      } catch (err) {
        setError('Verification failed. Please try again.');
        console.error('OTP verification error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [otp, method, identifier]
  );

  const handleResetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: method === 'phone' ? identifier : undefined,
            email: method === 'email' ? identifier : undefined,
            otp: otp.join(''),
            newPassword,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            router.push(`/${lang}/auth/signin`);
          }, 2000);
        } else {
          setError(data.message || 'Failed to reset password. Please try again.');
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
        console.error('Password reset error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [newPassword, confirmPassword, method, identifier, otp, router, lang]
  );

  const handleResendOtp = useCallback(async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: method === 'phone' ? identifier : undefined,
          email: method === 'email' ? identifier : undefined,
          purpose: 'password_reset',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtp(['', '', '', '', '', '']);
        setCooldown(60);
        inputRefs.current[0]?.focus();
      } else if (data.cooldownRemaining) {
        setCooldown(data.cooldownRemaining);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, [method, identifier]);

  return {
    // State
    otp,
    newPassword,
    confirmPassword,
    step,
    isLoading,
    isResending,
    error,
    success,
    cooldown,
    maskedIdentifier: maskIdentifier(method, identifier),

    // Refs
    inputRefs,

    // Setters
    setNewPassword,
    setConfirmPassword,

    // Handlers
    handleOtpChange,
    handleOtpKeyDown,
    handleVerifyOtp,
    handleResetPassword,
    handleResendOtp,
  };
}
