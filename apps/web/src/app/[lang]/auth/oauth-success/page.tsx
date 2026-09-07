'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { trackCompleteRegistration } from '@/lib/analytics';

export default function OAuthSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userParam = searchParams.get('user');

    if (!token || !userParam) {
      console.error('Missing token or user in OAuth success');
      router.push('/en/auth/signin?error=MissingData');
      return;
    }

    const handleOAuthSuccess = async () => {
      try {
        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('OAuth success - signing in with backend token:', { email: userData.email });
        setStatus('Creating session...');

        // Sign in using NextAuth credentials provider with the backend token
        // The credentials provider will validate the token and create a session
        const result = await signIn('oauth-token', {
          token,
          refreshToken,
          userId: userData.id,
          email: userData.email,
          redirect: false,
        });

        if (result?.error) {
          console.error('NextAuth sign-in error:', result.error);
          router.push(`/en/auth/signin?error=${result.error}`);
          return;
        }

        if (result?.ok) {
          console.log('Successfully signed in with OAuth token');
          // Only a first-time OAuth login is a registration. Fired after the
          // session is confirmed so a failed sign-in never counts as a signup.
          if (searchParams.get('isNewUser') === 'true') {
            trackCompleteRegistration('google');
          }
          setStatus('Success! Redirecting...');
          router.push('/en');
        } else {
          router.push('/en/auth/signin?error=SignInFailed');
        }
      } catch (error) {
        console.error('Failed to process OAuth success:', error);
        router.push('/en/auth/signin?error=ProcessingError');
      }
    };

    handleOAuthSuccess();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
