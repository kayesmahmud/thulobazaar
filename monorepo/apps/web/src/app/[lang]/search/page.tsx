import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@thulobazaar/database';
import SearchFilters from './SearchFilters';
import SearchPagination from './SearchPagination';
import SortDropdown from './SortDropdown';
import AdCard from '@/components/AdCard';
import Breadcrumb from '@/components/Breadcrumb';
import { getFilterIds } from '@/lib/urlParser';
import { getLocationHierarchy } from '@/lib/locationHierarchy';
import {
  buildAdsOrderBy,
  buildAdsWhereClause,
  standardAdInclude,
  type AdsSortBy,
} from '@/lib/adsQueryBuilder';
import { getRootCategoriesWithChildren } from '@/lib/categories';

interface SearchPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string; // Category slug (e.g., "mobiles")
    location?: string; // Location slug (e.g., "kathmandu")
    minPrice?: string;
    maxPrice?: string;
    condition?: 'new' | 'used';
    page?: string;
    sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || '';

  return {
    title: query ? `Search: ${query} - Thulobazaar` : 'Search Ads - Thulobazaar',
    description: 'Search through thousands of classified ads across Nepal. Find electronics, vehicles, property, and more.',
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { lang } = await params;
  const search = await searchParams;

  // Parse search parameters
  const query = search.q || '';
  const categorySlug = search.category || undefined;
  const locationSlug = search.location || undefined;
  const minPrice = search.minPrice ? parseFloat(search.minPrice) : undefined;
  const maxPrice = search.maxPrice ? parseFloat(search.maxPrice) : undefined;
  const condition = search.condition;
  const page = search.page ? parseInt(search.page) : 1;
  const sortBy = search.sortBy || 'newest';

  const selectedCategory = categorySlug
    ? await prisma.categories.findFirst({
        where: { slug: categorySlug },
        select: {
          id: true,
          parent_id: true,
          other_categories: {
            select: { id: true },
          },
        },
      })
    : null;

  const selectedLocation = locationSlug
    ? await prisma.locations.findFirst({
        where: { slug: locationSlug },
        select: { id: true, type: true },
      })
    : null;

  const categoryId = selectedCategory?.id;
  const locationId = selectedLocation?.id;

  const adsPerPage = 20;
  const offset = (page - 1) * adsPerPage;

  const { locationIds, categoryIds } = await getFilterIds(
    locationId ?? null,
    selectedLocation?.type ?? null,
    categoryId ?? null,
    Boolean(
      selectedCategory &&
        selectedCategory.parent_id === null &&
        (selectedCategory.other_categories?.length || 0) > 0
    )
  );

  const where = buildAdsWhereClause({
    categoryIds,
    locationIds,
    minPrice,
    maxPrice,
    condition,
    searchQuery: query,
  });

  const orderBy = buildAdsOrderBy(sortBy as AdsSortBy);

  // Fetch ads and total count in parallel
  const [ads, totalAds, categories, locationHierarchy] = await Promise.all([
    // Get paginated ads with relations
    prisma.ads.findMany({
      where,
      orderBy,
      take: adsPerPage,
      skip: offset,
      include: standardAdInclude,
    }),
    // Get total count for pagination
    prisma.ads.count({ where }),
    // Get categories for filter panel
    getRootCategoriesWithChildren(),
    // Prefetch hierarchical locations once on the server
    getLocationHierarchy(),
  ]);

  const totalPages = Math.ceil(totalAds / adsPerPage);

  // Determine which filters are active
  const hasActiveFilters = Boolean(
    query || categoryId || locationId || minPrice || maxPrice || condition
  );

  const breadcrumbItems = [
    { label: 'Home', path: `/${lang}` },
    { label: 'Search Results', current: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />

      <div className="container-custom py-6">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {query ? `Search results for "${query}"` : 'All Ads'}
          </h1>
          <p className="text-muted">
            Found <span className="font-semibold text-gray-900">{totalAds.toLocaleString()}</span> ads
            {hasActiveFilters && ' matching your filters'}
          </p>
        </div>

        <div className="grid grid-cols-1 laptop:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="laptop:col-span-1">
            <SearchFilters
              lang={lang}
              categories={categories}
              locationHierarchy={locationHierarchy}
              selectedCategory={categorySlug}
              selectedLocation={locationSlug}
              minPrice={minPrice?.toString() || ''}
              maxPrice={maxPrice?.toString() || ''}
              condition={condition}
            />
          </aside>

          {/* Results */}
          <main className="laptop:col-span-3">
            {/* Sort & View Options */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
              <div className="text-sm text-muted">
                {totalAds > 0 && (
                  <>
                    Showing {offset + 1}-{Math.min(offset + adsPerPage, totalAds)} of {totalAds} ads
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-muted">
                  Sort by:
                </label>
                <SortDropdown lang={lang} currentSort={sortBy} />
              </div>
            </div>

            {/* No Results */}
            {ads.length === 0 && (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No ads found</h3>
                <p className="text-muted mb-4">
                  Try adjusting your filters or search query
                </p>
                {hasActiveFilters && (
                  <Link href={`/${lang}/search`} className="btn-primary inline-block">
                    Clear All Filters
                  </Link>
                )}
              </div>
            )}

            {/* Results Grid */}
            {ads.length > 0 && (
              <>
                <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4 mb-6">
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
                  <SearchPagination
                    currentPage={page}
                    totalPages={totalPages}
                    lang={lang}
                    searchParams={search}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
