'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface RegisterFormProps {
  lang: string;
}

export default function RegisterForm({ lang }: RegisterFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(`/${lang}`);
    }
  }, [status, session, router, lang]);

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-gray-500 text-sm">Checking session...</span>
      </div>
    );
  }

  // If authenticated, show redirecting message
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
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
      // Register user
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

      // Auto-login after successful registration
      const loginResult = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (loginResult?.error) {
        // Registration succeeded but login failed - redirect to login page
        router.push(`/${lang}/auth/signin?registered=true`);
      } else if (loginResult?.ok) {
        // Both registration and login succeeded
        router.push(`/${lang}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    setError('');
    try {
      await signIn(provider, { callbackUrl: `/${lang}` });
    } catch (err) {
      setError('Failed to connect. Please try again.');
      setSocialLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Social Login Buttons */}
      <div className="space-y-3">
        {/* Google Button */}
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

        {/* Facebook Button */}
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
          <span className="px-4 bg-white text-gray-500">or register with email</span>
        </div>
      </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-500 text-red-600 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Full Name */}
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

      {/* Email */}
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

      {/* Password */}
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

      {/* Confirm Password */}
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

      {/* Terms & Conditions */}
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

      {/* Submit Button */}
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
    </div>
  );
}
