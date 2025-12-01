'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeroSearchProps {
  lang: string;
}

export default function HeroSearch({ lang }: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/${lang}/search`);
    }
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
          className="text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-success)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-success-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-success)'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>
    </form>
  );
}
