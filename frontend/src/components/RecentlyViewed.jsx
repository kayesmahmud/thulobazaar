import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LazyImage from './LazyImage';
import { recentlyViewedUtils } from '../utils/recentlyViewed';

function RecentlyViewed({ showTitle = true, maxItems = 5 }) {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load recently viewed ads
    const loadRecentlyViewed = () => {
      const recent = recentlyViewedUtils.getRecentlyViewed();
      setRecentlyViewed(recent.slice(0, maxItems));
    };

    loadRecentlyViewed();

    // Listen for storage changes (in case user opens multiple tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'thulobazaar_recently_viewed') {
        loadRecentlyViewed();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [maxItems]);

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

  const handleAdClick = (adId) => {
    navigate(`/ad/${adId}`);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your recently viewed ads?')) {
      recentlyViewedUtils.clearRecentlyViewed();
      setRecentlyViewed([]);
    }
  };

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      {showTitle && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: 0
          }}>
            🕐 Recently Viewed
          </h3>
          <button
            onClick={handleClearAll}
            style={{
              fontSize: '12px',
              color: '#64748b',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Clear all
          </button>
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {recentlyViewed.map((ad) => (
          <div
            key={ad.id}
            onClick={() => handleAdClick(ad.id)}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8fafc';
              e.target.style.borderColor = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'transparent';
            }}
          >
            {/* Image */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {ad.primary_image ? (
                <LazyImage
                  src={`http://localhost:5000/uploads/ads/${ad.primary_image}`}
                  alt={ad.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  placeholder={
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      fontSize: '24px'
                    }}>
                      📦
                    </div>
                  }
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '24px'
                }}>
                  📦
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 4px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {ad.title}
              </h4>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#dc1e4a',
                marginBottom: '4px'
              }}>
                {formatPrice(ad.price)}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#64748b'
              }}>
                📍 {ad.location_name} • {formatDate(ad.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {recentlyViewed.length >= maxItems && (
        <div style={{
          textAlign: 'center',
          marginTop: '12px'
        }}>
          <button
            onClick={() => navigate('/recently-viewed')}
            style={{
              fontSize: '12px',
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            View all recently viewed ({recentlyViewedUtils.getRecentlyViewedCount()})
          </button>
        </div>
      )}
    </div>
  );
}

export default RecentlyViewed;