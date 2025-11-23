'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = true,
  className = '',
}: PaginationProps) {
  // Calculate visible page numbers
  const getVisiblePages = (): (number | string)[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning or end
    if (currentPage <= halfVisible) {
      endPage = Math.min(maxVisiblePages, totalPages);
    } else if (currentPage >= totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    // Add first page and ellipsis
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center justify-center gap-2 ${className}`} aria-label="Pagination">
      {/* First Page Button */}
      {showFirstLast && currentPage > 1 && (
        <button
          onClick={() => handlePageClick(1)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="First page"
        >
          «
        </button>
      )}

      {/* Previous Button */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        ‹
      </button>

      {/* Page Numbers */}
      <div className="hidden mobile:flex items-center gap-2">
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-sm font-medium text-gray-400"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => handlePageClick(pageNum)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-fast ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-primary'
              }`}
              aria-label={`Page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Mobile: Current page indicator */}
      <div className="flex mobile:hidden items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
        <span className="font-semibold text-primary">{currentPage}</span>
        <span className="mx-1">/</span>
        <span>{totalPages}</span>
      </div>

      {/* Next Button */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        ›
      </button>

      {/* Last Page Button */}
      {showFirstLast && currentPage < totalPages && (
        <button
          onClick={() => handlePageClick(totalPages)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Last page"
        >
          »
        </button>
      )}
    </nav>
  );
}

// Compact version for smaller spaces
export function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: Omit<PaginationProps, 'maxVisiblePages' | 'showFirstLast'>) {
  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center justify-center gap-2 ${className}`} aria-label="Pagination">
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous"
      >
        Prev
      </button>

      <span className="px-3 py-1 text-xs font-medium text-gray-700">
        <span className="font-semibold text-primary">{currentPage}</span>
        <span className="mx-1">/</span>
        <span>{totalPages}</span>
      </span>

      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next"
      >
        Next
      </button>
    </nav>
  );
}
