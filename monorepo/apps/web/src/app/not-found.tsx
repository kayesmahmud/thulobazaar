/**
 * 404 Not Found Page
 * Next.js 15 Best Practice: Provide custom 404 page
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-gray-50">
      <div className="max-w-md">
        <h1 className="text-8xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          404
        </h1>

        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          Page Not Found
        </h2>

        <p className="text-gray-600 mb-8 text-lg">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          The page might have been moved or deleted.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/en"
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors no-underline"
          >
            Go Home
          </Link>
          <Link
            href="/en/all-ads"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors no-underline"
          >
            Browse Ads
          </Link>
        </div>
      </div>
    </div>
  );
}
