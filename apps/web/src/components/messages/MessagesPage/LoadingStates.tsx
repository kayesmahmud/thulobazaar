'use client';

import { signOut } from 'next-auth/react';

export function NotLoggedInState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Please log in to access messages.</p>
    </div>
  );
}

export function TokenLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-5xl mb-4">&#8987;</div>
        <p className="text-gray-600">Loading messaging system...</p>
      </div>
    </div>
  );
}

interface TokenErrorStateProps {
  error: string | null;
}

export function TokenErrorState({ error }: TokenErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">&#10060;</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Messaging</h2>
        <p className="text-gray-600 mb-6">
          {error || 'Failed to fetch authentication token. Please try logging out and back in.'}
        </p>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Log Out and Try Again
        </button>
      </div>
    </div>
  );
}
