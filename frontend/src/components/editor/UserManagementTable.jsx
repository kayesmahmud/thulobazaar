import { styles, colors, spacing, typography } from '../../styles/theme';

function UserManagementTable({
  users,
  loading,
  onSuspend,
  onUnsuspend,
  onVerify
}) {
  if (loading) {
    return (
      <div style={{
        ...styles.card.default,
        padding: spacing['3xl'],
        textAlign: 'center',
        color: colors.text.secondary
      }}>
        <div style={{ fontSize: '48px', marginBottom: spacing.lg }}>⏳</div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.card.default,
      padding: 0,
      overflow: 'auto'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{
            backgroundColor: colors.background.secondary,
            borderBottom: `2px solid ${colors.border.default}`
          }}>
            <th style={tableHeaderStyle}>ID</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Name</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Email</th>
            <th style={tableHeaderStyle}>Role</th>
            <th style={tableHeaderStyle}>Total Ads</th>
            <th style={tableHeaderStyle}>Status</th>
            <th style={tableHeaderStyle}>Joined</th>
            <th style={tableHeaderStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr
              key={user.id}
              style={{
                borderBottom: `1px solid ${colors.border.default}`
              }}
            >
              <td style={tableCellStyle}>{user.id}</td>
              <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  {user.full_name}
                  {user.is_verified && (
                    <span style={{
                      ...styles.badge.default,
                      backgroundColor: colors.success,
                      color: 'white',
                      fontSize: typography.fontSize.xs,
                      padding: `2px 6px`
                    }}>
                      ✓
                    </span>
                  )}
                </div>
              </td>
              <td style={{ ...tableCellStyle, textAlign: 'left', color: colors.text.secondary }}>
                {user.email}
              </td>
              <td style={tableCellStyle}>
                <span style={{
                  ...styles.badge.default,
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.primary,
                  textTransform: 'capitalize'
                }}>
                  {user.role}
                </span>
              </td>
              <td style={tableCellStyle}>
                <span style={{ fontWeight: typography.fontWeight.semibold }}>
                  {user.total_ads}
                </span>
              </td>
              <td style={tableCellStyle}>
                {user.is_suspended ? (
                  <span style={{
                    ...styles.badge.default,
                    backgroundColor: '#fee2e2',
                    color: '#991b1b'
                  }}>
                    Suspended
                  </span>
                ) : (
                  <span style={{
                    ...styles.badge.default,
                    backgroundColor: '#d1fae5',
                    color: '#065f46'
                  }}>
                    Active
                  </span>
                )}
              </td>
              <td style={tableCellStyle}>
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td style={{ ...tableCellStyle, whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'center' }}>
                  {user.is_suspended ? (
                    <button
                      onClick={() => onUnsuspend(user.id)}
                      style={{
                        ...styles.button.small,
                        backgroundColor: colors.success,
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      onClick={() => onSuspend(user.id)}
                      style={{
                        ...styles.button.small,
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Suspend
                    </button>
                  )}
                  {!user.is_verified && (
                    <button
                      onClick={() => onVerify(user.id)}
                      style={{
                        ...styles.button.small,
                        backgroundColor: colors.secondary,
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Verify
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div style={{
          padding: spacing['3xl'],
          textAlign: 'center',
          color: colors.text.secondary
        }}>
          No users found
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle = {
  padding: spacing.md,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: colors.text.primary,
  textAlign: 'center'
};

const tableCellStyle = {
  padding: spacing.md,
  fontSize: typography.fontSize.sm,
  color: colors.text.primary,
  textAlign: 'center'
};

export default UserManagementTable;
