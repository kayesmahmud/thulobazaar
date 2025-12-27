'use client';

import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  lang: string;
  staffName?: string;
}

export default function DashboardHeader({ lang, staffName }: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Welcome back, <span className="font-semibold text-indigo-600">{staffName}</span>! Here&apos;s your complete system overview.
          </p>
        </div>
        <button
          onClick={() => router.push(`/${lang}/super-admin/analytics`)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>View Analytics</span>
        </button>
      </div>
    </div>
  );
}
