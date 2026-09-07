import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@thulobazaar/database';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdCard, AdBanner, AdsPagination } from '@/components/ads';
import { AD_CARD_LOCATION_SELECT, resolveDistrictName } from '@/lib/location/district';
import HeroSearch from './HeroSearch';
import FeaturedAdsCarousel from './FeaturedAdsCarousel';
import CategoryIcon from './CategoryIcon';
import MobileCategoryCarousel from './MobileCategoryCarousel';

// Reading searchParams (?page=N) makes this route render per-request,
// same as the /ads browse page — revalidate no longer applies.

interface HomePageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Homepage keeps its denser 60-ad grid per page; /ads uses 20.
const ADS_PER_PAGE = 60;

// Generate metadata for SEO
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('homeTitle');
  const description = t('homeDescription');

  return {
    title,
    description,
    keywords: 'Nepal classifieds, buy sell Nepal, online marketplace Nepal, free ads Nepal, Thulo Bazaar',
    openGraph: {
      title,
      description: t('siteDescription'),
      type: 'website',
      siteName: 'Thulo Bazaar',
      url: `${baseUrl}/${lang}`,
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      images: [{ url: `${baseUrl}/logo.png`, width: 512, height: 512, alt: 'Thulo Bazaar' }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [`${baseUrl}/logo.png`],
    },
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages: {
        en: `${baseUrl}/en`,
        ne: `${baseUrl}/ne`,
        'x-default': `${baseUrl}/en`,
      },
    },
  };
}

