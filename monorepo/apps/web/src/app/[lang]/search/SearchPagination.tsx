'use client';

import Link from 'next/link';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  lang: string;
  searchParams: Record<string, string | undefined>;
}

export default function SearchPagination({
  currentPage,
  totalPages,
  lang,
  searchParams,
}: SearchPaginationProps) {
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();

    // Add all existing search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value.toString());
      }
    });

    // Add the page number
    if (page > 1) {
      params.set('page', page.toString());
    }

    return `/${lang}/search?${params.toString()}`;
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Pages to show on each side of current page
    const pages: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Always show first page
        i === totalPages || // Always show last page
        (i >= currentPage - delta && i <= currentPage + delta) // Show pages around current
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-2">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Previous
        </Link>
      ) : (
        <span className="px-4 py-2 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">
          ← Previous
        </span>
      )}

      {/* Page Numbers */}
      <div className="hidden md:flex items-center gap-2">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={page}
              href={buildPageUrl(pageNum)}
              className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-rose-500 text-white font-semibold'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* Mobile Page Indicator */}
      <div className="md:hidden px-4 py-2 border border-gray-300 rounded-lg bg-white">
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Next →
        </Link>
      ) : (
        <span className="px-4 py-2 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">
          Next →
        </span>
      )}
    </div>
  );
}
