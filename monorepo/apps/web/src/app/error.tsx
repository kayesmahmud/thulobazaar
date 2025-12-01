'use client';

/**
 * Error Boundary for Next.js 15
 * Catches errors in Server and Client Components
 * 2025 Best Practice: Always provide error.tsx for better UX
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, etc.)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-6xl mb-4">⚠️</div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong!
        </h2>

        <p className="text-gray-600 mb-6">
          We&apos;re sorry for the inconvenience. Please try again or return to the homepage.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}

        {error.digest && (
          <p className="text-sm text-gray-500 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/en"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors no-underline"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
