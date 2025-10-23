import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import LazyImage from './LazyImage';
import { formatDateTime } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { generateAdUrl } from '../utils/urlUtils';
import { UPLOADS_BASE_URL } from '../config/env.js';
import VerificationBadge from './common/VerificationBadge';
import { BusinessVerificationStatus } from '../constants/verificationStatus.ts';

function AdCard({ ad }) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };


  const handleCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Use seo_slug if available, otherwise generate URL
      const adUrl = ad.seo_slug ? `/ad/${ad.seo_slug}` : generateAdUrl(ad);
      navigate(`/${language}${adUrl}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to direct window navigation if React Router fails
      const adUrl = ad.seo_slug ? `/ad/${ad.seo_slug}` : generateAdUrl(ad);
      window.location.href = `/${language}${adUrl}`;
    }
  };

  return (
    <div className="ad-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="ad-image" style={{ position: 'relative' }}>
        {ad.is_featured && <div className="ad-badge">FEATURED</div>}

        {ad.primary_image ? (
          <LazyImage
            src={`${UPLOADS_BASE_URL}/ads/${ad.primary_image}`}
            alt={ad.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '8px 8px 0 0'
            }}
            placeholder={
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: '#94a3b8'
              }}>
                {ad.category_icon || '📦'}
              </div>
            }
            onError={() => {
              // Error handling is now built into LazyImage
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: '#f1f5f9',
              fontSize: '48px',
              borderRadius: '8px 8px 0 0'
            }}
          >
            {ad.category_icon || '📦'}
          </div>
        )}
      </div>

      <div className="ad-content">
        <h3 className="ad-title">{ad.title}</h3>

        <div className="ad-location">
          <span>📍</span>
          <span>{ad.location_name}</span>
        </div>

        <div className="ad-price">{formatPrice(ad.price)}</div>

        <div className="ad-meta">
          <span className="ad-time">🕒 {formatDateTime(ad.created_at)}</span>
        </div>

        <div className="ad-seller" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong>{ad.seller_name}</strong>
          <VerificationBadge
            businessVerificationStatus={ad.business_verification_status}
            individualVerified={ad.individual_verified}
            size={16}
          />
        </div>
      </div>
    </div>
  );
}

AdCard.propTypes = {
  ad: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    primary_image: PropTypes.string,
    location_name: PropTypes.string.isRequired,
    category_icon: PropTypes.string,
    created_at: PropTypes.string.isRequired,
    seller_name: PropTypes.string.isRequired,
    is_featured: PropTypes.bool,
    business_verification_status: PropTypes.oneOf([
      BusinessVerificationStatus.PENDING,
      BusinessVerificationStatus.APPROVED,
      BusinessVerificationStatus.REJECTED,
      null
    ]),
    individual_verified: PropTypes.bool
  }).isRequired
};

export default AdCard;