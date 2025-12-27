import Link from 'next/link';

export default function EditorNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">404</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The editor page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/en/editor/dashboard"
          className="inline-block px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
