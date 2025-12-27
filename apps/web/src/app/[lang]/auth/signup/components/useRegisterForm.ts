'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { RegistrationType, PhoneStep, FormData, UseRegisterFormReturn } from './types';

export function useRegisterForm(lang: string): UseRegisterFormReturn {
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  // Registration type
  const [registrationType, setRegistrationType] = useState<RegistrationType>('phone');

  // Phone registration state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [otpCooldown]);

  // OTP expiry timer
  useEffect(() => {
    if (otpExpiry > 0) {
      const timer = setTimeout(() => setOtpExpiry(otpExpiry - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [otpExpiry]);

  // Redirect if already logged in
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      router.push(`/${lang}`);
    }
  }, [sessionStatus, router, lang]);

  // Validate Nepali phone number
  const validateNepaliPhone = useCallback((phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return /^(97|98)\d{8}$/.test(cleanPhone);
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Send OTP
  const handleSendOtp = async () => {
    setError('');
    setSuccess('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (!validateNepaliPhone(cleanPhone)) {
      setError('Invalid Nepali phone number. Must be 10 digits starting with 97 or 98.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, purpose: 'registration' }),
      });

      // Handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server error. Please try again.');
      }

      if (!response.ok) {
        if (data.cooldownRemaining) {
          setOtpCooldown(data.cooldownRemaining);
        }
        throw new Error(data.message || 'Failed to send OTP');
      }

      setSuccess('OTP sent successfully! Check your phone.');
      setPhoneStep('otp');
      setOtpExpiry(data.expiresIn || 600);
    } catch (err: any) {
      // Handle network errors specifically
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp, purpose: 'registration' }),
      });

      // Handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server error. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      setPhoneVerificationToken(data.verificationToken);
      setSuccess('Phone verified! Complete your registration.');
      setPhoneStep('details');
    } catch (err: any) {
      // Handle network errors specifically
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email registration
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const loginResult = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (loginResult?.error) {
        router.push(`/${lang}/auth/signin?registered=true`);
      } else if (loginResult?.ok) {
        router.push(`/${lang}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle phone registration (after OTP verified)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: formData.password,
          fullName: formData.fullName,
          phoneVerificationToken,
        }),
      });

      // Handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server error. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push(`/${lang}/auth/signin?registered=true&phone=true`);
      }, 1500);
    } catch (err: any) {
      // Handle network errors specifically
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    setError('');
    try {
      if (provider === 'google') {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
      } else {
        await signIn(provider, { callbackUrl: `/${lang}` });
      }
    } catch (err) {
      console.error('Social login error:', err);
      setError('Failed to connect. Please try again.');
      setSocialLoading(null);
    }
  };

  return {
    registrationType,
    setRegistrationType,
    phoneStep,
    setPhoneStep,
    phone,
    setPhone,
    otp,
    setOtp,
    otpCooldown,
    otpExpiry,
    formData,
    setFormData,
    error,
    setError,
    success,
    setSuccess,
    isLoading,
    socialLoading,
    sessionStatus,
    handleSendOtp,
    handleVerifyOtp,
    handleEmailSubmit,
    handlePhoneSubmit,
    handleSocialLogin,
    formatTime,
    clearMessages,
  };
}
