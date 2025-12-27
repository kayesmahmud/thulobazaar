'use client';

import { useUserAuth } from '@/contexts/UserAuthContext';
import Link from 'next/link';

interface ShopEmptyStateProps {
  shopId: number;
  lang: string;
}

export default function ShopEmptyState({ shopId, lang }: ShopEmptyStateProps) {
  const { user, isAuthenticated } = useUserAuth();

  // Only show the button if the logged-in user owns this shop
  const isOwner = isAuthenticated && user && user.id === shopId;

  if (!isOwner) {
    return null;
  }

  return (
    <Link
      href={`/${lang}/post-ad`}
      className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-10 py-5 rounded-2xl font-black text-lg hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-2xl hover:shadow-green-500/50 hover:scale-110 animate-pulse"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>

      {/* Button Content */}
      <div className="relative flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="tracking-wide">POST FREE AD</span>
        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
      </div>
    </Link>
  );
}
