import { styles, colors, spacing, typography } from '../../styles/theme';
import SearchResultCard from './SearchResultCard';

function SearchResultsGrid({ ads, loading }) {
  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: spacing['3xl'],
        color: colors.text.secondary
      }}>
        <div style={{ fontSize: '48px', marginBottom: spacing.lg }}>🔄</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Searching...</p>
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return (
      <div style={{
        ...styles.card.flat,
        textAlign: 'center',
        padding: spacing['3xl']
      }}>
        <div style={{ fontSize: '64px', marginBottom: spacing.lg }}>🔍</div>
        <h3 style={styles.heading.h3}>No results found</h3>
        <p style={{
          color: colors.text.secondary,
          marginBottom: spacing.xl
        }}>
          Try adjusting your filters or search term
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results Count */}
      <div style={{
        marginBottom: spacing.lg,
        color: colors.text.secondary,
        fontSize: typography.fontSize.sm
      }}>
        Found <strong style={{ color: colors.text.primary }}>{ads.length}</strong> {ads.length === 1 ? 'ad' : 'ads'}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: spacing.lg
      }}>
        {ads.map(ad => (
          <SearchResultCard key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  );
}

export default SearchResultsGrid;
