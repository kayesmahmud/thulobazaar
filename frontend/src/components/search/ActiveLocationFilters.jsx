import { styles, colors, spacing, typography } from '../../styles/theme';

function ActiveLocationFilters({ selectedAreas, onRemoveArea, onClearAll }) {
  if (selectedAreas.length === 0) {
    return null;
  }

  return (
    <div style={{
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottom: `1px solid ${colors.border}`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm
      }}>
        <span style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
          fontWeight: typography.fontWeight.semibold,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Selected Areas ({selectedAreas.length})
        </span>
        <button
          onClick={onClearAll}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: typography.fontSize.xs,
            color: colors.primary,
            fontWeight: typography.fontWeight.semibold,
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Clear All
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing.xs
      }}>
        {selectedAreas.map((area) => (
          <div
            key={area.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: colors.primaryLight,
              color: colors.primary,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: '16px',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              border: `1px solid ${colors.primary}`
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {area.is_popular && <span style={{ fontSize: '10px' }}>⭐</span>}
              📍 {area.name}
            </span>
            <button
              onClick={() => onRemoveArea(area.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                color: colors.primary,
                fontSize: '14px',
                fontWeight: typography.fontWeight.bold,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.primary;
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActiveLocationFilters;
