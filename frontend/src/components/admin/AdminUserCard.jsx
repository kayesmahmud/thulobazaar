import { styles, colors, spacing, typography } from '../../styles/theme';

function AdminUserCard({ user }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      padding: spacing.lg,
      borderBottom: `1px solid ${colors.border.default}`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: spacing.lg,
      alignItems: 'center'
    }}>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.xs
        }}>
          <h4 style={{
            margin: 0,
            color: colors.text.primary,
            fontSize: typography.fontSize.base
          }}>
            {user.full_name}
          </h4>
          {!user.is_active && (
            <span style={{
              ...styles.badge.default,
              backgroundColor: colors.error,
              color: 'white',
              fontSize: '10px',
              fontWeight: typography.fontWeight.bold
            }}>
              INACTIVE
            </span>
          )}
        </div>

        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          marginBottom: spacing.xs
        }}>
          📧 {user.email} • 📞 {user.phone || 'No phone'}
        </div>

        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          📍 {user.location_name || 'No location'} • 🕒 Joined {formatDate(user.created_at)}
        </div>

        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          📝 {user.total_ads} total ads • ✅ {user.approved_ads} approved
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs
      }}>
        <button
          style={{
            ...styles.button.small,
            backgroundColor: colors.secondary,
            color: 'white',
            border: 'none'
          }}
        >
          View Ads
        </button>
        <button
          style={{
            ...styles.button.small,
            backgroundColor: user.is_active ? colors.error : colors.success,
            color: 'white',
            border: 'none'
          }}
        >
          {user.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

export default AdminUserCard;
