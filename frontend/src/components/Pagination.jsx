import { colors, spacing, typography } from '../styles/theme';

function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show max 7 page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.lg} 0`,
      flexWrap: 'wrap'
    }}>
      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: `${spacing.sm} ${spacing.md}`,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          backgroundColor: currentPage === 1 ? colors.background.secondary : 'white',
          color: currentPage === 1 ? colors.text.secondary : colors.text.primary,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          transition: 'all 0.2s',
          opacity: currentPage === 1 ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        ← Previous
      </button>

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              style={{
                padding: `${spacing.sm} ${spacing.xs}`,
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm
              }}
            >
              ...
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: `1px solid ${isActive ? colors.primary : colors.border}`,
              borderRadius: '6px',
              backgroundColor: isActive ? colors.primary : 'white',
              color: isActive ? 'white' : colors.text.primary,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
              minWidth: '40px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: `${spacing.sm} ${spacing.md}`,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          backgroundColor: currentPage === totalPages ? colors.background.secondary : 'white',
          color: currentPage === totalPages ? colors.text.secondary : colors.text.primary,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          transition: 'all 0.2s',
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        Next →
      </button>
    </div>
  );
}

export default Pagination;
