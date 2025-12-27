'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeroSearchProps {
  lang: string;
}

export default function HeroSearch({ lang }: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    // Small delay to show animation before navigation
    setTimeout(() => {
      if (query.trim()) {
        router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push(`/${lang}/search`);
      }
    }, 400);
  };

  return (
    <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
      <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anything..."
          aria-label="Search for products"
          className="flex-1 px-4 py-3 border-0 focus:outline-none text-gray-800 rounded-xl bg-transparent"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="group text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400"
        >
          {/* Animated Magnifying Glass */}
          <div className={`relative ${isSearching ? 'animate-search-wobble' : ''}`}>
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                isSearching
                  ? 'animate-spin'
                  : 'group-hover:rotate-12 group-hover:scale-110'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <span>{isSearching ? 'Searching...' : 'Search'}</span>
        </button>
      </div>

      {/* Custom CSS Animation for search wobble */}
      <style jsx>{`
        @keyframes search-wobble {
          0%, 100% { transform: rotate(-15deg) scale(1.1); }
          25% { transform: rotate(15deg) scale(1.2); }
          50% { transform: rotate(-15deg) scale(1.1); }
          75% { transform: rotate(15deg) scale(1.2); }
        }
        .animate-search-wobble {
          animation: search-wobble 0.5s ease-in-out infinite;
        }
      `}</style>
    </form>
  );
}
