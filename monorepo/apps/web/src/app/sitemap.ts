import { MetadataRoute } from 'next';
import { prisma } from '@thulobazaar/database';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://thulobazaar.com'; // TODO: Use env variable

  // Fetch all approved ads
  const ads = await prisma.ads.findMany({
    where: {
      status: 'approved',
      deleted_at: null,
    },
    select: {
      slug: true,
      updated_at: true,
    },
    orderBy: {
      updated_at: 'desc',
    },
    take: 50000, // Google sitemap limit
  });

  // Fetch all categories
  const categories = await prisma.categories.findMany({
    where: {
      parent_id: null, // Only parent categories
    },
    select: {
      slug: true,
    },
  });

  // Static pages
  const staticPages = [
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/en/all-ads`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/search`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/post-ad`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Category pages
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/en/ads/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Ad detail pages
  const adPages = ads.map((ad) => ({
    url: `${baseUrl}/en/ad/${ad.slug}`,
    lastModified: ad.updated_at || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...adPages];
}
