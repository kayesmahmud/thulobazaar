import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@thulobazaar/database';
import { publicVerification } from '@thulobazaar/types';
import { AdsFilter, AdsSearchBar, AdsFilterWrapper, AdCard, AdBanner, SortDropdown, AdsPagination } from '@/components/ads';
import { parseAdUrlParams, getFilterIds, generateAdListingMetadata } from '@/lib/urls';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { getLocationHierarchy } from '@/lib/location';
import { resolveDistrictName } from '@/lib/location/district';
import { getRootCategoriesWithChildren } from '@/lib/location';
import { buildAdsWhereClause, buildAdsOrderBy, standardAdInclude } from '@/lib/ads';
import { SearchX } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface AdsPageProps {
  params: Promise<{ lang: string; params?: string[] }>;
  searchParams: Promise<{
    query?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: 'Brand New' | 'Used';
    sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
    userId?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: AdsPageProps): Promise<Metadata> {
  const { lang, params: urlParams } = await params;
  const filters = await searchParams;

  // Parse URL parameters using helper function
  const parsed = await parseAdUrlParams(urlParams);

  // Build the current path for canonical/hreflang
  const pathSegments = ['', lang, 'ads', ...(urlParams || [])];
  const path = pathSegments.join('/');

  // Generate metadata based on filters
  const page = filters.page ? parseInt(filters.page) : 1;
  const metadata = generateAdListingMetadata(
    parsed.locationName,
    parsed.categoryName,
    filters.query || null,
    0, // Placeholder - will show actual count on page
    { lang, path, page }
  );

  // SEO: Don't index paginated results (page 2, 3, 4...)
  // This prevents duplicate content from being indexed
  const result: Metadata = {
    ...metadata,
  };

  // Explicitly set robots meta tag for paginated results
  if (page > 1) {
    result.robots = {
      index: false,
      follow: true,
    };
  }

  return result;
}

export default async function AdsPage({ params, searchParams }: AdsPageProps) {
  const { lang, params: urlParams } = await params;
  setRequestLocale(lang);
  const t = await getTranslations('ads');
  const tc = await getTranslations('common');
  const search = await searchParams;

  // Parse URL parameters using helper function
  const parsed = await parseAdUrlParams(urlParams);

  // Get filter IDs for hierarchical filtering using helper function
  const { locationIds, categoryIds } = await getFilterIds(
    parsed.locationId,
    parsed.locationType,
    parsed.categoryId,
    parsed.isParentCategory
  );

  // Parse search parameters
  const searchQuery = search.query || '';
  const page = search.page ? parseInt(search.page) : 1;
  const minPrice = search.minPrice ? parseFloat(search.minPrice) : undefined;
  const maxPrice = search.maxPrice ? parseFloat(search.maxPrice) : undefined;
  const condition = search.condition;
  const sortBy = search.sortBy || 'newest';
  const userId = search.userId ? parseInt(search.userId) : undefined;
  const adsPerPage = 20;
  const offset = (page - 1) * adsPerPage;

  // Build Prisma where clause using shared helper
  const where = buildAdsWhereClause({
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    locationIds: locationIds.length > 0 ? locationIds : undefined,
    minPrice,
    maxPrice,
    condition,
    searchQuery,
    status: 'approved',
    userId,
  });

  // Pin promotions on any filtered browse/search listing — category (incl.
  // parent), location, or search. The unfiltered all-ads page and the home
  // "Latest" feed stay chronological.
  const applyPromotionPriority =
    categoryIds.length > 0 || locationIds.length > 0 || Boolean(searchQuery);

  // Build order by clause using shared helper
  const orderBy = buildAdsOrderBy({
    sortBy: sortBy as 'newest' | 'oldest' | 'price_asc' | 'price_desc',
    applyPromotionPriority,
  });

  // Fetch ads and total count in parallel
  const [ads, totalAds, categories, locationHierarchy] = await Promise.all([
    // Get paginated ads with relations using shared include
    prisma.ads.findMany({
      where,
      orderBy,
      take: adsPerPage,
      skip: offset,
      include: standardAdInclude,
    }),
    // Get total count for pagination
    prisma.ads.count({ where }),
    // Get categories for filter panel using shared helper
    getRootCategoriesWithChildren(),
    // Prefetch province → district hierarchy for instant rendering
    getLocationHierarchy(),
  ]);

  const totalPages = Math.ceil(totalAds / adsPerPage);

  // Determine which filters are active
  const hasActiveFilters = Boolean(
    parsed.categoryId || parsed.locationId || minPrice || maxPrice || condition || searchQuery
  );

  const displayLocationName = lang === 'ne' && parsed.locationNameNe ? parsed.locationNameNe : parsed.locationName;
  const displayCategoryName = lang === 'ne' && parsed.categoryNameNe ? parsed.categoryNameNe : parsed.categoryName;

  // Build breadcrumb using parsed data
  const breadcrumbs = [{ label: tc('home'), href: `/${lang}` }];
  if (displayLocationName && displayCategoryName) {
    breadcrumbs.push({ label: displayLocationName, href: `/${lang}/ads/${parsed.locationSlug}` });
    breadcrumbs.push({ label: displayCategoryName, href: `/${lang}/ads/${parsed.locationSlug}/${parsed.categorySlug}` });
  } else if (displayLocationName) {
    breadcrumbs.push({ label: displayLocationName, href: `/${lang}/ads/${parsed.locationSlug}` });
  } else if (displayCategoryName) {
    breadcrumbs.push({ label: displayCategoryName, href: `/${lang}/ads/${parsed.categorySlug}` });
  } else {
    breadcrumbs.push({ label: t('allAds'), href: `/${lang}/ads` });
  }

  // Page title using parsed data
  let pageTitle = t('allAds');
  if (searchQuery) {
    pageTitle = `${t('searchLabel')} "${searchQuery}"`;
    if (displayCategoryName) pageTitle += ` ${t('in')} ${displayCategoryName}`;
    if (displayLocationName) pageTitle += ` - ${displayLocationName}`;
  } else {
    if (displayLocationName && displayCategoryName) {
      pageTitle = `${displayCategoryName} ${t('in')} ${displayLocationName}`;
    } else if (displayLocationName) {
      pageTitle = `${t('adsIn')} ${displayLocationName}`;
    } else if (displayCategoryName) {
      pageTitle = displayCategoryName;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  // ItemList JSON-LD for rich results (first 10 ads)
  const itemListData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: ads.slice(0, 10).map((ad: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: ad.title,
      url: `${baseUrl}/${lang}/ad/${ad.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured data */}
      <BreadcrumbJsonLd
        items={breadcrumbs.map(b => ({ name: b.label, url: `${baseUrl}${b.href}` }))}
      />
      {/* JSON.stringify produces safe output — no XSS risk from structured data we control */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListData) }}
      />
      {/* Mobile Filter Carousel + Drawer */}
      <AdsFilterWrapper
        lang={lang}
        categories={categories}
        locationHierarchy={locationHierarchy}
        selectedCategorySlug={parsed.categorySlug || undefined}
        selectedCategoryName={displayCategoryName || undefined}
        selectedLocationSlug={parsed.locationSlug || undefined}
        selectedLocationName={displayLocationName || undefined}
        minPrice={minPrice?.toString() || ''}
        maxPrice={maxPrice?.toString() || ''}
        condition={condition}
        sortBy={sortBy}
        searchQuery={searchQuery}
      />

      <div className="container-custom py-4 md:py-6">
        {/* Breadcrumb - Hidden on mobile, visible for desktop SEO */}
        <div className="hidden lg:block mb-4 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <Link href={crumb.href} className="text-rose-500 hover:text-rose-600 transition-colors">
                    {crumb.label}
                  </Link>
                  <span className="mx-2">/</span>
                </>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </div>

        {/* Page Header with Top Banner inline on desktop */}
        <div className="mb-4 md:mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 md:gap-4">
          {/* Title section - Hidden on mobile, visible for desktop SEO */}
          <div className="hidden lg:block">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
            <p className="text-gray-500">
              {tc('found')} <span className="font-semibold text-gray-900">{totalAds.toLocaleString()}</span> ads
              {hasActiveFilters && ` ${tc('matchingFilters')}`}
            </p>
          </div>
          {/* Hidden H1 for mobile SEO - screen reader only */}
          <h1 className="sr-only lg:hidden">{pageTitle}</h1>
          {/* Top Banner - 728x90 desktop inline / 320x100 mobile below */}
          <div className="flex-shrink-0">
            <div className="flex lg:hidden">
              <AdBanner slot="adsListingTopMobile" size="mobileBanner" autoExpand />
            </div>
            <div className="hidden lg:flex">
              <AdBanner slot="adsListingTop" size="leaderboard" autoExpand />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Filters Sidebar - Hidden on mobile (use drawer instead) */}
          <aside className="hidden lg:block lg:col-span-1">
            <AdsFilter
              lang={lang}
              categories={categories}
              locationHierarchy={locationHierarchy}
              selectedCategorySlug={parsed.categorySlug || undefined}
              selectedLocationSlug={parsed.locationSlug || undefined}
              selectedLocationName={displayLocationName || undefined}
              minPrice={minPrice?.toString() || ''}
              maxPrice={maxPrice?.toString() || ''}
              condition={condition}
              sortBy={sortBy}
              searchQuery={searchQuery}
            />

            {/* Sidebar Ad - 300x250 below filters */}
            <div className="mt-6 hidden lg:flex justify-center">
              <AdBanner slot="adsListingSidebar" size="mediumRectangle" autoExpand />
            </div>
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            {/* Search Bar */}
            <AdsSearchBar
              lang={lang}
              initialQuery={searchQuery}
              selectedCategorySlug={parsed.categorySlug || undefined}
              selectedLocationSlug={parsed.locationSlug || undefined}
            />

            {/* Sort & View Options */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 md:mb-6 flex flex-wrap justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                {totalAds > 0 && (
                  <>
                    {tc('showing')} {offset + 1}-{Math.min(offset + adsPerPage, totalAds)} {tc('of')} {totalAds} ads
                  </>
                )}
              </div>
              {/* Sort dropdown - hidden on mobile (available in filter carousel) */}
              <div className="hidden lg:block">
                <SortDropdown
                  currentSort={sortBy}
                  basePath={`/${lang}/ads${urlParams ? `/${urlParams.join('/')}` : ''}`}
                />
              </div>
            </div>

            {/* No Results */}
            {ads.length === 0 && (
              <div className="card text-center py-12">
                <div className="mb-4 flex justify-center">
                  <SearchX size={64} className="text-gray-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('noAdsFound')}</h3>
                <p className="text-gray-500 mb-4">
                  {t('tryAdjustingFilters')}
                </p>
                {hasActiveFilters && (
                  <Link href={`/${lang}/ads`} className="px-6 py-3 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors inline-block">
                    {tc('viewAllAds')}
                  </Link>
                )}
              </div>
            )}

            {/* Results Grid */}
            {ads.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-4 md:mb-6">
                  {ads.map((ad: any, index: number) => (
                    <React.Fragment key={ad.id}>
                      <AdCard
                        lang={lang}
                        ad={{
                          id: ad.id,
                          title: ad.title,
                          price: ad.price ? parseFloat(ad.price.toString()) : 0,
                          primaryImage: ad.ad_images && ad.ad_images.length > 0
                            ? ad.ad_images[0]?.file_path || null
                            : null,
                          categoryName: ad.categories?.name || null,
                          categoryIcon: ad.categories?.icon || null,
                          districtName: resolveDistrictName(ad.locations),
                          // publishedAt = when editor approved (use this for "time ago" display)
                          publishedAt: ad.published_at || ad.reviewed_at || ad.created_at || new Date(),
                          createdAt: ad.created_at || new Date(),
                          sellerName: ad.users_ads_user_idTousers?.full_name || tc('unknownSeller'),
                          isFeatured: ad.is_featured || false,
                          isUrgent: ad.is_urgent || false,
                          isSticky: ad.is_sticky || false,
                          featuredUntil: ad.featured_until || null,
                          urgentUntil: ad.urgent_until || null,
                          stickyUntil: ad.sticky_until || null,
                          condition: ad.condition || null,
                          slug: ad.slug || undefined,
                          accountType: ad.users_ads_user_idTousers?.account_type || undefined,
                          // Suspended/deactivated sellers show no badge (publicVerification)
                          businessVerificationStatus: publicVerification(ad.users_ads_user_idTousers).businessVerificationStatus || undefined,
                          individualVerified: publicVerification(ad.users_ads_user_idTousers).individualVerified,
                        }}
                      />
                      {/* In-Feed Ad after every 6th card */}
                      {(index + 1) % 6 === 0 && index < ads.length - 1 && (
                        <div className="col-span-full flex justify-center items-center bg-gray-50 rounded-xl p-4">
                          <AdBanner slot="adsListingInFeed" size="mediumRectangle" autoExpand />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Pagination */}
                <AdsPagination
                  page={page}
                  totalPages={totalPages}
                  buildHref={(p) => {
                    const basePath = `/${lang}/ads${urlParams ? `/${urlParams.join('/')}` : ''}`;
                    const params = new URLSearchParams();
                    if (p > 1) params.set('page', String(p));
                    if (search.query) params.set('query', search.query);
                    if (search.minPrice) params.set('minPrice', search.minPrice);
                    if (search.maxPrice) params.set('maxPrice', search.maxPrice);
                    if (search.condition) params.set('condition', search.condition);
                    if (search.sortBy) params.set('sortBy', search.sortBy);
                    if (search.userId) params.set('userId', search.userId);
                    const qs = params.toString();
                    return qs ? `${basePath}?${qs}` : basePath;
                  }}
                />

                {/* Bottom Banner - 336x280 */}
                <div className="flex justify-center mt-8">
                  <AdBanner slot="adsListingBottom" size="largeRectangle" autoExpand />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
