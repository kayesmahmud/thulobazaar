'use client';

import Script from 'next/script';
import { adsConfig } from '@/lib/adsConfig';

/**
 * GoogleAdSense Script Loader
 *
 * This component loads the Google AdSense script globally.
 * It should be placed in the root layout (layout.tsx) inside <head>.
 *
 * The script only loads when:
 * - NEXT_PUBLIC_ADS_ENABLED=true
 * - NODE_ENV=production
 * - Valid NEXT_PUBLIC_ADSENSE_CLIENT_ID is provided
 *
 * Usage in layout.tsx:
 * ```tsx
 * import GoogleAdSense from '@/components/ads/GoogleAdSense';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <GoogleAdSense />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export default function GoogleAdSense() {
  // Only load in production with valid client ID
  if (!adsConfig.enabled || !adsConfig.clientId) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onError={(e) => {
        console.error('AdSense script failed to load:', e);
      }}
    />
  );
}
