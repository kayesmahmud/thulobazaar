import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { styles, colors, spacing, borderRadius, typography } from '../../styles/theme';

function SellerCard({ ad, phoneRevealed, onPhoneReveal, onEmailSeller, formatPhoneDisplay }) {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    const whatsappNumber = ad.seller_phone.replace(/[^0-9]/g, '');
    const message = `Hi! I'm interested in your ad: ${ad.title}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleProfileClick = () => {
    const currentLang = window.location.pathname.split('/')[1] || 'en';
    if (ad.account_type === 'business' && ad.shop_slug) {
      navigate(`/${currentLang}/shop/${ad.shop_slug}`);
    } else if (ad.account_type === 'individual' && ad.seller_slug) {
      navigate(`/${currentLang}/seller/${ad.seller_slug}`);
    }
  };

  return (
    <div style={styles.card.default}>
      <h3 style={styles.heading.h3}>Contact Seller</h3>

      {/* Seller Info */}
      <div style={{ marginBottom: spacing.xl }}>
        <div
          onClick={handleProfileClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.md,
            cursor: 'pointer',
            padding: spacing.md,
            borderRadius: borderRadius.md,
            transition: 'background-color 0.2s ease',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {ad.seller_avatar ? (
            <img
              src={`http://localhost:5000/uploads/avatars/${ad.seller_avatar}`}
              alt={ad.seller_name}
              style={styles.avatar.medium}
            />
          ) : (
            <div style={styles.avatar.placeholder.medium}>
              {ad.seller_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              {ad.business_verification_status === 'approved' && ad.business_name ? ad.business_name : ad.seller_name}
              {ad.business_verification_status === 'approved' && (
                <img
                  src="/golden-badge.png"
                  alt="Verified Business"
                  title="Verified Business"
                  style={{ width: '20px', height: '20px' }}
                />
              )}
              {ad.individual_verified && (
                <img
                  src="/blue-badge.png"
                  alt="Verified Individual Seller"
                  title="Verified Individual Seller"
                  style={{ width: '20px', height: '20px' }}
                />
              )}
            </div>
            <div style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
              {ad.business_verification_status === 'approved' ? 'Verified Business Account' : ad.individual_verified ? 'Verified Seller' : 'Seller'}
            </div>
            <div style={{
              color: colors.primary,
              fontSize: typography.fontSize.xs,
              marginTop: spacing.xs
            }}>
              View Profile →
            </div>
          </div>
        </div>
      </div>

      {/* Contact Buttons */}
      <div style={{ marginBottom: spacing.xl }}>
        {/* Phone Number Button */}
        <button
          onClick={onPhoneReveal}
          style={{
            ...styles.button.primary,
            width: '100%',
            marginBottom: spacing.md,
            backgroundColor: phoneRevealed ? colors.success : colors.primary
          }}
        >
          📞 {phoneRevealed ? ad.seller_phone : formatPhoneDisplay(ad.seller_phone)}
          {!phoneRevealed && (
            <span style={{ fontSize: typography.fontSize.xs, display: 'block', marginTop: spacing.xs }}>
              Click to reveal full number
            </span>
          )}
        </button>

        {/* WhatsApp Button */}
        {phoneRevealed && ad.seller_phone && (
          <button
            onClick={handleWhatsAppClick}
            style={{
              ...styles.button.whatsapp,
              width: '100%',
              marginBottom: spacing.md
            }}
          >
            💬 WhatsApp
          </button>
        )}

        {/* Email Seller Button */}
        <button
          onClick={onEmailSeller}
          style={{
            ...styles.button.secondary,
            width: '100%',
            marginBottom: spacing.md
          }}
        >
          📧 Email Seller
        </button>
      </div>

      {/* Safety Tips */}
      <div style={styles.alert.info}>
        <div style={{ fontWeight: typography.fontWeight.bold, marginBottom: spacing.sm }}>
          🛡️ Safety Tips
        </div>
        <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
          <li>Meet in public places</li>
          <li>Don't pay in advance</li>
          <li>Inspect item before buying</li>
          <li>Report suspicious activity</li>
        </ul>
      </div>

      <div style={{
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        textAlign: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        marginTop: spacing.md
      }}>
        ⚠️ Stay safe! Meet in public places and verify items before payment.
      </div>
    </div>
  );
}

SellerCard.propTypes = {
  ad: PropTypes.shape({
    title: PropTypes.string.isRequired,
    seller_name: PropTypes.string.isRequired,
    seller_phone: PropTypes.string,
    seller_avatar: PropTypes.string,
    business_name: PropTypes.string,
    business_verification_status: PropTypes.string,
    account_type: PropTypes.string,
    shop_slug: PropTypes.string,
    seller_slug: PropTypes.string
  }).isRequired,
  phoneRevealed: PropTypes.bool.isRequired,
  onPhoneReveal: PropTypes.func.isRequired,
  onEmailSeller: PropTypes.func.isRequired,
  formatPhoneDisplay: PropTypes.func.isRequired
};

export default SellerCard;
