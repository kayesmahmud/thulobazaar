import { styles, colors, spacing, typography } from '../../styles/theme';

function ActivityLogPanel({ logs, loading }) {
  if (loading) {
    return (
      <div style={{
        ...styles.card.default,
        padding: spacing['3xl'],
        textAlign: 'center',
        color: colors.text.secondary
      }}>
        <div style={{ fontSize: '48px', marginBottom: spacing.lg }}>⏳</div>
        <p>Loading activity logs...</p>
      </div>
    );
  }

  const getActionIcon = (actionType) => {
    if (actionType.includes('approve')) return '✅';
    if (actionType.includes('reject')) return '❌';
    if (actionType.includes('delete')) return '🗑️';
    if (actionType.includes('suspend')) return '🚫';
    if (actionType.includes('verify')) return '✓';
    if (actionType.includes('create')) return '➕';
    if (actionType.includes('update')) return '✏️';
    return '📝';
  };

  const getActionColor = (actionType) => {
    if (actionType.includes('approve')) return colors.success;
    if (actionType.includes('reject')) return colors.error;
    if (actionType.includes('delete')) return '#64748b';
    if (actionType.includes('suspend')) return '#f59e0b';
    if (actionType.includes('verify')) return colors.secondary;
    return colors.text.secondary;
  };

  return (
    <div style={{
      ...styles.card.default,
      padding: 0
    }}>
      <div style={{
        padding: spacing.lg,
        borderBottom: `1px solid ${colors.border.default}`
      }}>
        <h2 style={{
          ...styles.heading.h2,
          margin: 0
        }}>
          Recent Activity
        </h2>
      </div>

      <div style={{
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        {logs.map(log => (
          <div
            key={log.id}
            style={{
              display: 'flex',
              gap: spacing.md,
              padding: spacing.lg,
              borderBottom: `1px solid ${colors.border.default}`,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: colors.background.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              {getActionIcon(log.action_type)}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                flexWrap: 'wrap',
                marginBottom: spacing.xs
              }}>
                <strong style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.primary
                }}>
                  {log.admin_name}
                </strong>
                <span style={{
                  ...styles.badge.default,
                  backgroundColor: colors.background.tertiary,
                  color: getActionColor(log.action_type),
                  fontSize: typography.fontSize.xs,
                  textTransform: 'capitalize'
                }}>
                  {log.action_type.replace(/_/g, ' ')}
                </span>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary
                }}>
                  {log.target_type} #{log.target_id}
                </span>
              </div>

              <div style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}>
                {new Date(log.created_at).toLocaleString()}
              </div>

              {log.ip_address && (
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                  marginTop: spacing.xs
                }}>
                  IP: {log.ip_address}
                </div>
              )}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div style={{
            padding: spacing['3xl'],
            textAlign: 'center',
            color: colors.text.secondary
          }}>
            <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📋</div>
            <p>No activity logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityLogPanel;
