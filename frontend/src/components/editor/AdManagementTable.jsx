import { styles, colors, spacing, typography } from '../../styles/theme';

function AdManagementTable({
  ads,
  loading,
  selectedAds,
  onToggleSelect,
  onToggleSelectAll,
  onApprove,
  onReject,
  onDelete,
  onRestore
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
        <p>Loading ads...</p>
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
            <th style={tableHeaderStyle}>
              <input
                type="checkbox"
                checked={ads.length > 0 && selectedAds.length === ads.length}
                onChange={onToggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </th>
            <th style={tableHeaderStyle}>ID</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'left', minWidth: '200px' }}>Title</th>
            <th style={tableHeaderStyle}>Category</th>
            <th style={tableHeaderStyle}>Seller</th>
            <th style={tableHeaderStyle}>Price</th>
            <th style={tableHeaderStyle}>Status</th>
            <th style={tableHeaderStyle}>Created</th>
            <th style={tableHeaderStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ads.map(ad => (
            <tr
              key={ad.id}
              style={{
                borderBottom: `1px solid ${colors.border.default}`,
                backgroundColor: ad.deleted_at ? colors.background.tertiary : 'transparent',
                opacity: ad.deleted_at ? 0.6 : 1
              }}
            >
              <td style={tableCellStyle}>
                <input
                  type="checkbox"
                  checked={selectedAds.includes(ad.id)}
                  onChange={() => onToggleSelect(ad.id)}
                  style={{ cursor: 'pointer' }}
                />
              </td>
              <td style={tableCellStyle}>{ad.id}</td>
              <td style={{ ...tableCellStyle, fontWeight: typography.fontWeight.medium }}>
                {ad.title}
              </td>
              <td style={tableCellStyle}>{ad.category_name}</td>
              <td style={tableCellStyle}>{ad.seller_name}</td>
              <td style={{ ...tableCellStyle, fontWeight: typography.fontWeight.semibold }}>
                रू {ad.price}
              </td>
              <td style={tableCellStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                  <span style={getStatusBadgeStyle(ad.status)}>
                    {ad.status}
                  </span>
                  {ad.deleted_at && (
                    <span style={{
                      ...styles.badge.default,
                      backgroundColor: '#64748b',
                      color: 'white',
                      fontSize: typography.fontSize.xs
                    }}>
                      Deleted
                    </span>
                  )}
                </div>
              </td>
              <td style={tableCellStyle}>
                {new Date(ad.created_at).toLocaleDateString()}
              </td>
              <td style={{ ...tableCellStyle, whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', gap: spacing.xs }}>
                  {ad.deleted_at ? (
                    <button
                      onClick={() => onRestore(ad.id)}
                      style={{
                        ...styles.button.small,
                        backgroundColor: colors.secondary,
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Restore
                    </button>
                  ) : (
                    <>
                      {ad.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onApprove(ad.id)}
                            style={{
                              ...styles.button.small,
                              backgroundColor: colors.success,
                              color: 'white',
                              border: 'none',
                              padding: `${spacing.xs} ${spacing.sm}`
                            }}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => onReject(ad.id)}
                            style={{
                              ...styles.button.small,
                              backgroundColor: colors.error,
                              color: 'white',
                              border: 'none',
                              padding: `${spacing.xs} ${spacing.sm}`
                            }}
                            title="Reject"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onDelete(ad.id)}
                        style={{
                          ...styles.button.small,
                          backgroundColor: '#64748b',
                          color: 'white',
                          border: 'none',
                          padding: `${spacing.xs} ${spacing.sm}`
                        }}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {ads.length === 0 && (
        <div style={{
          padding: spacing['3xl'],
          textAlign: 'center',
          color: colors.text.secondary
        }}>
          No ads found
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

const getStatusBadgeStyle = (status) => {
  const baseStyle = {
    ...styles.badge.default,
    fontSize: typography.fontSize.xs,
    textTransform: 'capitalize'
  };

  switch (status) {
    case 'pending':
      return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' };
    case 'approved':
      return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' };
    case 'rejected':
      return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' };
    default:
      return baseStyle;
  }
};

export default AdManagementTable;
