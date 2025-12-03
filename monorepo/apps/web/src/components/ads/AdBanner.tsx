'use client';

import { useEffect, useRef, useState } from 'react';
import { adsConfig, AdSize, AdSlot } from '@/lib/adsConfig';

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
      }
    }
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

  // Development: show placeholder for visual debugging
  if (showPlaceholder) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg ${className}`}
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          minWidth: sizeConfig.width,
          minHeight: sizeConfig.height,
        }}
      >
        <div className="text-center text-gray-500">
          <div className="text-xs font-medium">AD BANNER</div>
          <div className="text-sm font-bold">{sizeConfig.label}</div>
          <div className="text-xs text-gray-400 mt-1">Slot: {slot}</div>
        </div>
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
