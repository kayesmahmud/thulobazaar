/**
 * Centralized Google AdSense Configuration
 *
 * HOW TO ENABLE/DISABLE ADS:
 *
 * 1. Enable ads in production:
 *    - Set NEXT_PUBLIC_ADSENSE_CLIENT_ID in .env.local (e.g., ca-pub-1234567890123456)
 *    - Set NEXT_PUBLIC_ADS_ENABLED=true in .env.local
 *
 * 2. Disable all ads:
 *    - Set NEXT_PUBLIC_ADS_ENABLED=false in .env.local
 *    - OR remove the environment variables entirely
 *
 * 3. Development mode:
 *    - Ads are automatically disabled in development (shows placeholders)
 *    - Set NEXT_PUBLIC_ADS_ENABLED=true to test with real ads in dev (not recommended)
 *
 * 4. Add new ad slots:
 *    - Add the slot ID to the `slots` object below
 *    - Use the slot name in your AdBanner component: <AdBanner slot="yourNewSlot" size="leaderboard" />
 */

// Ad size configurations
export const adSizes = {
  // Horizontal banners
  leaderboard: { width: 728, height: 90, label: '728×90' },        // Desktop horizontal
  mobileBanner: { width: 320, height: 100, label: '320×100' },     // Mobile horizontal
  largeBanner: { width: 970, height: 90, label: '970×90' },        // Large desktop horizontal

  // Vertical banners (sidebars)
  skyscraper: { width: 160, height: 600, label: '160×600' },       // Narrow vertical
  wideSkyscraper: { width: 300, height: 600, label: '300×600' },   // Wide vertical

  // Rectangle banners (in-content)
  mediumRectangle: { width: 300, height: 250, label: '300×250' },  // Standard rectangle
  largeRectangle: { width: 336, height: 280, label: '336×280' },   // Large rectangle (high paying)
  halfPage: { width: 300, height: 600, label: '300×600' },         // Half page

  // Square banners
  square: { width: 250, height: 250, label: '250×250' },
} as const;

// Ad slot IDs - Replace with your actual AdSense slot IDs from Google AdSense dashboard
export const adSlots = {
  // ===================
  // Ad Detail Page
  // ===================
  adDetailTop: 'REPLACE_WITH_SLOT_ID',           // 728x90 above images (desktop)
  adDetailTopMobile: 'REPLACE_WITH_SLOT_ID',     // 320x100 above images (mobile)
  adDetailLeft: 'REPLACE_WITH_SLOT_ID',          // 160x600 left sidebar
  adDetailRight: 'REPLACE_WITH_SLOT_ID',         // 160x600 right sidebar
  adDetailBottom: 'REPLACE_WITH_SLOT_ID',        // 336x280 below content

  // ===================
  // Home Page
  // ===================
  homeHeroBanner: 'REPLACE_WITH_SLOT_ID',        // 728x90 below hero section
  homeHeroBannerMobile: 'REPLACE_WITH_SLOT_ID',  // 320x100 below hero (mobile)
  homeLeft: 'REPLACE_WITH_SLOT_ID',              // 160x600 left sidebar
  homeRight: 'REPLACE_WITH_SLOT_ID',             // 160x600 right sidebar
  homeInFeed: 'REPLACE_WITH_SLOT_ID',            // 300x250 in ad feed
  homeBottom: 'REPLACE_WITH_SLOT_ID',            // 336x280 before footer

  // ===================
  // Ads Listing / Browse Pages
  // ===================
  adsListingTop: 'REPLACE_WITH_SLOT_ID',         // 728x90 above breadcrumb (desktop)
  adsListingTopMobile: 'REPLACE_WITH_SLOT_ID',   // 320x100 above breadcrumb (mobile)
  adsListingSidebar: 'REPLACE_WITH_SLOT_ID',     // 300x250 below filters
  adsListingInFeed: 'REPLACE_WITH_SLOT_ID',      // 300x250 between results (after every 6th)
  adsListingBottom: 'REPLACE_WITH_SLOT_ID',      // 336x280 after pagination

  // ===================
  // Search Results Page
  // ===================
  searchTop: 'REPLACE_WITH_SLOT_ID',             // 728x90 inline with title (desktop)
  searchTopMobile: 'REPLACE_WITH_SLOT_ID',       // 320x100 inline with title (mobile)
  searchSidebar: 'REPLACE_WITH_SLOT_ID',         // 300x250 below filters
  searchInResults: 'REPLACE_WITH_SLOT_ID',       // 300x250 between results (after every 6th)
  searchBottom: 'REPLACE_WITH_SLOT_ID',          // 336x280 after pagination

  // ===================
  // Other Pages
  // ===================
  dashboardSidebar: 'REPLACE_WITH_SLOT_ID',      // 300x250 on dashboard
  profileSidebar: 'REPLACE_WITH_SLOT_ID',        // 300x250 on profile

} as const;

// Type definitions
export type AdSize = keyof typeof adSizes;
export type AdSlot = keyof typeof adSlots;

// Main configuration object
export const adsConfig = {
  // Your AdSense Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',

  // Master switch for ads
  // Ads are enabled only when:
  // 1. NEXT_PUBLIC_ADS_ENABLED is "true"
  // 2. We're in production mode
  // 3. A valid client ID is provided
  get enabled(): boolean {
    const envEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    const hasClientId = Boolean(this.clientId && this.clientId !== '');

    return envEnabled && isProduction && hasClientId;
  },

  // For development: show placeholder even when ads are "enabled"
  get showPlaceholder(): boolean {
    return process.env.NODE_ENV === 'development';
  },

  // Get size config
  getSize(size: AdSize) {
    return adSizes[size];
  },

  // Get slot ID
  getSlotId(slot: AdSlot): string {
    return adSlots[slot];
  },

  // Sizes reference
  sizes: adSizes,

  // Slots reference
  slots: adSlots,
};

export default adsConfig;
