import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://thulobazaar.com'; // TODO: Use env variable

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
