'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { formatPrice } from '@thulobazaar/utils';
import { Heart as HeartSolid } from '@untitledui-pro/icons/solid';

interface SavedAd {
  id: number;
  adId: number;
  createdAt: string;
  ad: {
    id: number;
    title: string;
    description: string | null;
    price: number | null;
    condition: string | null;
    status: string;
    slug: string | null;
    viewCount: number | null;
    isFeatured: boolean | null;
    isUrgent: boolean | null;
    createdAt: string;
    category: {
      id: number;
      name: string;
      slug: string;
    } | null;
    location: {
      id: number;
      name: string;
      type: string;
    } | null;
    primaryImage: string | null;
  };
}

interface SavedAdsProps {
  lang: string;
}

export default function SavedAds({ lang }: SavedAdsProps) {
  const { user, isAuthenticated } = useUserAuth();
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSavedAds();
    }
  }, [isAuthenticated, user]);

  const fetchSavedAds = async () => {
    try {
      setLoading(true);
      setError(null);

      // API uses NextAuth session from cookies, backendToken is optional
      const token = (user as any)?.backendToken;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/favorites?limit=50', {
        headers,
        credentials: 'include', // Include cookies for NextAuth session
      });

      const data = await response.json();
      if (data.success) {
        setSavedAds(data.data);
      } else {
        setError(data.message || 'Failed to fetch saved ads');
      }
    } catch (err) {
      console.error('Error fetching saved ads:', err);
      setError('Failed to load saved ads');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (adId: number) => {
    try {
      setRemovingId(adId);

      // API uses NextAuth session from cookies, backendToken is optional
      const token = (user as any)?.backendToken;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/favorites/${adId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include', // Include cookies for NextAuth session
      });

      const data = await response.json();
      if (data.success) {
        setSavedAds(prev => prev.filter(fav => fav.ad.id !== adId));
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
    } finally {
      setRemovingId(null);
    }
  };

  // Construct image URL
  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `/${path}`;
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-gray-500 text-sm">Loading saved ads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchSavedAds}
          className="px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-lg hover:bg-rose-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (savedAds.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
          <HeartSolid className="w-8 h-8 text-rose-300" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">No saved ads yet</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
          Browse listings and click the heart icon to save ads you're interested in
        </p>
        <Link
          href={`/${lang}/search`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Ads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Count Badge */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{savedAds.length}</span> saved ad{savedAds.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 gap-3">
        {savedAds.map((favorite) => {
          const ad = favorite.ad;
          const adUrl = ad.slug || `ad-${ad.id}`;
          const imageUrl = getImageUrl(ad.primaryImage);
          const isRemoving = removingId === ad.id;

          return (
            <div
              key={favorite.id}
              className={`group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-rose-200 hover:shadow-sm transition-all ${
                isRemoving ? 'opacity-50' : ''
              }`}
            >
              <Link href={`/${lang}/ad/${adUrl}`} className="flex gap-3 p-3">
                {/* Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  {ad.isFeatured && (
                    <div className="absolute top-1 left-1 bg-amber-500 text-white px-1 py-0.5 rounded text-[9px] font-semibold z-10">
                      ⭐
                    </div>
                  )}
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                      📦
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-0.5">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {ad.title}
                  </h3>

                  {ad.category && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {ad.category.name}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-bold text-emerald-600">
                      {ad.price ? formatPrice(ad.price) : 'Contact for price'}
                    </span>
                    {ad.condition && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        ad.condition === 'new'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {ad.condition}
                      </span>
                    )}
                  </div>

                  {ad.location && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <span>📍</span>
                      <span className="truncate">{ad.location.name}</span>
                    </p>
                  )}
                </div>
              </Link>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFavorite(ad.id);
                }}
                disabled={isRemoving}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-rose-500 rounded-full shadow-sm transition-all group/btn"
                title="Remove from saved"
              >
                {isRemoving ? (
                  <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <HeartSolid className="w-3.5 h-3.5 text-rose-500 group-hover/btn:text-white transition-colors" />
                )}
              </button>

              {/* Ad Status Badge */}
              {ad.status !== 'approved' && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-gray-800/80 text-white text-[9px] font-semibold rounded">
                  {ad.status === 'sold' ? 'SOLD' : ad.status === 'expired' ? 'EXPIRED' : ad.status.toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
