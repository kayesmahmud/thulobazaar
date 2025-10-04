import { styles, colors, spacing, typography } from '../../styles/theme';

function AdminStats({ stats }) {
  const statCards = [
    {
      value: stats.totalAds || 0,
      label: 'Total Ads',
      color: colors.primary
    },
    {
      value: stats.pendingAds || 0,
      label: 'Pending Review',
      color: '#f59e0b'
    },
    {
      value: stats.totalUsers || 0,
      label: 'Total Users',
      color: colors.secondary
    },
    {
      value: stats.totalViews || 0,
      label: 'Total Views',
      color: colors.success
    },
    {
      value: stats.todayAds || 0,
      label: "Today's Ads",
      color: '#8b5cf6'
    }
  ];

  return (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: spacing.lg,
        marginBottom: spacing['2xl']
      }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            style={{
              ...styles.card.default,
              textAlign: 'center',
              padding: spacing.xl
            }}
          >
            <div style={{
              fontSize: '36px',
              fontWeight: typography.fontWeight.bold,
              color: stat.color,
              marginBottom: spacing.sm
            }}>
              {stat.value}
            </div>
            <div style={{
              color: colors.text.secondary,
              fontSize: typography.fontSize.sm
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Top Categories */}
      {stats.topCategories && stats.topCategories.length > 0 && (
        <div style={styles.card.default}>
          <h3 style={{
            ...styles.heading.h3,
            marginBottom: spacing.lg
          }}>
            Top Categories
          </h3>
          <div style={{ display: 'grid', gap: spacing.md }}>
            {stats.topCategories.map((category, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing.sm
                }}
              >
                <span style={{ color: colors.text.primary }}>{category.name}</span>
                <span style={{
                  ...styles.badge.default,
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.secondary
                }}>
                  {category.count} ads
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStats;
