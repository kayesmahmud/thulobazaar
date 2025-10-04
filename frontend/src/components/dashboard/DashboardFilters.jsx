import { styles, colors, spacing, typography } from '../../styles/theme';

function DashboardFilters({ currentFilter, onFilterChange }) {
  const filters = [
    { value: 'all', label: 'All Ads', icon: '📋' },
    { value: 'active', label: 'Active', icon: '✅' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'rejected', label: 'Rejected', icon: '❌' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: spacing.md,
      marginBottom: spacing.xl,
      flexWrap: 'wrap'
    }}>
      {filters.map((filter) => {
        const isActive = currentFilter === filter.value;

        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            style={{
              padding: `${spacing.md} ${spacing.xl}`,
              borderRadius: '8px',
              border: isActive ? `2px solid ${colors.primary}` : `1px solid ${colors.border.default}`,
              backgroundColor: isActive ? colors.primaryLight : colors.background.primary,
              color: isActive ? colors.primary : colors.text.secondary,
              fontSize: typography.fontSize.sm,
              fontWeight: isActive ? typography.fontWeight.bold : typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = colors.border.hover;
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = colors.border.default;
                e.currentTarget.style.backgroundColor = colors.background.primary;
              }
            }}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default DashboardFilters;
