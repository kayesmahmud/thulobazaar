import PropTypes from 'prop-types';
import { styles, colors, spacing, typography } from '../../styles/theme';

function ProfileStats({ profile }) {
  const stats = [
    {
      icon: '📋',
      label: 'Total Ads',
      value: profile?.total_ads || 0,
      color: colors.primary
    },
    {
      icon: '✅',
      label: 'Active Ads',
      value: profile?.active_ads || 0,
      color: colors.success
    },
    {
      icon: '⏳',
      label: 'Pending',
      value: profile?.pending_ads || 0,
      color: colors.warning
    },
    {
      icon: '👁️',
      label: 'Total Views',
      value: profile?.total_views || 0,
      color: colors.secondary
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: spacing.lg,
      marginBottom: spacing['2xl']
    }}>
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{
            ...styles.card.default,
            textAlign: 'center',
            padding: spacing.xl
          }}
        >
          <div style={{
            fontSize: '48px',
            marginBottom: spacing.sm
          }}>
            {stat.icon}
          </div>
          <div style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: stat.color,
            marginBottom: spacing.xs
          }}>
            {stat.value}
          </div>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.medium
          }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

ProfileStats.propTypes = {
  profile: PropTypes.shape({
    total_ads: PropTypes.number,
    active_ads: PropTypes.number,
    pending_ads: PropTypes.number,
    total_views: PropTypes.number
  })
};

export default ProfileStats;
