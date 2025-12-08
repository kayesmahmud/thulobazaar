'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type ResetMethod = 'phone' | 'email';

export default function ForgotPasswordPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();

  const [method, setMethod] = useState<ResetMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: method === 'phone' ? phone : undefined,
          email: method === 'email' ? email : undefined,
          purpose: 'password_reset',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to reset password page with the identifier
        const identifier = method === 'phone' ? phone : email;
        router.push(`/${lang}/auth/reset-password?method=${method}&identifier=${encodeURIComponent(identifier)}`);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href={`/${lang}`} className="flex justify-center">
          <span className="text-3xl font-bold text-primary">ThuLoBazaar</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          No worries! Enter your phone number or email and we&apos;ll send you a verification code.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:px-10 border border-gray-200">
          {/* Method Selector */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMethod('phone');
                setError('');
              }}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
                method === 'phone'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setError('');
              }}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
                method === 'email'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {method === 'phone' ? (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">+977</span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    required
                    className="block w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(value);
                    }}
                    disabled={isLoading}
                    maxLength={10}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter the phone number associated with your account
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter the email address associated with your account
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (method === 'phone' ? phone.length !== 10 : !email)}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending OTP...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/${lang}/auth/signin`}
              className="text-sm text-primary hover:text-primary-hover font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
