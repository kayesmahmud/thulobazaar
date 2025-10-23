'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LazyImage from './LazyImage';
import { recentlyViewedUtils, formatPrice, formatDateTime, type RecentlyViewedAd } from '@thulobazaar/utils';

interface RecentlyViewedProps {
  lang: string;
  showTitle?: boolean;
  maxItems?: number;
}

export default function RecentlyViewed({
  lang,
  showTitle = true,
  maxItems = 5
}: RecentlyViewedProps) {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedAd[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load recently viewed ads
    const loadRecentlyViewed = () => {
      const recent = recentlyViewedUtils.getRecentlyViewed();
      setRecentlyViewed(recent.slice(0, maxItems));
    };

    loadRecentlyViewed();

    // Listen for storage changes (in case user opens multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'thulobazaar_recently_viewed') {
        loadRecentlyViewed();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [maxItems]);

  const handleAdClick = (adId: number, slug?: string) => {
    const adUrl = slug ? `/ad/${slug}` : `/ad/ad-${adId}`;
    router.push(`/${lang}${adUrl}`);
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
      padding: '1.25rem',
      marginBottom: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {showTitle && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0
          }}>
            🕐 Recently Viewed
          </h3>
          <button
            onClick={handleClearAll}
            style={{
              fontSize: '0.75rem',
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
        gap: '0.75rem'
      }}>
        {recentlyViewed.map((ad) => (
          <div
            key={ad.id}
            onClick={() => handleAdClick(ad.id, (ad as any).slug)}
            style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
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
                  src={`${process.env.NEXT_PUBLIC_UPLOADS_BASE_URL || ''}/ads/${ad.primary_image}`}
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
                      fontSize: '1.5rem'
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
                  fontSize: '1.5rem'
                }}>
                  📦
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 0.25rem 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {ad.title}
              </h4>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                color: '#dc2626',
                marginBottom: '0.25rem'
              }}>
                {formatPrice(ad.price)}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#64748b'
              }}>
                📍 {ad.location_name} • {formatDateTime(ad.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {recentlyViewed.length >= maxItems && (
        <div style={{
          textAlign: 'center',
          marginTop: '0.75rem'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${lang}/recently-viewed`);
            }}
            style={{
              fontSize: '0.75rem',
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
