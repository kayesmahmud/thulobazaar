'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SortDropdownProps {
  lang: string;
  currentSort: string;
}

export default function SortDropdown({ lang, currentSort }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSort === 'newest') {
      params.delete('sortBy');
    } else {
      params.set('sortBy', newSort);
    }

    router.push(`/${lang}/search?${params.toString()}`);
  };

  return (
    <select
      id="sort"
      name="sortBy"
      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
      value={currentSort}
      onChange={(e) => handleSortChange(e.target.value)}
    >
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
