import { styles, colors, spacing, typography } from '../../styles/theme';

function BusinessVerificationTable({
  requests,
  loading,
  onApprove,
  onReject
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
        <p>Loading business requests...</p>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.card.default,
      padding: 0,
      overflow: 'auto'
    }}>
      <div style={{
        padding: spacing.lg,
        borderBottom: `1px solid ${colors.border.default}`
      }}>
        <h2 style={{
          ...styles.heading.h2,
          margin: 0
        }}>
          Business Verification Requests
        </h2>
      </div>

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
            <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>User</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Business Name</th>
            <th style={tableHeaderStyle}>Category</th>
            <th style={tableHeaderStyle}>Payment</th>
            <th style={tableHeaderStyle}>Submitted</th>
            <th style={tableHeaderStyle}>Documents</th>
            <th style={tableHeaderStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(request => (
            <tr
              key={request.id}
              style={{
                borderBottom: `1px solid ${colors.border.default}`
              }}
            >
              <td style={tableCellStyle}>{request.id}</td>
              <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                <div>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>
                    {request.user_name}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary
                  }}>
                    {request.user_email}
                  </div>
                </div>
              </td>
              <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                <div>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>
                    {request.business_name}
                  </div>
                  {request.business_category && (
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary
                    }}>
                      {request.business_category}
                    </div>
                  )}
                </div>
              </td>
              <td style={tableCellStyle}>
                {request.business_category || '-'}
              </td>
              <td style={tableCellStyle}>
                <div>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>
                    रू {request.payment_amount || '0'}
                  </div>
                  {request.payment_reference && (
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary
                    }}>
                      Ref: {request.payment_reference}
                    </div>
                  )}
                </div>
              </td>
              <td style={tableCellStyle}>
                {new Date(request.created_at).toLocaleDateString()}
              </td>
              <td style={tableCellStyle}>
                {request.business_license_document ? (
                  <a
                    href={`http://localhost:5000/uploads/business-licenses/${request.business_license_document}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...styles.link.default,
                      fontSize: typography.fontSize.sm
                    }}
                  >
                    View License
                  </a>
                ) : (
                  <span style={{ color: colors.text.muted }}>-</span>
                )}
              </td>
              <td style={{ ...tableCellStyle, whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'center' }}>
                  <button
                    onClick={() => onApprove(request.id)}
                    style={{
                      ...styles.button.small,
                      backgroundColor: colors.success,
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => onReject(request.id)}
                    style={{
                      ...styles.button.small,
                      backgroundColor: colors.error,
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {requests.length === 0 && (
        <div style={{
          padding: spacing['3xl'],
          textAlign: 'center',
          color: colors.text.secondary
        }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📋</div>
          <p>No pending business verification requests</p>
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

export default BusinessVerificationTable;
