import { useNavigate } from 'react-router-dom';
import LazyImage from './LazyImage';

function AdCard({ ad }) {
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

  const handleCardClick = () => {
    navigate(`/ad/${ad.id}`);
  };

  return (
    <div className="ad-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="ad-image" style={{ position: 'relative' }}>
        {ad.is_featured && <div className="ad-badge">FEATURED</div>}

        {ad.primary_image ? (
          <LazyImage
            src={`http://localhost:5000/uploads/ads/${ad.primary_image}`}
            alt={ad.title}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '8px 8px 0 0'
            }}
            placeholder={
              <div style={{
                width: '100%',
                height: '200px',
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
              height: '200px',
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
          <span className="ad-time">{formatDate(ad.created_at)}</span>
          <span className="ad-views">👁️ {ad.view_count}</span>
        </div>

        <div className="ad-seller">
          <strong>{ad.seller_name}</strong>
        </div>
      </div>
    </div>
  );
}

export default AdCard;