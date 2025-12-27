import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/editor/',
          '/super-admin/',
          '/*?promoted=*', // Don't index promotion success pages
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
