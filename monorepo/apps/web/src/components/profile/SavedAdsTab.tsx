'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@thulobazaar/utils';

interface FavoriteAd {
  id: number;
  adId: number;
  createdAt: string;
  ad: {
    id: number;
    title: string;
    slug: string;
    price: number | null;
    primaryImage: string | null;
    category: { name: string } | null;
    location: { name: string } | null;
  };
}

interface SavedAdsTabProps {
  favorites: FavoriteAd[];
  loading: boolean;
  lang: string;
  onRemoveFavorite: (adId: number) => void;
}

export function SavedAdsTab({
  favorites,
  loading,
  lang,
  onRemoveFavorite,
}: SavedAdsTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved ads yet</h3>
        <p className="text-gray-500 mb-6">Save ads you like by clicking the heart icon</p>
        <Link
          href={`/${lang}/search`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Ads
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {favorites.map((fav) => (
        <FavoriteAdCard
          key={fav.id}
          favorite={fav}
          lang={lang}
          onRemove={() => onRemoveFavorite(fav.adId)}
        />
      ))}
    </div>
  );
}

interface FavoriteAdCardProps {
  favorite: FavoriteAd;
  lang: string;
  onRemove: () => void;
}

function FavoriteAdCard({ favorite, lang, onRemove }: FavoriteAdCardProps) {
  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
        {favorite.ad.primaryImage ? (
          <Image
            src={`/${favorite.ad.primaryImage}`}
            alt={favorite.ad.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/${lang}/ad/${favorite.ad.slug}`}
          className="text-gray-900 font-medium hover:text-primary transition-colors line-clamp-1 block"
        >
          {favorite.ad.title}
        </Link>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          {favorite.ad.category && <span>{favorite.ad.category.name}</span>}
          {favorite.ad.category && favorite.ad.location && <span>•</span>}
          {favorite.ad.location && <span>{favorite.ad.location.name}</span>}
        </div>
        {favorite.ad.price && (
          <div className="text-base font-bold text-green-600 mt-1">
            {formatPrice(favorite.ad.price)}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Link
            href={`/${lang}/ad/${favorite.ad.slug}`}
            className="text-xs text-primary hover:text-primary-hover font-medium"
          >
            View Ad
          </Link>
          <button
            onClick={onRemove}
            className="text-xs text-gray-500 hover:text-red-600 font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
