import { Metadata } from 'next';
import { prisma } from '@thulobazaar/database';
import AllAdsFilters from './AllAdsFilters';
import AdCard from '@/components/AdCard';
import AllAdsPagination from './AllAdsPagination';
import Breadcrumb from '@/components/Breadcrumb';
import { getFilterIds } from '@/lib/urlParser';
import {
  buildAdsOrderBy,
  buildAdsWhereClause,
  standardAdInclude,
  type AdsSortBy,
} from '@/lib/adsQueryBuilder';
import { getRootCategoriesWithChildren } from '@/lib/categories';
import { getLocationHierarchy } from '@/lib/locationHierarchy';

interface AllAdsPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    page?: string;
    category?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  }>;
}

export async function generateMetadata({ params }: AllAdsPageProps): Promise<Metadata> {
  const { lang } = await params;

  return {
    title: 'All Ads - Thulobazaar',
    description: 'Browse all classified ads in Nepal. Find electronics, vehicles, property, and more.',
  };
}

export default async function AllAdsPage({ params, searchParams }: AllAdsPageProps) {
  const { lang } = await params;
  const filters = await searchParams;

  const page = filters.page ? parseInt(filters.page) : 1;
  const categorySlug = filters.category || undefined;
  const locationSlug = filters.location || undefined;
  const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : undefined;
  const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : undefined;
  const sortBy = filters.sortBy || 'newest';
  const adsPerPage = 24;
  const offset = (page - 1) * adsPerPage;

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
        select: {
          id: true,
          type: true,
        },
      })
    : null;

  const categoryId = selectedCategory?.id;
  const locationId = selectedLocation?.id;

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
  });

  const orderBy = buildAdsOrderBy(sortBy as AdsSortBy);

  // Fetch ads with images and hierarchical data
  const [ads, totalAds, locationHierarchy, rootCategories] = await Promise.all([
    prisma.ads.findMany({
      where,
      include: standardAdInclude,
      orderBy,
      take: adsPerPage,
      skip: offset,
    }),
    prisma.ads.count({ where }),
    getLocationHierarchy(),
    getRootCategoriesWithChildren(),
  ]);

  const totalPages = Math.ceil(totalAds / adsPerPage);

  // Define custom order for categories
  const categoryOrder = ['Mobile', 'Electronics', 'Vehicles', 'Home & Living', 'Property'];

  const categories = rootCategories
    .map((category) => ({
      ...category,
      icon: category.icon || '📁',
    }))
    .sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.name);
      const bIndex = categoryOrder.indexOf(b.name);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.name.localeCompare(b.name);
    });


  const breadcrumbItems = [
    { label: 'Home', path: `/${lang}` },
    { label: 'All Ads', current: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Container with sidebar layout */}
      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Fixed width */}
        <aside className="hidden lg:block w-[280px] min-w-[280px] bg-white border-r border-gray-200 sticky top-0 self-start">
          <AllAdsFilters
            lang={lang}
            categories={categories}
            locationHierarchy={locationHierarchy}
            selectedCategory={categorySlug}
            selectedLocation={locationSlug}
            minPrice={minPrice?.toString() || ''}
            maxPrice={maxPrice?.toString() || ''}
          />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              All Ads
            </h1>
            <p className="text-gray-500">
              Found <span className="font-semibold text-gray-800">{totalAds.toLocaleString()}</span> ads
            </p>
          </div>

          {/* Ads Grid */}
          {ads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-semibold mb-2">
                No ads found
              </h3>
              <p className="text-gray-500">
                Check back later for new listings
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
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
          )}

          {/* Pagination */}
          <div className="mt-12">
            <AllAdsPagination
              currentPage={page}
              totalPages={totalPages}
              lang={lang}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
