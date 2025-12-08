'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();
  const searchParams = useSearchParams();

  const method = searchParams.get('method') || 'phone';
  const identifier = searchParams.get('identifier') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'otp' | 'password'>('otp');
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
  }, [cooldown]);

  // Redirect if no identifier
  useEffect(() => {
    if (!identifier) {
      router.push(`/${lang}/auth/forgot-password`);
    }
  }, [identifier, router, lang]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
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
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP first
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
  };

  const handleResetPassword = async (e: React.FormEvent) => {
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
  };

  const handleResendOtp = async () => {
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
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const maskedIdentifier = method === 'phone'
    ? `+977 ${identifier.slice(0, 2)}****${identifier.slice(-2)}`
    : identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href={`/${lang}`} className="flex justify-center">
          <span className="text-3xl font-bold text-primary">ThuLoBazaar</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          {step === 'otp' ? 'Enter verification code' : 'Create new password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'otp'
            ? `We sent a 6-digit code to ${maskedIdentifier}`
            : 'Enter your new password below'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:px-10 border border-gray-200">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter 6-digit code
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Didn&apos;t receive the code?{' '}
                  {cooldown > 0 ? (
                    <span className="text-gray-500">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="text-primary hover:text-primary-hover font-medium disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  )}
                </p>
              </div>
            </form>
          )}

          {/* Step 2: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href={`/${lang}/auth/signin`}
              className="text-sm text-gray-600 hover:text-primary"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
