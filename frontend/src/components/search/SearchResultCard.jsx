import { useNavigate } from 'react-router-dom';
import { styles, colors, spacing, typography, borderRadius } from '../../styles/theme';
import { UPLOADS_BASE_URL } from '../../config/env.js';
import VerificationBadge from '../common/VerificationBadge';

function SearchResultCard({ ad }) {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleClick = () => {
    navigate(`/en/ad/${ad.id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        ...styles.card.default,
        cursor: 'pointer',
        transition: 'all 0.2s',
        overflow: 'hidden',
        padding: 0
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = styles.card.default.boxShadow;
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Image */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '66.67%', // 3:2 aspect ratio
        backgroundColor: colors.background.tertiary,
        overflow: 'hidden'
      }}>
        {ad.primary_image ? (
          <img
            src={`${UPLOADS_BASE_URL}/ads/${ad.primary_image}`}
            alt={ad.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '64px'
          }}>
            📦
          </div>
        )}

        {/* Featured Badge */}
        {ad.is_featured && (
          <div style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            ...styles.badge.featured
          }}>
            ⭐ FEATURED
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: spacing.lg }}>
        {/* Title */}
        <h3 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: spacing.sm,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {ad.title}
        </h3>

        {/* Price */}
        <div style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.primary,
          marginBottom: spacing.md
        }}>
          {formatPrice(ad.price)}
        </div>

        {/* Meta Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <span>📍</span>
            <span>{ad.location_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <span>📁</span>
            <span>{ad.category_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <span>🕒</span>
            <span>{formatDate(ad.created_at)}</span>
          </div>
        </div>

        {/* Condition Badge */}
        {ad.condition && (
          <div style={{
            marginTop: spacing.md,
            display: 'inline-block',
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.full,
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            textTransform: 'capitalize'
          }}>
            {ad.condition.replace('-', ' ')}
          </div>
        )}

        {/* Seller Info with Verification Badge */}
        {ad.seller_name && (
          <div style={{
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            <span style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary
            }}>
              Seller:
            </span>
            <span style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary
            }}>
              {ad.seller_name}
            </span>
            <VerificationBadge
              businessVerificationStatus={ad.business_verification_status}
              individualVerified={ad.individual_verified}
              size={16}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResultCard;
