import { colors, spacing, borderRadius, typography, styles } from '../../styles/theme';

/**
 * AdSortDropdown Component
 *
 * A dropdown component for sorting ads by various criteria including
 * latest, price (low to high), price (high to low), and most viewed.
 *
 * @param {Object} props
 * @param {string} props.sortBy - Current sort option value
 * @param {Function} props.onSortChange - Callback when sort option changes
 */
function AdSortDropdown({ sortBy, onSortChange }) {
  const sortOptions = [
    { value: 'newest', label: 'Latest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'most-viewed', label: 'Most Viewed' }
  ];

  return (
    <div style={{
      backgroundColor: colors.background.primary,
      border: `1px solid ${colors.border.default}`,
      borderRadius: borderRadius.lg,
      padding: spacing.xl
    }}>
      <h3 style={{
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.md,
        margin: `0 0 ${spacing.md} 0`
      }}>
        Sort by
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm
      }}>
        {sortOptions.map((option) => (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              color: colors.text.primary,
              padding: spacing.xs,
              borderRadius: borderRadius.sm,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (sortBy !== option.value) {
                e.currentTarget.style.backgroundColor = colors.gray50;
              }
            }}
            onMouseLeave={(e) => {
              if (sortBy !== option.value) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <input
              type="radio"
              name="sort"
              value={option.value}
              checked={sortBy === option.value}
              onChange={(e) => onSortChange(e.target.value)}
              style={{
                marginRight: spacing.sm,
                cursor: 'pointer',
                width: '16px',
                height: '16px',
                accentColor: colors.primary
              }}
            />
            <span style={{
              fontWeight: sortBy === option.value
                ? typography.fontWeight.semibold
                : typography.fontWeight.normal,
              color: sortBy === option.value
                ? colors.primary
                : colors.text.primary
            }}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default AdSortDropdown;
