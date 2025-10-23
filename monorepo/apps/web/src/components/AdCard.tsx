'use client';

import Link from 'next/link';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';

interface AdCardProps {
  ad: {
    id: number;
    title: string;
    price: number;
    primaryImage?: string | null;
    categoryName?: string | null;
    categoryIcon?: string | null;
    createdAt: string | Date;
    sellerName: string;
    isFeatured?: boolean;
    isUrgent?: boolean;
    condition?: string | null;
    seoSlug?: string;
    slug?: string;
    accountType?: string;
    businessVerificationStatus?: string;
    individualVerified?: boolean;
  };
  lang: string;
}

export default function AdCard({ ad, lang }: AdCardProps) {
  // Generate ad URL using seo_slug or slug
  const adUrl = ad.seoSlug || ad.slug || `ad-${ad.id}`;

  // Construct image URL - prepend backend API URL if not already a full URL
  const imageUrl = ad.primaryImage
    ? (ad.primaryImage.startsWith('http')
        ? ad.primaryImage
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${ad.primaryImage}`)
    : null;

  return (
    <Link
      href={`/${lang}/ad/${adUrl}`}
      style={{
        display: 'block',
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit'
      }}
      className="ad-card"
    >
      {/* Image Section */}
      <div style={{ position: 'relative', width: '100%', height: '200px', background: '#f1f5f9' }}>
        {ad.isFeatured && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: '#f59e0b',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '600',
            zIndex: 10
          }}>
            ⭐ FEATURED
          </div>
        )}

        {ad.isUrgent && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#ef4444',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '600',
            zIndex: 10
          }}>
            🔥 URGENT
          </div>
        )}

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={ad.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback to placeholder on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            color: '#94a3b8'
          }}>
            {ad.categoryIcon || '📦'}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div style={{ padding: '1rem' }}>
        {/* Title */}
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: '#1f2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {ad.title}
        </h3>

        {/* Category */}
        {ad.categoryName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '0.5rem'
          }}>
            <span>{ad.categoryIcon || '📁'}</span>
            <span>{ad.categoryName}</span>
          </div>
        )}

        {/* Price & Condition */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {formatPrice(ad.price)}
          </div>
          {ad.condition && (
            <span style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '6px',
              background: ad.condition === 'new'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: ad.condition === 'new'
                ? '0 2px 4px rgba(16, 185, 129, 0.3)'
                : '0 2px 4px rgba(59, 130, 246, 0.3)'
            }}>
              {ad.condition === 'new' ? 'New' : 'Used'}
            </span>
          )}
        </div>

        {/* Meta Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.75rem',
          color: '#9ca3af',
          marginBottom: '0.5rem'
        }}>
          <span>🕒</span>
          <span>{formatDateTime(ad.createdAt)}</span>
        </div>

        {/* Seller */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.875rem',
          color: '#4b5563',
          fontWeight: '500'
        }}>
          <span>{ad.sellerName}</span>

          {/* Golden Badge for Verified Business */}
          {ad.accountType === 'business' && ad.businessVerificationStatus === 'approved' && (
            <img
              src="/golden-badge.png"
              alt="Verified Business"
              title="Verified Business"
              style={{ width: '16px', height: '16px' }}
            />
          )}

          {/* Blue Badge for Verified Individual */}
          {ad.accountType === 'individual' && (ad.individualVerified || ad.businessVerificationStatus === 'verified') && (
            <img
              src="/blue-badge.png"
              alt="Verified Individual Seller"
              title="Verified Individual Seller"
              style={{ width: '16px', height: '16px' }}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .ad-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </Link>
  );
}
