import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@thulobazaar/database';
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';
import SearchFilters from './SearchFilters';
import SearchPagination from './SearchPagination';
import SortDropdown from './SortDropdown';
import AdCard from '@/components/AdCard';

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

  // Convert category slug to ID
  let categoryId: number | undefined;
  if (categorySlug) {
    const category = await prisma.categories.findFirst({
      where: { slug: categorySlug },
      select: { id: true },
    });
    categoryId = category?.id;
  }

  // Convert location slug to ID
  let locationId: number | undefined;
  if (locationSlug) {
    const location = await prisma.locations.findFirst({
      where: { slug: locationSlug },
      select: { id: true },
    });
    locationId = location?.id;
  }

  const adsPerPage = 20;
  const offset = (page - 1) * adsPerPage;

  // Build Prisma where clause
  const where: any = {
    status: 'approved',
    deleted_at: null, // Exclude soft-deleted ads
    ad_images: {
      some: {}, // Only show ads that have at least one image
    },
  };

  // Text search (search in title and description)
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Category filter (supports hierarchy - parent or subcategory)
  if (categoryId) {
    // Check if selected category is a parent category (has subcategories)
    const selectedCategory = await prisma.categories.findUnique({
      where: { id: categoryId },
      include: {
        other_categories: {
          select: { id: true },
        },
      },
    });

    if (selectedCategory && selectedCategory.other_categories && selectedCategory.other_categories.length > 0) {
      // Parent category selected - include all subcategories
      const subcategoryIds = selectedCategory.other_categories.map((sub) => sub.id);
      where.category_id = { in: [categoryId, ...subcategoryIds] };
    } else {
      // Subcategory selected - exact match
      where.category_id = categoryId;
    }
  }

  // Location filter (supports hierarchy - province, district, or municipality)
  if (locationId) {
    // Get the location to check its type
    const selectedLocation = await prisma.locations.findUnique({
      where: { id: locationId },
      select: { id: true, type: true },
    });

    if (selectedLocation) {
      if (selectedLocation.type === 'province') {
        // Get all district IDs in this province
        const districts = await prisma.locations.findMany({
          where: { parent_id: locationId, type: 'district' },
          select: { id: true },
        });
        const districtIds = districts.map((d) => d.id);

        // Get all municipality IDs in these districts
        const municipalities = await prisma.locations.findMany({
          where: { parent_id: { in: districtIds }, type: 'municipality' },
          select: { id: true },
        });

        // Combine province, districts, and municipalities
        const allLocationIds = [
          locationId,
          ...districtIds,
          ...municipalities.map((m) => m.id),
        ];
        where.location_id = { in: allLocationIds };
      } else if (selectedLocation.type === 'district') {
        // Get district and all its municipalities
        const municipalities = await prisma.locations.findMany({
          where: { parent_id: locationId, type: 'municipality' },
          select: { id: true },
        });

        const allLocationIds = [locationId, ...municipalities.map((m) => m.id)];
        where.location_id = { in: allLocationIds };
      } else {
        // Municipality - exact match
        where.location_id = locationId;
      }
    }
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Condition filter
  if (condition) {
    where.condition = condition;
  }

  // Build order by clause
  let orderBy: any = { created_at: 'desc' }; // Default: newest first
  if (sortBy === 'oldest') orderBy = { created_at: 'asc' };
  if (sortBy === 'price_asc') orderBy = { price: 'asc' };
  if (sortBy === 'price_desc') orderBy = { price: 'desc' };

  // Fetch ads and total count in parallel
  const [ads, totalAds, categories, topLocations] = await Promise.all([
    // Get paginated ads with relations
    prisma.ads.findMany({
      where,
      orderBy,
      take: adsPerPage,
      skip: offset,
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
        categories: {
          select: {
            id: true,
            name: true,
            icon: true,
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
    }),
    // Get total count for pagination
    prisma.ads.count({ where }),
    // Get categories for filter panel (with slugs)
    prisma.categories.findMany({
      where: { parent_id: null },
      orderBy: { name: 'asc' },
      include: {
        other_categories: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    // Get top-level locations (provinces) for filter panel
    prisma.locations.findMany({
      where: { type: 'province' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalAds / adsPerPage);

  // Determine which filters are active
  const hasActiveFilters = Boolean(
    query || categoryId || locationId || minPrice || maxPrice || condition
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-muted">
          <Link href={`/${lang}`} className="link">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>Search Results</span>
        </div>

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
              categories={categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon || '📁',
                subcategories: cat.other_categories || [],
              }))}
              locations={topLocations}
              selectedCategory={categorySlug}
              selectedLocation={locationId}
              minPrice={minPrice?.toString() || ''}
              maxPrice={maxPrice?.toString() || ''}
              condition={condition}
              sortBy={sortBy}
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
                        price: parseFloat(ad.price.toString()),
                        primaryImage: ad.ad_images && ad.ad_images.length > 0
                          ? ad.ad_images[0].file_path
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
