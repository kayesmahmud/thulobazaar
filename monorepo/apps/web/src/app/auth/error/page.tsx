'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const errorMessages: Record<string, { title: string; description: string; solution: string }> = {
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in. This usually happens when the OAuth app is in testing mode.',
    solution: 'The app owner needs to either: (1) Add your email as a test user in Google Cloud Console, or (2) Publish the app to production mode.',
  },
  OAuthSignin: {
    title: 'OAuth Sign-in Error',
    description: 'There was an error starting the sign-in process.',
    solution: 'Try again or contact support if the issue persists.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'There was an error during the sign-in callback.',
    solution: 'Check that the redirect URI is correctly configured in Google Cloud Console: http://localhost:3333/api/auth/callback/google',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'There was an error creating your account.',
    solution: 'Try again or contact support.',
  },
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the server configuration.',
    solution: 'Check that GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_URL are correctly set.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication.',
    solution: 'Try again or contact support.',
  },
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';

  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {errorInfo.title}
            </h1>

            <p className="text-gray-600 mb-4">
              {errorInfo.description}
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-1">How to fix:</p>
              <p className="text-sm text-amber-700">{errorInfo.solution}</p>
            </div>

            {error === 'AccessDenied' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-blue-800 mb-2">Required Google Cloud Console Settings:</p>
                <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                  <li>Go to Google Cloud Console {">"} APIs & Services {">"} Credentials</li>
                  <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">http://localhost:3333/api/auth/callback/google</code></li>
                  <li>Go to OAuth consent screen</li>
                  <li>Add your email as a test user OR publish the app</li>
                </ol>
              </div>
            )}

            <div className="text-xs text-gray-500 mb-6">
              Error code: <code className="bg-gray-100 px-2 py-1 rounded">{error}</code>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/en/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 focus:outline-none"
              >
                Try Again
              </Link>
              <Link
                href="/en"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
