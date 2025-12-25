'use client';

import { useEffect, useRef, useState } from 'react';
import { adsConfig, AdSize, AdSlot } from '@/lib/ads/client';

interface AdBannerProps {
  /** Ad slot name from adsConfig.slots */
  slot: AdSlot;
  /** Banner size from adsConfig.sizes */
  size: AdSize;
  /** Optional custom className */
  className?: string;
  /** If true, container starts collapsed and expands when ad loads (default: false) */
  autoExpand?: boolean;
}

// Declare adsbygoogle on window
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * AdBanner Component - Displays Google AdSense ads
 *
 * Features:
 * - Shows placeholder in development mode
 * - Renders real AdSense ads in production (when enabled)
 * - Type-safe slot and size props from centralized config
 * - Prevents duplicate ad pushes
 *
 * Usage:
 * ```tsx
 * <AdBanner slot="adDetailTop" size="leaderboard" />
 * <AdBanner slot="adDetailLeft" size="skyscraper" />
 * ```
 *
 * Enable/Disable:
 * - Set NEXT_PUBLIC_ADS_ENABLED=true/false in .env.local
 * - Set NEXT_PUBLIC_ADSENSE_CLIENT_ID in .env.local
 */
export default function AdBanner({ slot, size, className = '', autoExpand = false }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdPushed = useRef(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  const sizeConfig = adsConfig.getSize(size);
  const slotId = adsConfig.getSlotId(slot);
  const isProduction = adsConfig.enabled;
  const showPlaceholder = adsConfig.showPlaceholder;

  useEffect(() => {
    // Only push ad once and only in production
    if (isProduction && !isAdPushed.current && adRef.current) {
      try {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          if (typeof window !== 'undefined' && window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            isAdPushed.current = true;
          }
        }, 100);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('AdSense error:', error);
        return undefined;
      }
    }
    return undefined;
  }, [isProduction]);

  // Watch for ad content to load (for auto-expand)
  useEffect(() => {
    if (!autoExpand || !isProduction || !adRef.current) return;

    // Use MutationObserver to detect when ad content is injected
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Ad content has been added
          setIsAdLoaded(true);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe(adRef.current, { childList: true, subtree: true });

    // Also check if ad already has content (iframe)
    const checkForAd = setInterval(() => {
      if (adRef.current) {
        const iframe = adRef.current.querySelector('iframe');
        if (iframe) {
          setIsAdLoaded(true);
          clearInterval(checkForAd);
          observer.disconnect();
        }
      }
    }, 200);

    // Cleanup after 10 seconds if ad doesn't load
    const timeout = setTimeout(() => {
      clearInterval(checkForAd);
      observer.disconnect();
    }, 10000);

    return () => {
      observer.disconnect();
      clearInterval(checkForAd);
      clearTimeout(timeout);
    };
  }, [autoExpand, isProduction]);

  // Development: show realistic dummy ad banners
  if (showPlaceholder) {
    // Dummy ad data for different sizes
    const dummyAds: Record<string, { bg: string; title: string; subtitle: string; cta: string; accent: string }[]> = {
      leaderboard: [
        { bg: 'from-blue-600 to-blue-800', title: '🎉 MEGA SALE', subtitle: 'Up to 70% OFF on Electronics', cta: 'Shop Now', accent: 'bg-yellow-400 text-black' },
        { bg: 'from-purple-600 to-pink-600', title: '✨ New Arrivals', subtitle: 'Fashion Collection 2025', cta: 'Explore', accent: 'bg-white text-purple-600' },
        { bg: 'from-green-600 to-emerald-700', title: '🏠 Dream Home', subtitle: 'Best Property Deals in Nepal', cta: 'View Listings', accent: 'bg-yellow-400 text-green-800' },
      ],
      mobileBanner: [
        { bg: 'from-orange-500 to-red-600', title: '🔥 Flash Sale', subtitle: 'Limited Time Only', cta: 'Buy Now', accent: 'bg-white text-red-600' },
        { bg: 'from-teal-500 to-cyan-600', title: '📱 Tech Deals', subtitle: 'Smartphones & More', cta: 'Shop', accent: 'bg-yellow-300 text-teal-800' },
      ],
      skyscraper: [
        { bg: 'from-indigo-600 to-violet-700', title: '🚗', subtitle: 'Find Your Perfect Car', cta: 'Browse Cars', accent: 'bg-yellow-400 text-indigo-800' },
        { bg: 'from-rose-500 to-pink-600', title: '💼', subtitle: 'Job Opportunities', cta: 'Apply Now', accent: 'bg-white text-rose-600' },
      ],
      mediumRectangle: [
        { bg: 'from-amber-500 to-orange-600', title: '🎁 Special Offer', subtitle: 'Free Delivery on Orders Above Rs. 1000', cta: 'Order Now', accent: 'bg-white text-orange-600' },
        { bg: 'from-cyan-600 to-blue-700', title: '💻 Work From Home', subtitle: 'Best Laptops & Accessories', cta: 'Shop Now', accent: 'bg-yellow-400 text-cyan-800' },
      ],
      largeRectangle: [
        { bg: 'from-slate-700 to-slate-900', title: '⭐ Premium Membership', subtitle: 'Get exclusive benefits and priority listing', cta: 'Join Now', accent: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900' },
        { bg: 'from-emerald-500 to-teal-600', title: '🏪 Sell Your Items', subtitle: 'Reach millions of buyers', cta: 'Post Ad Free', accent: 'bg-white text-emerald-700' },
      ],
    };

    // Get ads for current size or use default
    const sizeKey = Object.keys(dummyAds).find(key => size.toLowerCase().includes(key.toLowerCase())) || 'mediumRectangle';
    const ads = dummyAds[sizeKey] || dummyAds.mediumRectangle;
    const randomAd = ads[Math.floor(Math.random() * ads.length)];

    const isVertical = sizeConfig.height > sizeConfig.width;
    const isSmall = sizeConfig.height < 100;

    return (
      <div
        className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${randomAd.bg} ${className}`}
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          minWidth: sizeConfig.width,
          minHeight: sizeConfig.height,
        }}
      >
        {/* Ad Content */}
        <div className={`h-full flex ${isVertical ? 'flex-col justify-center items-center text-center p-4' : 'items-center justify-between px-6'}`}>
          <div className={isVertical ? 'space-y-3' : 'flex items-center gap-4'}>
            <div className={`font-bold text-white ${isSmall ? 'text-sm' : isVertical ? 'text-xl' : 'text-lg'}`}>
              {randomAd.title}
            </div>
            <div className={`text-white/90 ${isSmall ? 'text-xs' : isVertical ? 'text-sm' : 'text-sm'}`}>
              {randomAd.subtitle}
            </div>
          </div>
          <button className={`${randomAd.accent} ${isSmall ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} font-semibold rounded-full ${isVertical ? 'mt-4' : ''} hover:opacity-90 transition-opacity`}>
            {randomAd.cta}
          </button>
        </div>

        {/* "Ad" badge */}
        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/40 text-white text-[10px] font-medium rounded">
          Ad
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
      </div>
    );
  }

  // Production with ads disabled: show nothing
  if (!isProduction) {
    return null;
  }

  // Production: Google AdSense
  // If autoExpand is true, container starts collapsed and expands with animation when ad loads
  if (autoExpand) {
    return (
      <div
        ref={containerRef}
        className={`overflow-hidden transition-all duration-500 ease-out ${className}`}
        style={{
          maxHeight: isAdLoaded ? sizeConfig.height : 0,
          opacity: isAdLoaded ? 1 : 0,
        }}
      >
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: 'inline-block',
            width: sizeConfig.width,
            height: sizeConfig.height,
          }}
          data-ad-client={adsConfig.clientId}
          data-ad-slot={slotId}
        />
      </div>
    );
  }

  // Normal fixed-size ad
  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{
        display: 'inline-block',
        width: sizeConfig.width,
        height: sizeConfig.height,
      }}
      data-ad-client={adsConfig.clientId}
      data-ad-slot={slotId}
    />
  );
}
