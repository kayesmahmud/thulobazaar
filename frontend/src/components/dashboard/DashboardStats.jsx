import { styles, colors, spacing, typography } from '../../styles/theme';

function DashboardStats({ stats }) {
  const statCards = [
    {
      icon: '📋',
      label: 'Total Ads',
      value: stats?.total || 0,
      color: colors.primary,
      bgColor: colors.primaryLight
    },
    {
      icon: '✅',
      label: 'Active',
      value: stats?.active || 0,
      color: colors.success,
      bgColor: colors.successLight
    },
    {
      icon: '⏳',
      label: 'Pending Review',
      value: stats?.pending || 0,
      color: colors.warning,
      bgColor: colors.warningLight
    },
    {
      icon: '❌',
      label: 'Rejected',
      value: stats?.rejected || 0,
      color: colors.danger,
      bgColor: colors.dangerLight
    },
    {
      icon: '👁️',
      label: 'Total Views',
      value: stats?.totalViews || 0,
      color: colors.secondary,
      bgColor: colors.secondaryLight
    }
  ];

  return (
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
            backgroundColor: stat.bgColor,
            padding: spacing.xl,
            borderRadius: '12px',
            border: `1px solid ${stat.color}20`,
            textAlign: 'center'
          }}
        >
          <div style={{
            fontSize: '40px',
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

export default DashboardStats;
