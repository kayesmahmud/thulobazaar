import { useState, useEffect } from 'react';
import { styles, colors, spacing, typography } from '../../styles/theme';
import axios from 'axios';

function PopularAreas({ selectedAreas, onAreaSelect, municipalityId = null }) {
  const [popularAreas, setPopularAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    fetchPopularAreas();
  }, [municipalityId]);

  const fetchPopularAreas = async () => {
    setIsLoading(true);
    try {
      const params = { limit: 10 };
      if (municipalityId) {
        params.municipality_id = municipalityId;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/areas/popular`,
        { params }
      );

      if (response.data.success) {
        setPopularAreas(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching popular areas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAreaSelected = (areaId) => {
    return selectedAreas.some(area => area.id === areaId);
  };

  const handleAreaClick = (area) => {
    if (isAreaSelected(area.id)) {
      // If already selected, don't do anything (user can remove via chip)
      return;
    }
    onAreaSelect(area);
  };

  if (popularAreas.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div style={{
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottom: `1px solid ${colors.border}`
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${spacing.sm} 0`,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginBottom: isExpanded ? spacing.sm : 0
        }}
      >
        <span style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs
        }}>
          ⭐ Popular Areas
        </span>
        <span style={{
          fontSize: '14px',
          color: colors.text.secondary,
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>

      <div style={{
        maxHeight: isExpanded ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease-in-out'
      }}>
        {isLoading ? (
          <div style={{
            padding: spacing.md,
            textAlign: 'center',
            color: colors.text.secondary,
            fontSize: typography.fontSize.sm
          }}>
            Loading popular areas...
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs
          }}>
            {popularAreas.map((area) => {
              const selected = isAreaSelected(area.id);
              return (
                <button
                  key={area.id}
                  onClick={() => handleAreaClick(area)}
                  disabled={selected}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: spacing.sm,
                    background: 'none',
                    border: selected ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    cursor: selected ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selected ? colors.primaryLight : 'transparent',
                    opacity: selected ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor = colors.background.secondary;
                      e.currentTarget.style.borderColor = colors.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = colors.border;
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '2px'
                  }}>
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: selected ? colors.primary : colors.text.primary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      📍 {area.name}
                      {selected && <span style={{ fontSize: '12px' }}>✓</span>}
                    </span>
                    <span style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary
                    }}>
                      Ward {area.ward_number}, {area.municipality_name}
                    </span>
                  </div>
                  {area.listing_count > 0 && (
                    <span style={{
                      backgroundColor: selected ? colors.primary : colors.primaryLight,
                      color: selected ? 'white' : colors.primary,
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.bold
                    }}>
                      {area.listing_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PopularAreas;
