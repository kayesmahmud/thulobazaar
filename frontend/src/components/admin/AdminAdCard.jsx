import { useNavigate } from 'react-router-dom';
import { styles, colors, spacing, typography } from '../../styles/theme';
import { generateAdUrl } from '../../utils/urlUtils';

function AdminAdCard({ ad, onStatusChange }) {
  const navigate = useNavigate();

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusStyle = (status) => {
    const baseStyle = {
      ...styles.badge.default,
      textTransform: 'uppercase',
      fontSize: '10px',
      fontWeight: typography.fontWeight.bold
    };

    switch (status) {
      case 'approved':
        return { ...baseStyle, backgroundColor: colors.success, color: 'white' };
      case 'rejected':
        return { ...baseStyle, backgroundColor: colors.error, color: 'white' };
      case 'pending':
        return { ...baseStyle, backgroundColor: '#f59e0b', color: 'white' };
      default:
        return { ...baseStyle, backgroundColor: '#6b7280', color: 'white' };
    }
  };

  return (
    <div style={{
      padding: spacing.lg,
      borderBottom: `1px solid ${colors.border.default}`,
      display: 'grid',
      gridTemplateColumns: '80px 1fr auto',
      gap: spacing.lg,
      alignItems: 'center'
    }}>
      {/* Ad Image */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: colors.background.tertiary
      }}>
        {ad.primary_image ? (
          <img
            src={`http://localhost:5000/uploads/ads/${ad.primary_image}`}
            alt={ad.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {ad.category_icon || '📦'}
          </div>
        )}
      </div>

      {/* Ad Details */}
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
            {ad.title}
          </h4>
          <span style={getStatusStyle(ad.status)}>
            {ad.status}
          </span>
        </div>

        <div style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: colors.primary,
          marginBottom: spacing.xs
        }}>
          {formatPrice(ad.price)}
        </div>

        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          📍 {ad.location_name} • 🕒 {formatDate(ad.created_at)}
        </div>

        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          📧 {ad.user_email} • 📞 {ad.seller_phone}
        </div>

        {ad.status_reason && (
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.error,
            marginTop: spacing.xs,
            fontStyle: 'italic'
          }}>
            Reason: {ad.status_reason}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs
      }}>
        <button
          onClick={() => navigate(`/en${generateAdUrl(ad)}`)}
          style={{
            ...styles.button.small,
            backgroundColor: colors.secondary,
            color: 'white',
            border: 'none'
          }}
        >
          View
        </button>

        {ad.status === 'pending' && (
          <>
            <button
              onClick={() => onStatusChange(ad.id, 'approved')}
              style={{
                ...styles.button.small,
                backgroundColor: colors.success,
                color: 'white',
                border: 'none'
              }}
            >
              Approve
            </button>
            <button
              onClick={() => {
                const reason = prompt('Rejection reason (optional):');
                onStatusChange(ad.id, 'rejected', reason || '');
              }}
              style={{
                ...styles.button.small,
                backgroundColor: colors.error,
                color: 'white',
                border: 'none'
              }}
            >
              Reject
            </button>
          </>
        )}

        {ad.status !== 'pending' && (
          <button
            onClick={() => onStatusChange(ad.id, 'pending')}
            style={{
              ...styles.button.small,
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none'
            }}
          >
            Reset to Pending
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminAdCard;
