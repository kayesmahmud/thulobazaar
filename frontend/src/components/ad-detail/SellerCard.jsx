import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { styles, colors, spacing, borderRadius, typography } from '../../styles/theme';
import { UPLOADS_BASE_URL } from '../../config/env.js';
import VerificationBadge from '../common/VerificationBadge';
import { getVerificationDisplayText } from '../../constants/verificationStatus.ts';

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
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '20px'
      }}>Contact Seller</h3>

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
              src={`${UPLOADS_BASE_URL}/avatars/${ad.seller_avatar}`}
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
              <VerificationBadge
                businessVerificationStatus={ad.business_verification_status}
                individualVerified={ad.individual_verified}
                size={20}
              />
            </div>
            <div style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
              {getVerificationDisplayText(ad.business_verification_status, ad.individual_verified)}
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
      <div style={{ marginBottom: '20px' }}>
        {/* Phone Number Button */}
        <button
          onClick={onPhoneReveal}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '12px',
            backgroundColor: phoneRevealed ? '#10b981' : '#dc1e4a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>📞 {phoneRevealed ? ad.seller_phone : formatPhoneDisplay(ad.seller_phone)}</span>
          {!phoneRevealed && (
            <span style={{ fontSize: '12px', fontWeight: '400', opacity: 0.9 }}>
              Click to reveal full number
            </span>
          )}
        </button>

        {/* WhatsApp Button */}
        {phoneRevealed && ad.seller_phone && (
          <button
            onClick={handleWhatsAppClick}
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '12px',
              backgroundColor: '#25d366',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            💬 WhatsApp
          </button>
        )}

        {/* Email Seller Button */}
        <button
          onClick={onEmailSeller}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '12px',
            backgroundColor: 'transparent',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          📧 Email Seller
        </button>
      </div>

      {/* Safety Tips */}
      <div style={{
        backgroundColor: '#eff6ff',
        borderLeft: '4px solid #3b82f6',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontWeight: '600',
          marginBottom: '8px',
          color: '#1e40af',
          fontSize: '15px'
        }}>
          🛡️ Safety Tips
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '14px',
          color: '#1e40af',
          lineHeight: '1.6'
        }}>
          <li>Meet in public places</li>
          <li>Don't pay in advance</li>
          <li>Inspect item before buying</li>
          <li>Report suspicious activity</li>
        </ul>
      </div>

      <div style={{
        fontSize: '13px',
        color: '#64748b',
        textAlign: 'center',
        padding: '12px',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #fbbf24'
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
