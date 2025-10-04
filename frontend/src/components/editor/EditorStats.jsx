import { styles, colors, spacing, typography } from '../../styles/theme';

function EditorStats({ stats }) {
  if (!stats) return null;

  const statCards = [
    {
      icon: '📊',
      value: stats.totalAds,
      label: 'Total Ads',
      color: colors.primary
    },
    {
      icon: '⏳',
      value: stats.pending_ads,
      label: 'Pending Review',
      color: '#f59e0b'
    },
    {
      icon: '✅',
      value: stats.approved_ads,
      label: 'Approved Ads',
      color: colors.success
    },
    {
      icon: '❌',
      value: stats.rejected_ads,
      label: 'Rejected Ads',
      color: colors.error
    },
    {
      icon: '🗑️',
      value: stats.deleted_ads,
      label: 'Deleted Ads',
      color: '#64748b'
    },
    {
      icon: '👥',
      value: stats.totalUsers,
      label: 'Total Users',
      color: colors.secondary
    },
    {
      icon: '🚫',
      value: stats.suspended_users,
      label: 'Suspended Users',
      color: '#ef4444'
    },
    {
      icon: '✓',
      value: stats.verified_users,
      label: 'Verified Users',
      color: '#10b981'
    }
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: spacing.lg,
        marginBottom: spacing.xl
      }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            style={{
              ...styles.card.default,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              padding: spacing.lg,
              borderLeft: `4px solid ${stat.color}`,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = styles.card.default.boxShadow;
            }}
          >
            <div style={{
              fontSize: '48px',
              lineHeight: 1
            }}>
              {stat.icon}
            </div>
            <div>
              <h3 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
                marginBottom: spacing.xs
              }}>
                {stat.value}
              </h3>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                margin: 0
              }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div style={{
        ...styles.card.flat,
        padding: spacing.lg,
        backgroundColor: colors.primaryLight,
        borderLeft: `4px solid ${colors.primary}`
      }}>
        <div style={{
          display: 'flex',
          gap: spacing['2xl'],
          flexWrap: 'wrap'
        }}>
          <div>
            <strong style={{ color: colors.primary }}>Today:</strong>{' '}
            <span style={{ color: colors.text.primary }}>
              {stats.ads_today} new ads, {stats.users_today} new users
            </span>
          </div>
          <div>
            <strong style={{ color: colors.primary }}>This Month:</strong>{' '}
            <span style={{ color: colors.text.primary }}>
              {stats.ads_this_month} ads, {stats.users_this_month} users
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorStats;
