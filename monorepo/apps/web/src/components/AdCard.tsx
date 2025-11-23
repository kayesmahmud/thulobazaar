// @ts-nocheck
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

  // Construct image URL - images are served from backend server
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const imageUrl = ad.primaryImage
    ? (ad.primaryImage.startsWith('http')
        ? ad.primaryImage
        : `${BACKEND_URL}/${ad.primaryImage}`)
    : null;

  return (
    <Link
      href={`/${lang}/ad/${adUrl}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg no-underline text-inherit"
    >
      {/* Image Section */}
      <div className="relative w-full h-48 bg-gray-100">
        {ad.isFeatured && (
          <div className="absolute top-2 left-2 bg-warning text-white px-3 py-1 rounded text-xs font-semibold z-10">
            ⭐ FEATURED
          </div>
        )}

        {ad.isUrgent && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold z-10">
            🔥 URGENT
          </div>
        )}

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              // Fallback to placeholder on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-600">
            {ad.categoryIcon || '📦'}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
          {ad.title}
        </h3>

        {/* Category */}
        {ad.categoryName && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <span>{ad.categoryIcon || '📁'}</span>
            <span>{ad.categoryName}</span>
          </div>
        )}

        {/* Price & Condition */}
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xl font-bold text-success">
            {formatPrice(ad.price)}
          </div>
          {ad.condition && (
            <span className={`text-xs px-2.5 py-1 rounded-md text-white font-bold uppercase tracking-wide ${
              ad.condition === 'new'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm'
            }`}>
              {ad.condition === 'new' ? 'New' : 'Used'}
            </span>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <span>🕒</span>
          <span>{formatDateTime(ad.createdAt)}</span>
        </div>

        {/* Seller */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
          <span>{ad.sellerName}</span>

          {/* Golden Badge for Verified Business */}
          {ad.accountType === 'business' && ad.businessVerificationStatus === 'approved' && (
            <img
              src="/golden-badge.png"
              alt="Verified Business"
              title="Verified Business"
              className="w-4 h-4"
            />
          )}

          {/* Blue Badge for Verified Individual */}
          {ad.accountType === 'individual' && (ad.individualVerified || ad.businessVerificationStatus === 'verified') && (
            <img
              src="/blue-badge.png"
              alt="Verified Individual Seller"
              title="Verified Individual Seller"
              className="w-4 h-4"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
