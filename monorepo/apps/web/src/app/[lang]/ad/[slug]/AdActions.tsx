'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareWhatsapp, faFacebook, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { Heart } from '@untitledui-pro/icons/line';
import { Heart as HeartSolid } from '@untitledui-pro/icons/solid';

interface AdActionsProps {
  adId: number;
  adTitle: string;
  adSlug: string;
  lang: string;
  whatsappNumber: string | null;
  phoneNumber: string | null;
  showWhatsAppOnly?: boolean;
  showShareFavoriteOnly?: boolean;
  initialFavoritesCount?: number;
}

export default function AdActions({
  adId,
  adTitle,
  adSlug,
  lang,
  whatsappNumber,
  phoneNumber,
  showWhatsAppOnly = false,
  showShareFavoriteOnly = false,
  initialFavoritesCount = 0,
}: AdActionsProps) {
  const { user, isAuthenticated } = useUserAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(initialFavoritesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get the ad URL for sharing
  const adUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${lang}/ad/${adSlug}`
    : `https://thulobazaar.com/${lang}/ad/${adSlug}`;

  const checkFavoriteStatus = useCallback(async () => {
    try {
      // API uses NextAuth session from cookies, backendToken is optional
      const token = (user as any)?.backendToken;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/favorites/${adId}`, {
        headers,
        credentials: 'include', // Include cookies for NextAuth session
      });
      const data = await response.json();
      if (data.success) {
        setIsFavorited(data.data.isFavorited);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }, [adId, user]);

  // Check if ad is favorited on mount
  useEffect(() => {
    const shouldLoadFavorites = !showWhatsAppOnly;
    if (shouldLoadFavorites && isAuthenticated && user) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, user, adId, showWhatsAppOnly, checkFavoriteStatus]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Please login to save ads to favorites');
      return;
    }

    setIsLoading(true);
    try {
      // API uses NextAuth session from cookies, backendToken is optional
      const token = (user as any)?.backendToken;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${adId}`, {
          method: 'DELETE',
          headers,
          credentials: 'include', // Include cookies for NextAuth session
        });
        const data = await response.json();
        if (data.success) {
          setIsFavorited(false);
          setFavoritesCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers,
          credentials: 'include', // Include cookies for NextAuth session
          body: JSON.stringify({ adId }),
        });
        const data = await response.json();
        if (data.success) {
          setIsFavorited(true);
          setFavoritesCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number for WhatsApp (remove spaces, dashes, add country code if needed)
  const formatWhatsAppNumber = (phone: string): string => {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // If starts with 0, replace with Nepal country code
    if (cleaned.startsWith('0')) {
      cleaned = '977' + cleaned.substring(1);
    }
    // If doesn't start with +, add it
    if (!cleaned.startsWith('+') && !cleaned.startsWith('977')) {
      cleaned = '977' + cleaned;
    }
    // Remove + if present (wa.me doesn't need it)
    cleaned = cleaned.replace('+', '');
    return cleaned;
  };

  const whatsappLink = whatsappNumber || phoneNumber
    ? `https://wa.me/${formatWhatsAppNumber(whatsappNumber || phoneNumber || '')}?text=${encodeURIComponent(`Hi, I'm interested in: ${adTitle}\n${adUrl}`)}`
    : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(adUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adUrl)}`,
      '_blank',
      'width=600,height=400'
    );
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(adUrl)}&text=${encodeURIComponent(adTitle)}`,
      '_blank',
      'width=600,height=400'
    );
    setShowShareMenu(false);
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  // If showWhatsAppOnly, only render WhatsApp button
  if (showWhatsAppOnly) {
    return whatsappLink ? (
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg font-semibold mb-3 transition-all duration-200 hover:-translate-y-0.5"
      >
        <FontAwesomeIcon icon={faSquareWhatsapp} className="!w-5 !h-5 sm:!w-[30px] sm:!h-[30px]" />
        <span>WhatsApp</span>
      </a>
    ) : null;
  }

  // Format count for display (e.g., 1.2k for 1200)
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };

  const renderShareButton = () => (
    <div className="relative share-menu-container flex-1">
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="w-full px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium shadow-sm border border-gray-200"
        title="Share this ad"
      >
        Share
      </button>

      {/* Share Dropdown Menu */}
      {showShareMenu && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button
            onClick={handleShareFacebook}
            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
          >
            <FontAwesomeIcon icon={faFacebook} className="w-4 h-4 text-[#1877F2]" />
            <span className="text-sm text-gray-700">Facebook</span>
          </button>
          <button
            onClick={handleShareTwitter}
            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
          >
            <FontAwesomeIcon icon={faXTwitter} className="w-4 h-4 text-black" />
            <span className="text-sm text-gray-700">X (Twitter)</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderFavoriteButton = () => (
    <div className="flex items-center gap-1">
      {/* Heart Icon Button */}
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        className={`flex items-center justify-center transition-all duration-200 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
        }`}
        title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
      >
        {isFavorited ? (
          <HeartSolid className="w-6 h-6 text-rose-500" />
        ) : (
          <Heart className="w-6 h-6 text-gray-700 hover:text-rose-500" />
        )}
      </button>
      {/* Count Badge */}
      <span className="min-w-[40px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 text-center shadow-sm">
        {formatCount(favoritesCount)}
      </span>
    </div>
  );

  // If showShareFavoriteOnly, only render Share & Favorite buttons
  if (showShareFavoriteOnly) {
    return (
      <div className="flex gap-2 mt-3">
        {renderFavoriteButton()}
        {renderShareButton()}
      </div>
    );
  }

  // Default: render all buttons (WhatsApp + Share/Favorite)
  return (
    <div className="flex flex-col gap-3 mt-3 mb-4">
      {/* WhatsApp Button */}
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5"
        >
          <FontAwesomeIcon icon={faSquareWhatsapp} className="!w-5 !h-5 sm:!w-[30px] sm:!h-[30px]" />
          <span>WhatsApp</span>
        </a>
      )}

      {/* Share & Favorite Row */}
      <div className="flex gap-2">
        {renderShareButton()}
        {renderFavoriteButton()}
      </div>
    </div>
  );
}
