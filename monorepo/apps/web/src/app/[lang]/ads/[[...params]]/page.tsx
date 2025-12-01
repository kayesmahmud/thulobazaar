import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@thulobazaar/database';
import AdsFilter from '@/components/AdsFilter';
import AdCard from '@/components/AdCard';
import { parseAdUrlParams, getFilterIds } from '@/lib/urlParser';
import { generateAdListingMetadata } from '@/lib/urlBuilder';
import { getLocationHierarchy } from '@/lib/locationHierarchy';
import { getRootCategoriesWithChildren } from '@/lib/categories';
import { buildAdsWhereClause, buildAdsOrderBy, standardAdInclude } from '@/lib/adsQueryBuilder';

interface AdsPageProps {
  params: Promise<{ lang: string; params?: string[] }>;
  searchParams: Promise<{
    query?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: 'new' | 'used';
    sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  }>;
}

export async function generateMetadata({ params, searchParams }: AdsPageProps): Promise<Metadata> {
  const { params: urlParams } = await params;
  const filters = await searchParams;

  // Parse URL parameters using helper function
  const parsed = await parseAdUrlParams(urlParams);

  // Generate metadata based on filters
  const metadata = generateAdListingMetadata(
    parsed.locationName,
    parsed.categoryName,
    filters.query || null,
    0 // Placeholder - will show actual count on page
  );

  return metadata;
}

export default async function AdsPage({ params, searchParams }: AdsPageProps) {
  const { lang, params: urlParams } = await params;
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
  });

  // Build order by clause using shared helper
  const orderBy = buildAdsOrderBy(sortBy as 'newest' | 'oldest' | 'price_asc' | 'price_desc');

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

  // Build breadcrumb using parsed data
  const breadcrumbs = [{ label: 'Home', href: `/${lang}` }];
  if (parsed.locationName && parsed.categoryName) {
    breadcrumbs.push({ label: parsed.locationName, href: `/${lang}/ads/${parsed.locationSlug}` });
    breadcrumbs.push({ label: parsed.categoryName, href: `/${lang}/ads/${parsed.locationSlug}/${parsed.categorySlug}` });
  } else if (parsed.locationName) {
    breadcrumbs.push({ label: parsed.locationName, href: `/${lang}/ads/${parsed.locationSlug}` });
  } else if (parsed.categoryName) {
    breadcrumbs.push({ label: parsed.categoryName, href: `/${lang}/ads/${parsed.categorySlug}` });
  } else {
    breadcrumbs.push({ label: 'All Ads', href: `/${lang}/ads` });
  }

  // Page title using parsed data
  let pageTitle = 'All Ads';
  if (searchQuery) {
    pageTitle = `Search: "${searchQuery}"`;
    if (parsed.categoryName) pageTitle += ` in ${parsed.categoryName}`;
    if (parsed.locationName) pageTitle += ` - ${parsed.locationName}`;
  } else {
    if (parsed.locationName && parsed.categoryName) {
      pageTitle = `${parsed.categoryName} in ${parsed.locationName}`;
    } else if (parsed.locationName) {
      pageTitle = `Ads in ${parsed.locationName}`;
    } else if (parsed.categoryName) {
      pageTitle = parsed.categoryName;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-500">
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

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-500">
            Found <span className="font-semibold text-gray-900">{totalAds.toLocaleString()}</span> ads
            {hasActiveFilters && ' matching your filters'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <AdsFilter
              lang={lang}
              categories={categories}
              locationHierarchy={locationHierarchy}
              selectedCategorySlug={parsed.categorySlug || undefined}
              selectedLocationSlug={parsed.locationSlug || undefined}
              selectedLocationName={parsed.locationName || undefined}
              minPrice={minPrice?.toString() || ''}
              maxPrice={maxPrice?.toString() || ''}
              condition={condition}
              sortBy={sortBy}
              searchQuery={searchQuery}
            />
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            {/* Sort & View Options */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                {totalAds > 0 && (
                  <>
                    Showing {offset + 1}-{Math.min(offset + adsPerPage, totalAds)} of {totalAds} ads
                  </>
                )}
              </div>
            </div>

            {/* No Results */}
            {ads.length === 0 && (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No ads found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or browse other categories
                </p>
                {hasActiveFilters && (
                  <Link href={`/${lang}/ads`} className="px-6 py-3 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors inline-block">
                    View All Ads
                  </Link>
                )}
              </div>
            )}

            {/* Results Grid */}
            {ads.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {ads.map((ad) => (
                    <AdCard
                      key={ad.id}
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
                        createdAt: ad.created_at || new Date(),
                        sellerName: ad.users_ads_user_idTousers?.full_name || 'Unknown',
                        isFeatured: ad.is_featured || false,
                        isUrgent: ad.is_urgent || false,
                        condition: ad.condition || null,
                        slug: ad.slug || undefined,
                        accountType: ad.users_ads_user_idTousers?.account_type || undefined,
                        businessVerificationStatus: ad.users_ads_user_idTousers?.business_verification_status || undefined,
                        individualVerified: ad.users_ads_user_idTousers?.individual_verified || false,
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {page > 1 && (
                      <Link
                        href={`/${lang}/ads${urlParams ? `/${urlParams.join('/')}` : ''}?page=${page - 1}`}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="px-4 py-2 bg-rose-500 text-white rounded-lg">
                      {page}
                    </span>
                    {page < totalPages && (
                      <Link
                        href={`/${lang}/ads${urlParams ? `/${urlParams.join('/')}` : ''}?page=${page + 1}`}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
