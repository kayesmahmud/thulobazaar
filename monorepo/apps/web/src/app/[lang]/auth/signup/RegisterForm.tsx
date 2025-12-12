'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface RegisterFormProps {
  lang: string;
}

type RegistrationType = 'email' | 'phone';
type PhoneStep = 'phone' | 'otp' | 'details';

export default function RegisterForm({ lang }: RegisterFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

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
  const [formData, setFormData] = useState({
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
    if (status === 'authenticated' && session) {
      router.push(`/${lang}`);
    }
  }, [status, session, router, lang]);

  // Validate Nepali phone number
  const validateNepaliPhone = useCallback((phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return /^(97|98)\d{8}$/.test(cleanPhone);
  }, []);

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

      const data = await response.json();

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
      setError(err.message);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      setPhoneVerificationToken(data.verificationToken);
      setSuccess('Phone verified! Complete your registration.');
      setPhoneStep('details');
    } catch (err: any) {
      setError(err.message);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // For phone registration, we need to handle login differently
      // since the user doesn't have an email for credentials login
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push(`/${lang}/auth/signin?registered=true&phone=true`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    setError('');
    try {
      if (provider === 'google') {
        // Use backend Passport.js OAuth instead of NextAuth
        // The backend will handle the OAuth flow and redirect back with a token
        window.location.href = 'http://localhost:5000/api/auth/google';
      } else {
        // Facebook still uses NextAuth
        await signIn(provider, { callbackUrl: `/${lang}` });
      }
    } catch (err) {
      setError('Failed to connect. Please try again.');
      setSocialLoading(null);
    }
  };

  // Loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-gray-500 text-sm">Checking session...</span>
      </div>
    );
  }

  // Already authenticated
  if (status === 'authenticated') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">You're already logged in!</h3>
        <p className="text-gray-500 text-sm mb-4">Redirecting you to the homepage...</p>
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5">
      {/* Social Login Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading || socialLoading !== null}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {socialLoading === 'google' ? (
            <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{socialLoading === 'google' ? 'Connecting...' : 'Sign up with Google'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          disabled={isLoading || socialLoading !== null}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {socialLoading === 'facebook' ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          )}
          <span>{socialLoading === 'facebook' ? 'Connecting...' : 'Sign up with Facebook'}</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or register with</span>
        </div>
      </div>

      {/* Registration Type Tabs */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setRegistrationType('phone');
            setPhoneStep('phone');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            registrationType === 'phone'
              ? 'bg-rose-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Phone Number
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRegistrationType('email');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            registrationType === 'email'
              ? 'bg-rose-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-500 text-red-600 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-500 text-green-600 px-4 py-3 rounded-lg">
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Phone Registration Flow */}
      {registrationType === 'phone' && (
        <div className="space-y-6">
          {/* Step 1: Phone Number */}
          {phoneStep === 'phone' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +977
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={isLoading}
                    maxLength={10}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter 10-digit Nepali mobile number (starting with 97 or 98)</p>
              </div>

              <Button
                type="button"
                variant="primary"
                fullWidth
                loading={isLoading}
                disabled={isLoading || otpCooldown > 0 || phone.length !== 10}
                onClick={handleSendOtp}
              >
                {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
              </Button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {phoneStep === 'otp' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  OTP sent to <span className="font-medium">+977 {phone}</span>
                </p>
                {otpExpiry > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Expires in {formatTime(otpExpiry)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP *
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors text-center text-2xl tracking-widest"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                  maxLength={6}
                />
              </div>

              <Button
                type="button"
                variant="primary"
                fullWidth
                loading={isLoading}
                disabled={isLoading || otp.length !== 6}
                onClick={handleVerifyOtp}
              >
                Verify OTP
              </Button>

              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep('phone');
                    setOtp('');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading || otpCooldown > 0}
                  className="text-rose-500 hover:text-rose-600 disabled:text-gray-400"
                >
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details Form */}
          {phoneStep === 'details' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="text-center mb-4 pb-4 border-b border-gray-200">
                <div className="inline-flex items-center gap-2 text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">+977 {phone} verified</span>
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500 mt-0.5"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-rose-500 hover:text-rose-600 transition-colors">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-rose-500 hover:text-rose-600 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Email Registration Form */}
      {registrationType === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address *
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-start">
            <input
              id="terms-email"
              type="checkbox"
              required
              className="h-4 w-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500 mt-0.5"
            />
            <label htmlFor="terms-email" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <a href="#" className="text-rose-500 hover:text-rose-600 transition-colors">
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a href="#" className="text-rose-500 hover:text-rose-600 transition-colors">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      )}
    </div>
  );
}
