import { colors, spacing, borderRadius, typography, styles } from '../../styles/theme';

/**
 * AdFiltersBar Component
 *
 * A comprehensive filter bar component for filtering ads by category, location,
 * price range, and condition. Includes a clear filters button to reset all filters.
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter values { category, location, minPrice, maxPrice, condition }
 * @param {Array} props.categories - Array of category objects { id, name }
 * @param {Array} props.locations - Array of location objects { id, name }
 * @param {Function} props.onFilterChange - Callback when any filter changes (filterName, value)
 * @param {Function} props.onClearFilters - Callback to clear all filters
 */
function AdFiltersBar({ filters, categories, locations, onFilterChange, onClearFilters }) {
  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'used', label: 'Used' }
  ];

  const handleConditionToggle = (conditionValue) => {
    const currentConditions = filters.condition || [];
    const newConditions = currentConditions.includes(conditionValue)
      ? currentConditions.filter(c => c !== conditionValue)
      : [...currentConditions, conditionValue];

    onFilterChange('condition', newConditions);
  };

  const hasActiveFilters =
    (filters.category && filters.category !== 'all') ||
    (filters.location && filters.location !== 'all') ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.condition && filters.condition.length > 0);

  return (
    <div style={{
      backgroundColor: colors.background.primary,
      border: `1px solid ${colors.border.default}`,
      borderRadius: borderRadius.lg,
      padding: spacing.xl
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <h3 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          margin: 0
        }}>
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              backgroundColor: 'transparent',
              color: colors.primary,
              border: 'none',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              padding: spacing.xs,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={{
          ...styles.label.default,
          marginBottom: spacing.sm
        }}>
          Category
        </label>
        <select
          value={filters.category || 'all'}
          onChange={(e) => onFilterChange('category', e.target.value)}
          style={{
            ...styles.input.default,
            cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Location Filter */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={{
          ...styles.label.default,
          marginBottom: spacing.sm
        }}>
          Location
        </label>
        <select
          value={filters.location || 'all'}
          onChange={(e) => onFilterChange('location', e.target.value)}
          style={{
            ...styles.input.default,
            cursor: 'pointer'
          }}
        >
          <option value="all">All of Nepal</option>
          {locations.map((location) => (
            <option key={location.id} value={location.name}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={{
          ...styles.label.default,
          marginBottom: spacing.sm
        }}>
          Price Range
        </label>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
            style={{
              ...styles.input.default,
              flex: 1
            }}
          />
          <span style={{ color: colors.text.secondary }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            style={{
              ...styles.input.default,
              flex: 1
            }}
          />
        </div>
      </div>

      {/* Condition Filter */}
      <div>
        <label style={{
          ...styles.label.default,
          marginBottom: spacing.sm
        }}>
          Condition
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {conditionOptions.map((option) => (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                color: colors.text.primary
              }}
            >
              <input
                type="checkbox"
                checked={(filters.condition || []).includes(option.value)}
                onChange={() => handleConditionToggle(option.value)}
                style={{
                  marginRight: spacing.sm,
                  cursor: 'pointer',
                  width: '16px',
                  height: '16px',
                  accentColor: colors.primary
                }}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdFiltersBar;
