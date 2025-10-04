import { styles, colors, spacing, typography } from '../../styles/theme';

function SearchFiltersPanel({
  categories,
  locations,
  selectedCategory,
  selectedLocation,
  priceRange,
  condition,
  onCategoryChange,
  onLocationChange,
  onPriceRangeChange,
  onConditionChange,
  onClearFilters
}) {
  return (
    <div style={{
      ...styles.card.default,
      position: 'sticky',
      top: spacing.xl
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <h3 style={styles.heading.h3}>Filters</h3>
        <button
          onClick={onClearFilters}
          style={{
            ...styles.link.default,
            fontSize: typography.fontSize.sm,
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={styles.label.default}>Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{
            ...styles.input.default,
            backgroundColor: colors.background.primary
          }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Location Filter */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={styles.label.default}>Location</label>
        <select
          value={selectedLocation}
          onChange={(e) => onLocationChange(e.target.value)}
          style={{
            ...styles.input.default,
            backgroundColor: colors.background.primary
          }}
        >
          <option value="">All Locations</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>
              📍 {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={styles.label.default}>Price Range</label>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            style={{
              ...styles.input.default,
              flex: 1
            }}
          />
          <span style={{ color: colors.text.secondary }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            style={{
              ...styles.input.default,
              flex: 1
            }}
          />
        </div>
      </div>

      {/* Condition Filter */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={styles.label.default}>Condition</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {['new', 'like-new', 'used', 'refurbished'].map(cond => (
            <label
              key={cond}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                cursor: 'pointer',
                padding: spacing.sm,
                borderRadius: '6px',
                backgroundColor: condition === cond ? colors.primaryLight : 'transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (condition !== cond) {
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (condition !== cond) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <input
                type="radio"
                name="condition"
                value={cond}
                checked={condition === cond}
                onChange={(e) => onConditionChange(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{
                fontSize: typography.fontSize.sm,
                color: condition === cond ? colors.primary : colors.text.primary,
                fontWeight: condition === cond ? typography.fontWeight.semibold : typography.fontWeight.normal,
                textTransform: 'capitalize'
              }}>
                {cond.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Condition */}
      {condition && (
        <button
          onClick={() => onConditionChange('')}
          style={{
            ...styles.button.ghost,
            width: '100%',
            fontSize: typography.fontSize.sm
          }}
        >
          Clear Condition Filter
        </button>
      )}
    </div>
  );
}

export default SearchFiltersPanel;
