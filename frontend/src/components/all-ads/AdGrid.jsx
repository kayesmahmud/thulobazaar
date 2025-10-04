import { colors, spacing, typography } from '../../styles/theme';
import AdCard from '../AdCard';

/**
 * AdGrid Component
 *
 * A responsive grid layout component for displaying ads with loading and empty states.
 * Handles the display of ad cards in a responsive grid layout.
 *
 * @param {Object} props
 * @param {Array} props.ads - Array of ad objects to display
 * @param {boolean} props.loading - Loading state indicator
 * @param {Function} props.onAdClick - Optional callback when an ad is clicked
 */
function AdGrid({ ads, loading, onAdClick }) {
  // Loading State
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: spacing.lg
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: `4px solid ${colors.gray200}`,
          borderTop: `4px solid ${colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{
          fontSize: typography.fontSize.lg,
          color: colors.text.secondary,
          margin: 0
        }}>
          Loading ads...
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Empty State
  if (!ads || ads.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: `${spacing['4xl']} ${spacing.xl}`,
        color: colors.text.secondary
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: spacing.lg,
          opacity: 0.5
        }}>
          🔍
        </div>
        <h3 style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          margin: `0 0 ${spacing.sm} 0`
        }}>
          No ads found
        </h3>
        <p style={{
          fontSize: typography.fontSize.base,
          color: colors.text.secondary,
          margin: 0,
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Try adjusting your filters or search criteria to see more results.
        </p>
      </div>
    );
  }

  // Grid with Ads
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: spacing.xl,
        width: '100%'
      }}
    >
      {ads.map((ad) => (
        <div
          key={ad.id}
          onClick={() => onAdClick && onAdClick(ad)}
          style={{
            cursor: onAdClick ? 'pointer' : 'default'
          }}
        >
          <AdCard ad={ad} />
        </div>
      ))}
    </div>
  );
}

export default AdGrid;
