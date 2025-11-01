import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@thulobazaar/database';
import SearchFilters from '../../search/SearchFilters';
import AdCard from '@/components/AdCard';

interface AdsPageProps {
  params: Promise<{ lang: string; params?: string[] }>;
  searchParams: Promise<{
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: 'new' | 'used';
    sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  }>;
}

export async function generateMetadata({ params }: AdsPageProps): Promise<Metadata> {
  const { params: urlParams } = await params;

  // Parse URL params
  let locationName = '';
  let categoryName = '';

  if (urlParams && urlParams.length > 0) {
    const firstParam = urlParams[0];

    // Handle explicit /ads/category/{slug} pattern
    if (firstParam === 'category' && urlParams.length > 1) {
      const category = await prisma.categories.findFirst({
        where: { slug: urlParams[1] },
        select: { name: true },
      });
      categoryName = category?.name || '';
    }
    // Handle explicit /ads/location/{slug} pattern
    else if (firstParam === 'location' && urlParams.length > 1) {
      const location = await prisma.locations.findFirst({
        where: { slug: urlParams[1] },
        select: { name: true },
      });
      locationName = location?.name || '';
    }
    // Check if first param is location or category
    else {
      const location = await prisma.locations.findFirst({
        where: { slug: firstParam },
        select: { name: true },
      });

      if (location) {
        locationName = location.name;
        if (urlParams.length > 1) {
          const category = await prisma.categories.findFirst({
            where: { slug: urlParams[1] },
            select: { name: true },
          });
          categoryName = category?.name || '';
        }
      } else {
        const category = await prisma.categories.findFirst({
          where: { slug: firstParam },
          select: { name: true },
        });
        categoryName = category?.name || '';
      }
    }
  }

  let title = 'All Ads - Thulobazaar';
  let description = 'Browse all classified ads across Nepal. Find electronics, vehicles, property, and more.';

  if (locationName && categoryName) {
    title = `${categoryName} in ${locationName} - Thulobazaar`;
    description = `Find ${categoryName} ads in ${locationName}, Nepal. Browse and buy ${categoryName} products.`;
  } else if (locationName) {
    title = `Ads in ${locationName} - Thulobazaar`;
    description = `Browse all classified ads in ${locationName}, Nepal.`;
  } else if (categoryName) {
    title = `${categoryName} Ads - Thulobazaar`;
    description = `Find ${categoryName} for sale across Nepal. Browse quality ${categoryName} products.`;
  }

  return { title, description };
}

export default async function AdsPage({ params, searchParams }: AdsPageProps) {
  const { lang, params: urlParams } = await params;
  const search = await searchParams;

  // Parse search parameters
  const page = search.page ? parseInt(search.page) : 1;
  const minPrice = search.minPrice ? parseFloat(search.minPrice) : undefined;
  const maxPrice = search.maxPrice ? parseFloat(search.maxPrice) : undefined;
  const condition = search.condition;
  const sortBy = search.sortBy || 'newest';
  const adsPerPage = 20;
  const offset = (page - 1) * adsPerPage;

  // Parse URL params to determine location and category
  let locationSlug: string | undefined;
  let categorySlug: string | undefined;
  let locationId: number | undefined;
  let categoryId: number | undefined;
  let locationName = '';
  let categoryName = '';

  if (urlParams && urlParams.length > 0) {
    const firstParam = urlParams[0];

    // Handle explicit /ads/category/{slug} pattern
    if (firstParam === 'category' && urlParams.length > 1) {
      const category = await prisma.categories.findFirst({
        where: { slug: urlParams[1] },
        select: { id: true, name: true },
      });

      if (category) {
        categorySlug = urlParams[1];
        categoryId = category.id;
        categoryName = category.name;
      } else {
        notFound();
      }
    }
    // Handle explicit /ads/location/{slug} pattern
    else if (firstParam === 'location' && urlParams.length > 1) {
      const location = await prisma.locations.findFirst({
        where: { slug: urlParams[1] },
        select: { id: true, name: true },
      });

      if (location) {
        locationSlug = urlParams[1];
        locationId = location.id;
        locationName = location.name;
      } else {
        notFound();
      }
    }
    // Try to find as location first
    else {
      const location = await prisma.locations.findFirst({
        where: { slug: firstParam },
        select: { id: true, name: true },
      });

      if (location) {
        // First param is a location
        locationSlug = firstParam;
        locationId = location.id;
        locationName = location.name;

        // Check if second param is category
        if (urlParams.length > 1) {
          const category = await prisma.categories.findFirst({
            where: { slug: urlParams[1] },
            select: { id: true, name: true },
          });
          if (category) {
            categorySlug = urlParams[1];
            categoryId = category.id;
            categoryName = category.name;
          }
        }
      } else {
        // First param is not a location, try as category
        const category = await prisma.categories.findFirst({
          where: { slug: firstParam },
          select: { id: true, name: true },
        });

        if (category) {
          categorySlug = firstParam;
          categoryId = category.id;
          categoryName = category.name;
        } else {
          // Param not found as either location or category
          notFound();
        }
      }
    }
  }

  // Build Prisma where clause
  const where: any = {
    status: 'approved',
    deleted_at: null,
    ad_images: {
      some: {}, // Only show ads with at least one image
    },
  };

  // Category filter (supports hierarchy - parent or subcategory)
  if (categoryId) {
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
        // Municipality or area - exact match
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
    categoryId || locationId || minPrice || maxPrice || condition
  );

  // Build breadcrumb
  const breadcrumbs = [{ label: 'Home', href: `/${lang}` }];
  if (locationName && categoryName) {
    breadcrumbs.push({ label: locationName, href: `/${lang}/ads/${locationSlug}` });
    breadcrumbs.push({ label: categoryName, href: `/${lang}/ads/${locationSlug}/${categorySlug}` });
  } else if (locationName) {
    breadcrumbs.push({ label: locationName, href: `/${lang}/ads/${locationSlug}` });
  } else if (categoryName) {
    breadcrumbs.push({ label: categoryName, href: `/${lang}/ads/${categorySlug}` });
  } else {
    breadcrumbs.push({ label: 'All Ads', href: `/${lang}/ads` });
  }

  // Page title
  let pageTitle = 'All Ads';
  if (locationName && categoryName) {
    pageTitle = `${categoryName} in ${locationName}`;
  } else if (locationName) {
    pageTitle = `Ads in ${locationName}`;
  } else if (categoryName) {
    pageTitle = categoryName;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-muted">
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <Link href={crumb.href} className="link">
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
            </div>

            {/* No Results */}
            {ads.length === 0 && (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No ads found</h3>
                <p className="text-muted mb-4">
                  Try adjusting your filters or browse other categories
                </p>
                {hasActiveFilters && (
                  <Link href={`/${lang}/ads`} className="btn-primary inline-block">
                    View All Ads
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
                  <div className="flex justify-center gap-2 mt-6">
                    {page > 1 && (
                      <Link
                        href={`/${lang}/ads${urlParams ? `/${urlParams.join('/')}` : ''}?page=${page - 1}`}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="px-4 py-2 bg-primary text-white rounded-lg">
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
