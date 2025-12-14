'use client';

import Link from 'next/link';

interface ShopCardProps {
  shop: {
    id: number;
    shopSlug: string;
    displayName: string;
    avatar: string | null;
    coverPhoto: string | null;
    bio: string | null;
    businessDescription: string | null;
    accountType: string | null;
    businessVerificationStatus: string | null;
    individualVerified: boolean;
    categoryName: string | null;
    categoryIcon: string | null;
    subcategoryName: string | null;
    locationName: string | null;
    totalAds: number;
    memberSince: string;
  };
  lang: string;
}

export default function ShopCard({ shop, lang }: ShopCardProps) {
  // Construct avatar URL
  const avatarUrl = shop.avatar
    ? (shop.avatar.startsWith('http') ? shop.avatar : `/${shop.avatar}`)
    : null;

  // Construct cover URL
  const coverUrl = shop.coverPhoto
    ? (shop.coverPhoto.startsWith('http') ? shop.coverPhoto : `/${shop.coverPhoto}`)
    : null;

  // Determine verification badge
  const isVerifiedBusiness = shop.accountType === 'business' && shop.businessVerificationStatus === 'approved';
  const isVerifiedIndividual = shop.accountType === 'individual' && shop.individualVerified;

  // Get description preview
  const description = shop.businessDescription || shop.bio || '';
  const descriptionPreview = description.length > 100
    ? description.substring(0, 100) + '...'
    : description;

  return (
    <Link
      href={`/${lang}/shop/${shop.shopSlug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg no-underline text-inherit"
    >
      {/* Cover Image */}
      <div className="relative w-full h-32 bg-gradient-to-r from-rose-400 to-indigo-500">
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Avatar - positioned at bottom */}
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={shop.displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-3xl text-gray-400">
                🏪
              </div>
            )}
          </div>
        </div>

        {/* Verification Badge */}
        {(isVerifiedBusiness || isVerifiedIndividual) && (
          <div className="absolute top-2 right-2">
            <img
              src={isVerifiedBusiness ? '/golden-badge.png' : '/blue-badge.png'}
              alt={isVerifiedBusiness ? 'Verified Business' : 'Verified Seller'}
              title={isVerifiedBusiness ? 'Verified Business' : 'Verified Seller'}
              className="w-6 h-6"
            />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="pt-12 px-4 pb-4">
        {/* Shop Name */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
            {shop.displayName}
          </h3>
        </div>

        {/* Category */}
        {shop.categoryName && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <span>{shop.categoryIcon || '📁'}</span>
            <span>
              {shop.categoryName}
              {shop.subcategoryName && ` › ${shop.subcategoryName}`}
            </span>
          </div>
        )}

        {/* Description */}
        {descriptionPreview && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {descriptionPreview}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>📍</span>
            <span>{shop.locationName || 'Nepal'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📦</span>
            <span>{shop.totalAds} ads</span>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
          <span>🕒</span>
          <span>Member since {shop.memberSince}</span>
        </div>
      </div>
    </Link>
  );
}
