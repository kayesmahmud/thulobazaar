import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { prisma } from '@thulobazaar/database';

// Generate at request time (DB not available during build). The expensive part
// is the data fetch, which is cached below.
export const dynamic = 'force-dynamic';

const SITEMAP_TTL_SECONDS = 60 * 60; // 1 hour

const LANGUAGES = ['en', 'ne'] as const;
const DEFAULT_LANGUAGE = 'en';

/**
 * Sitemap generation strategy:
 * - Includes static pages, categories, ads, shops, blog content
 * - Shops are only included when they have at least one approved ad — an empty
 *   shop page is a blank page and just burns crawl budget
 * - Every URL carries hreflang alternates so en/ne cluster instead of competing
 * - lastModified is only set when we know the real date. A lastmod of "now" on
 *   every crawl trains Google to ignore the field entirely
 * - Does NOT include paginated results (?page=2) or filtered variations
 */

interface EntryOptions {
  lastModified?: Date | null;
  changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority?: number;
}

/**
 * Build one sitemap entry per language for a path, each declaring the full set
 * of alternates (Google expects every URL to list all of its variants).
 */
function localisedEntries(
  baseUrl: string,
  path: string,
  { lastModified, changeFrequency, priority }: EntryOptions = {}
): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(LANGUAGES.map((lang) => [lang, `${baseUrl}/${lang}${path}`])),
    'x-default': `${baseUrl}/${DEFAULT_LANGUAGE}${path}`,
  };

  return LANGUAGES.map((lang) => ({
    url: `${baseUrl}/${lang}${path}`,
    ...(lastModified && { lastModified }),
    ...(changeFrequency && { changeFrequency }),
    ...(priority !== undefined && { priority }),
    alternates: { languages },
  }));
}

const getSitemapData = unstable_cache(
  async () => {
    const [ads, categories, locations, blogPosts, blogCategories, blogAuthors, blogTags, shops] =
      await Promise.all([
        // Fetch all approved ads
        prisma.ads.findMany({
          where: { status: 'approved', deleted_at: null },
          select: { slug: true, updated_at: true },
          orderBy: { updated_at: 'desc' },
          take: 50000,
        }),
        // Fetch all parent categories
        prisma.categories.findMany({
          where: { parent_id: null },
          select: { slug: true },
        }),
        // Fetch all provinces (parent locations) for location browse pages
        prisma.locations.findMany({
          where: { parent_id: null },
          select: { slug: true },
        }),
        // Fetch published blog posts
        prisma.blog_posts.findMany({
          where: { status: 'published', published_at: { not: null } },
          select: { slug: true, updated_at: true },
          orderBy: { published_at: 'desc' },
          take: 50000,
        }),
        // Fetch active blog categories
        prisma.blog_categories.findMany({
          where: { is_active: true },
          select: { slug: true },
        }),
        // Fetch active blog authors
        prisma.blog_authors.findMany({
          where: { is_active: true },
          select: { slug: true },
        }),
        // Fetch blog tags
        prisma.blog_tags
          .findMany({ select: { slug: true } })
          .catch(() => [] as { slug: string }[]),
        // Fetch shop profiles that actually have something to show.
        // A shop with zero approved ads is a blank page — submitting it wastes
        // crawl budget and lands in "Crawled - currently not indexed".
        prisma.users.findMany({
          where: {
            is_active: true,
            shop_slug: { not: null },
            NOT: { role: { in: ['editor', 'super_admin'] } },
            ads_ads_user_idTousers: {
              some: { status: 'approved', deleted_at: null },
            },
          },
          select: { id: true, shop_slug: true, custom_shop_slug: true },
          take: 50000,
        }),
      ]);

    // Real lastmod for shops: when that seller's newest ad last changed.
    const latestAdPerShop = await prisma.ads.groupBy({
      by: ['user_id'],
      where: {
        status: 'approved',
        deleted_at: null,
        user_id: { in: shops.map((shop) => shop.id) },
      },
      _max: { updated_at: true },
    });
    const shopLastModified = new Map(
      latestAdPerShop.map((row) => [row.user_id, row._max.updated_at])
    );

    return {
      ads,
      categories,
      locations,
      blogPosts,
      blogCategories,
      blogAuthors,
      blogTags,
      shops: shops.map((shop) => ({
        slug: shop.custom_shop_slug || shop.shop_slug,
        lastModified: shopLastModified.get(shop.id) ?? null,
      })),
    };
  },
  ['sitemap-data'],
  { revalidate: SITEMAP_TTL_SECONDS, tags: ['sitemap'] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const data = await getSitemapData();

  const staticPages = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/ads', changeFrequency: 'hourly' as const, priority: 0.9 },
    // /shops is intentionally absent — it's noindex. Individual shop pages are
    // the search landing pages and they're listed separately below.
    { path: '/blog', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.4 },
    { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.4 },
    { path: '/help', changeFrequency: 'monthly' as const, priority: 0.4 },
    { path: '/scam-prevention', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/support', changeFrequency: 'monthly' as const, priority: 0.4 },
    { path: '/support/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/support/terms-of-service', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/work-with-us', changeFrequency: 'monthly' as const, priority: 0.4 },
  ].flatMap(({ path, changeFrequency, priority }) =>
    localisedEntries(baseUrl, path, { changeFrequency, priority })
  );

  const categoryPages = data.categories.flatMap((category) =>
    localisedEntries(baseUrl, `/ads/${category.slug}`, {
      changeFrequency: 'daily',
      priority: 0.8,
    })
  );

  const locationPages = data.locations.flatMap((location) =>
    localisedEntries(baseUrl, `/ads/${location.slug}`, {
      changeFrequency: 'daily',
      priority: 0.8,
    })
  );

  const adPages = data.ads.flatMap((ad) =>
    localisedEntries(baseUrl, `/ad/${ad.slug}`, {
      lastModified: ad.updated_at,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  );

  const shopPages = data.shops.flatMap((shop) =>
    shop.slug
      ? localisedEntries(baseUrl, `/shop/${shop.slug}`, {
          lastModified: shop.lastModified,
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      : []
  );

  const blogPostPages = data.blogPosts.flatMap((post) =>
    localisedEntries(baseUrl, `/blog/${post.slug}`, {
      lastModified: post.updated_at,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  );

  const blogCategoryPages = data.blogCategories.flatMap((cat) =>
    localisedEntries(baseUrl, `/blog/category/${cat.slug}`, {
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  );

  const blogAuthorPages = data.blogAuthors.flatMap((author) =>
    localisedEntries(baseUrl, `/blog/author/${author.slug}`, {
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  );

  const blogTagPages = data.blogTags.flatMap((tag) =>
    localisedEntries(baseUrl, `/blog/tag/${tag.slug}`, {
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  );

  return [
    ...staticPages,
    ...categoryPages,
    ...locationPages,
    ...adPages,
    ...shopPages,
    ...blogPostPages,
    ...blogCategoryPages,
    ...blogAuthorPages,
    ...blogTagPages,
  ];
}
