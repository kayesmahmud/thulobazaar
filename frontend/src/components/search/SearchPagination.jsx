import { styles, colors, spacing, typography } from '../../styles/theme';

function SearchPagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing['2xl'],
      padding: spacing.xl
    }}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: `${spacing.sm} ${spacing.lg}`,
          borderRadius: '8px',
          border: `1px solid ${colors.border.default}`,
          backgroundColor: colors.background.primary,
          color: currentPage === 1 ? colors.text.muted : colors.text.primary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.backgroundColor = colors.background.primary;
          }
        }}
      >
        ← Previous
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                color: colors.text.secondary
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
            onClick={() => onPageChange(page)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: isActive ? `2px solid ${colors.primary}` : `1px solid ${colors.border.default}`,
              backgroundColor: isActive ? colors.primaryLight : colors.background.primary,
              color: isActive ? colors.primary : colors.text.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: isActive ? typography.fontWeight.bold : typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
                e.currentTarget.style.borderColor = colors.border.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = colors.background.primary;
                e.currentTarget.style.borderColor = colors.border.default;
              }
            }}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: `${spacing.sm} ${spacing.lg}`,
          borderRadius: '8px',
          border: `1px solid ${colors.border.default}`,
          backgroundColor: colors.background.primary,
          color: currentPage === totalPages ? colors.text.muted : colors.text.primary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage === totalPages ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.backgroundColor = colors.background.primary;
          }
        }}
      >
        Next →
      </button>
    </div>
  );
}

export default SearchPagination;