// Custom category display order for homepage grid (same as filter panels)
const CATEGORY_DISPLAY_ORDER = [
  'Mobiles',
  'Electronics',
  'Vehicles',
  'Property',
  'Home & Living',
  "Men's Fashion & Grooming",
  "Women's Fashion & Beauty",
  'Hobbies, Sports & Kids',
  'Essentials',
  'Jobs',
  'Overseas Jobs',
  'Pets & Animals',
  'Services',
  'Education',
  'Business & Industry',
];

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations('home');
  const tc = await getTranslations('common');

  const search = await searchParams;
  const page = Math.max(1, parseInt(search.page || '1', 10) || 1);
  const offset = (page - 1) * ADS_PER_PAGE;

  // Latest feed = full catalog: approved ads with images from active users,
  // minus currently-featured ads (they show in the featured carousel above).
  const latestAdsWhere = {
    status: 'approved',
    deleted_at: null,
    ad_images: {
      some: {}, // Only show ads with at least one image
    },
    users_ads_user_idTousers: {
      is_active: true, // Only show ads from active users
    },
    // Exclude active featured ads so they don't repeat in the latest feed
    NOT: {
      is_featured: true,
      featured_until: { gt: new Date() },
    },
  };

  // ✅ Fetch real data from database using Prisma (parallel queries for performance)
  // Try/catch: at Docker build time there is no DB — return empty arrays so prerender succeeds.
  let categories: any[] = [], featuredAds: any[] = [], latestAds: any[] = [];
  let totalLatestAds = 0;
  try {
  [categories, featuredAds, latestAds, totalLatestAds] = await Promise.all([
    // Get all top-level categories (no parent)
    prisma.categories.findMany({
      where: {
        parent_id: null,
      },
      orderBy: {
        display_order: 'asc',
      },
      // Get all 16 categories instead of limiting to 8
    }),
    // Get featured ads (is_featured = true and not expired)
    prisma.ads.findMany({
      where: {
        status: 'approved',
        deleted_at: null,
        is_featured: true,
        featured_until: { gt: new Date() },
        ad_images: {
          some: {},
        },
        users_ads_user_idTousers: {
          is_active: true,
        },
      },
      include: {
        ad_images: {
          where: { is_primary: true },
          take: 1,
        },
        locations: { select: AD_CARD_LOCATION_SELECT },
        categories: true,
        users_ads_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            business_name: true,
            account_type: true,
            business_verification_status: true,
            individual_verified: true,
          },
        },
      },
      // Most recently bought promotion first; publish date breaks ties
      // (comped promotions often share the exact same expiry).
      orderBy: [{ featured_until: 'desc' }, { published_at: { sort: 'desc', nulls: 'last' } }],
      take: 20,
    }),
    // Latest feed: paginated over the full catalog (newest-approved first)
    prisma.ads.findMany({
      where: latestAdsWhere,
      include: {
        ad_images: {
          where: { is_primary: true },
          take: 1,
          select: {
            id: true,
            filename: true,
            file_path: true,
            is_primary: true,
          },
        },
        locations: { select: AD_CARD_LOCATION_SELECT },
        categories: {
          select: {
            id: true,
            name: true,
            icon: true,
            categories: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
        users_ads_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            account_type: true,
            business_verification_status: true,
            individual_verified: true,
          },
        },
      },
      orderBy: {
        published_at: { sort: 'desc', nulls: 'last' }, // Sort by first-publish time, nulls last
      },
      take: ADS_PER_PAGE,
      skip: offset,
    }),
    // Total count for pagination
    prisma.ads.count({ where: latestAdsWhere }),
  ]);
  } catch { /* no DB at build time — data loads on first runtime request */ }

  const totalPages = Math.ceil(totalLatestAds / ADS_PER_PAGE);

  // Sort categories by custom display order
  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = CATEGORY_DISPLAY_ORDER.indexOf(a.name);
    const indexB = CATEGORY_DISPLAY_ORDER.indexOf(b.name);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const normalizedCategories = sortedCategories.map((category) => ({
    ...category,
    slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
  }));

  // Transform featured ads for carousel
  const featuredAdCards = featuredAds.map((ad: any) => ({
    id: ad.id,
    title: ad.title,
    price: ad.price ? parseFloat(ad.price.toString()) : 0,
    primaryImage: ad.ad_images?.[0]?.file_path || null,
    categoryName: ad.categories?.name || null,
    categoryIcon: ad.categories?.icon || null,
    locationName: ad.locations?.name || null,
    districtName: resolveDistrictName(ad.locations),
    slug: ad.slug || undefined,
    condition: ad.condition || null,
    publishedAt: ad.published_at || ad.reviewed_at || ad.created_at || new Date(),
    sellerName: ad.users_ads_user_idTousers?.business_name || ad.users_ads_user_idTousers?.full_name || tc('unknownSeller'),
    accountType: ad.users_ads_user_idTousers?.account_type || undefined,
    businessVerificationStatus: ad.users_ads_user_idTousers?.business_verification_status || undefined,
    individualVerified: ad.users_ads_user_idTousers?.individual_verified || false,
  }));

  const latestAdCards = latestAds.map((ad: any) => ({
    id: ad.id,
    title: ad.title,
    price: ad.price ? parseFloat(ad.price.toString()) : 0,
    primaryImage: ad.ad_images && ad.ad_images.length > 0 ? ad.ad_images[0]?.file_path || null : null,
    categoryName: ad.categories?.name || null,
    categoryIcon: ad.categories?.icon || null,
    districtName: resolveDistrictName(ad.locations),
    // publishedAt = first time the ad went live (use for "time ago" display)
    publishedAt: ad.published_at || ad.reviewed_at || ad.created_at || new Date(),
    createdAt: ad.created_at || new Date(),
    sellerName: ad.users_ads_user_idTousers?.full_name || tc('unknownSeller'),
    isFeatured: ad.is_featured || false,
    isUrgent: ad.is_urgent || false,
    isSticky: ad.is_sticky || false,
    condition: ad.condition || null,
    slug: ad.slug || undefined,
    accountType: ad.users_ads_user_idTousers?.account_type || undefined,
    businessVerificationStatus: ad.users_ads_user_idTousers?.business_verification_status || undefined,
    individualVerified: ad.users_ads_user_idTousers?.individual_verified || false,
  }));

  return (
    <div className="min-h-screen">
      {/* Hero Section with Enhanced Design */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
        {/* Animated background shapes - hidden on mobile for cleaner look */}
        <div className="absolute inset-0 opacity-20 hidden sm:block">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-6 sm:py-8 md:py-12 lg:py-20 text-center text-white">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 animate-fade-in-up">
            {t('hero')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg opacity-90 mb-4 sm:mb-6 md:mb-8">
            {t('subtitle')}
          </p>

          {/* Enhanced Search Bar */}
          <HeroSearch lang={lang} />

          {/* CTA Buttons - Stack on mobile, row on larger screens */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center items-center w-full sm:w-auto">
            {/* Animated Post Free Ad Button */}
            <Link
              href={`/${lang}/post-ad`}
              className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-105 no-underline"
            >
              {/* Glow Effect - hidden on mobile */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300 hidden sm:block"></div>
              {/* Button Content */}
              <div className="relative flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('postFreeAd')}</span>
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
            </Link>
            {/* Search All Ads - Orange gradient to match design */}
            <Link
              href={`/${lang}/ads`}
              className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 text-white w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-orange-500 hover:via-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/50 hover:scale-105 no-underline"
            >
              {/* Glow Effect - hidden on mobile */}
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300 hidden sm:block"></div>
              {/* Button Content */}
              <div className="relative flex items-center gap-2">
                <span>{t('searchAllAds')}</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Horizontal Banner Below Hero - Mobile: 320x100, Desktop: 728x90 */}
      <div className="flex justify-center py-4 bg-gray-100">
        <div className="flex sm:hidden">
          <AdBanner slot="homeHeroBannerMobile" size="mobileBanner" autoExpand />
        </div>
        <div className="hidden sm:flex">
          <AdBanner slot="homeHeroBanner" size="leaderboard" autoExpand />
        </div>
      </div>

      {/* Main Content with 3-column layout on xl screens */}
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="grid grid-cols-1 xl:grid-cols-[160px_1fr_160px] gap-6">

          {/* Left Vertical Banner (160x600) - Hidden on smaller screens */}
          <div className="hidden xl:flex xl:flex-col xl:items-center pt-[164px]">
            <div className="sticky top-24">
              <AdBanner slot="homeLeft" size="skyscraper" autoExpand />
            </div>
          </div>

          {/* Main Content Column */}
          <div>
            {/* Categories Section */}
            <div className="py-6 sm:py-8 md:py-12 lg:py-16">
              <div className="flex justify-between items-end mb-4 sm:mb-6 md:mb-8">
                <div>
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">
                    {t('browseCategories')}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-gray-500">
                    {t('findWhatYoureLooking')}
                  </p>
                </div>
                <Link
                  href={`/${lang}/ads`}
                  className="text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 no-underline transition-colors text-sm sm:text-base"
                >
                  {tc('viewAll')}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Mobile: Two-row horizontal carousel with scroll arrows */}
              <MobileCategoryCarousel categories={normalizedCategories} lang={lang} />

              {/* Desktop: Grid layout */}
              <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {normalizedCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/${lang}/ads/category/${category.slug}`}
                    className="group bg-white rounded-2xl p-4 sm:p-6 text-center border-2 border-gray-100 hover:border-rose-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 no-underline"
                  >
                    <div className="mb-3 mx-auto w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <CategoryIcon slug={category.slug} emoji={category.icon} name={category.name} size={70} />
                    </div>
                    <div className="font-semibold text-gray-900 group-hover:text-rose-500 transition-colors">
                      {lang === 'ne' && category.name_ne ? category.name_ne : category.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Featured Ads Grid - shown above the latest feed (matches Flutter home screen) */}
            {featuredAdCards.length > 0 && (
              <div className="py-6 md:py-12 mb-6 md:mb-8">
                <div className="flex justify-between items-end mb-4 md:mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                      <span className="text-xl md:text-2xl">⭐</span>
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                        {t('featuredAds')}
                      </h2>
                    </div>
                    <p className="text-gray-500">
                      {t('featuredAdsSubtitle')}
                    </p>
                  </div>
                </div>
                <FeaturedAdsCarousel ads={featuredAdCards} lang={lang} />
              </div>
            )}

            {/* Latest Ads Section — full catalog, paginated. Anchor keeps
                page links scrolled to the grid instead of the hero. */}
            <div id="latest-ads" className="py-6 sm:py-8 md:py-12 mb-6 sm:mb-8 md:mb-12 scroll-mt-20">
              <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {t('latestAds')}
                </h2>
                <Link
                  href={`/${lang}/ads`}
                  className="text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 no-underline transition-colors text-sm sm:text-base"
                >
                  {tc('viewAllAds')}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {latestAds.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-2xl font-semibold mb-2 text-gray-900">
                    {t('noAdsYet')}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {t('beFirstToPost')}
                  </p>
                  <Link
                    href={`/${lang}/post-ad`}
                    className="inline-block px-6 py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors no-underline"
                  >
                    {t('postFreeAdButton')}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                    {latestAdCards.map((ad, index) => (
                      <React.Fragment key={ad.id}>
                        <AdCard
                          lang={lang}
                          ad={ad}
                        />
                        {/* In-Feed Ad - Mobile: after 2 cards (index 1), Desktop: after 3 cards (index 2) */}
                        {index === 1 && (
                          <div className="md:hidden col-span-2 flex justify-center items-center bg-gray-50 rounded-xl p-4">
                            <AdBanner slot="homeInFeed" size="mediumRectangle" autoExpand />
                          </div>
                        )}
                        {index === 2 && (
                          <div className="hidden md:flex col-span-3 justify-center items-center bg-gray-50 rounded-xl p-4">
                            <AdBanner slot="homeInFeed" size="mediumRectangle" autoExpand />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <AdsPagination
                    page={page}
                    totalPages={totalPages}
                    buildHref={(p) =>
                      p > 1 ? `/${lang}?page=${p}#latest-ads` : `/${lang}#latest-ads`
                    }
                  />
                </>
              )}
            </div>

            {/* Bottom Banner (336x280) - Before Footer */}
            <div className="flex justify-center mb-12">
              <AdBanner slot="homeBottom" size="largeRectangle" autoExpand />
            </div>
          </div>

          {/* Right Vertical Banner (160x600) - Hidden on smaller screens */}
          <div className="hidden xl:flex xl:flex-col xl:items-center pt-[164px]">
            <div className="sticky top-24">
              <AdBanner slot="homeRight" size="skyscraper" autoExpand />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
