import { useNavigate } from 'react-router-dom';
import { styles, colors, spacing, typography, borderRadius } from '../../styles/theme';
import { UPLOADS_BASE_URL } from '../../config/env.js';

function DashboardAdCard({ ad, onEdit, onDelete }) {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    const statusConfig = {
      approved: { label: 'Active', color: colors.success, bg: colors.successLight },
      pending: { label: 'Pending', color: colors.warning, bg: colors.warningLight },
      rejected: { label: 'Rejected', color: colors.danger, bg: colors.dangerLight }
    };

    const config = statusConfig[ad.status] || statusConfig.pending;

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: `${spacing.xs} ${spacing.md}`,
        borderRadius: borderRadius.full,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold
      }}>
        {config.label}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={{
      ...styles.card.default,
      display: 'flex',
      gap: spacing.lg,
      padding: spacing.lg,
      transition: 'all 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = styles.card.default.boxShadow;
      e.currentTarget.style.transform = 'none';
    }}
    >
      {/* Image */}
      <div
        onClick={() => navigate(`/en/ad/${ad.id}`)}
        style={{
          width: '120px',
          height: '120px',
          flexShrink: 0,
          borderRadius: borderRadius.md,
          overflow: 'hidden',
          backgroundColor: colors.background.tertiary
        }}
      >
        {ad.primary_image ? (
          <img
            src={`${UPLOADS_BASE_URL}/ads/${ad.primary_image}`}
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
            fontSize: '48px'
          }}>
            📦
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: spacing.sm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs }}>
            <h3
              onClick={() => navigate(`/en/ad/${ad.id}`)}
              style={{
                ...styles.heading.h3,
                margin: 0,
                fontSize: typography.fontSize.lg,
                cursor: 'pointer',
                color: colors.text.primary
              }}
            >
              {ad.title}
            </h3>
            {getStatusBadge()}
            {ad.is_featured && (
              <span style={styles.badge.featured}>
                ⭐ FEATURED
              </span>
            )}
          </div>

          <div style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.primary,
            marginBottom: spacing.sm
          }}>
            {formatPrice(ad.price)}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: spacing.lg,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          marginBottom: spacing.md
        }}>
          <span>📍 {ad.location_name}</span>
          <span>📁 {ad.category_name}</span>
          <span>👁️ {ad.view_count} views</span>
          <span>🕒 {formatDate(ad.created_at)}</span>
        </div>

        {/* Rejection Reason */}
        {ad.status === 'rejected' && ad.status_reason && (
          <div style={{
            ...styles.alert.danger,
            marginBottom: spacing.md,
            padding: spacing.sm
          }}>
            <strong>Rejection reason:</strong> {ad.status_reason}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: spacing.md }}>
          <button
            onClick={() => navigate(`/en/ad/${ad.id}`)}
            style={{
              ...styles.button.secondary,
              padding: `${spacing.sm} ${spacing.lg}`,
              fontSize: typography.fontSize.sm
            }}
          >
            👁️ View
          </button>
          <button
            onClick={() => onEdit(ad.id)}
            style={{
              ...styles.button.primary,
              padding: `${spacing.sm} ${spacing.lg}`,
              fontSize: typography.fontSize.sm
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(ad.id)}
            style={{
              ...styles.button.danger,
              padding: `${spacing.sm} ${spacing.lg}`,
              fontSize: typography.fontSize.sm
            }}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardAdCard;
