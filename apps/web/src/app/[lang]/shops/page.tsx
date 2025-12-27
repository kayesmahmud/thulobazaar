// @ts-nocheck
import { Metadata } from 'next';
import { prisma } from '@thulobazaar/database';
import ShopsFilters from './ShopsFilters';
import ShopCard from './ShopCard';
import ShopsPagination from './ShopsPagination';
import { Breadcrumb } from '@/components/ui';
import { getRootCategoriesWithChildren, getLocationHierarchy } from '@/lib/location';

interface ShopsPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    page?: string;
    category?: string;
    location?: string;
  }>;
}

export async function generateMetadata({ params }: ShopsPageProps): Promise<Metadata> {
  const { lang } = await params;

  return {
    title: 'All Shops - Thulobazaar',
    description: 'Browse all verified shops and sellers on Thulobazaar. Find trusted businesses and individual sellers in Nepal.',
  };
}

export default async function ShopsPage({ params, searchParams }: ShopsPageProps) {
  const { lang } = await params;
  const filters = await searchParams;

  const page = filters.page ? parseInt(filters.page) : 1;
  const categorySlug = filters.category || undefined;
  const locationSlug = filters.location || undefined;
  const shopsPerPage = 24;
  const offset = (page - 1) * shopsPerPage;

  // Get selected category ID if filter is applied
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

  // Get selected location ID if filter is applied
  const selectedLocation = locationSlug
    ? await prisma.locations.findFirst({
        where: { slug: locationSlug },
        select: { id: true, type: true },
      })
    : null;

  // Build category IDs array (include subcategories if parent selected)
  let categoryIds: number[] | undefined;
  if (selectedCategory) {
    if (selectedCategory.parent_id === null && selectedCategory.other_categories?.length > 0) {
      // Parent category selected - include all subcategory IDs
      categoryIds = [
        selectedCategory.id,
        ...selectedCategory.other_categories.map((sub) => sub.id),
      ];
    } else {
      // Subcategory or category without children
      categoryIds = [selectedCategory.id];
    }
  }

  // Build location IDs array (include child locations if parent selected)
  let locationIds: number[] | undefined;
  if (selectedLocation) {
    // Get all child location IDs recursively
    const childLocations = await getChildLocationIds(selectedLocation.id);
    locationIds = [selectedLocation.id, ...childLocations];
  }

  // Build where clause for shops (exclude soft-deleted users)
  const where: any = {
    is_active: true,
    deleted_at: null,
  };

  // Filter by category (either default_category_id or default_subcategory_id)
  if (categoryIds && categoryIds.length > 0) {
    where.OR = [
      { default_category_id: { in: categoryIds } },
      { default_subcategory_id: { in: categoryIds } },
    ];
  }

  // Filter by location
  if (locationIds && locationIds.length > 0) {
    where.location_id = { in: locationIds };
  }

  // Fetch shops
  const [shops, totalShops, locationHierarchy, rootCategories] = await Promise.all([
    prisma.users.findMany({
      where,
      select: {
        id: true,
        full_name: true,
        shop_slug: true,
        custom_shop_slug: true,
        business_name: true,
        avatar: true,
        cover_photo: true,
        bio: true,
        business_description: true,
        account_type: true,
        business_verification_status: true,
        individual_verified: true,
        created_at: true,
        default_category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        default_subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        locations: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            ads_ads_user_idTousers: true,
          },
        },
      },
      orderBy: [
        // Prioritize verified businesses
        { business_verification_status: 'desc' },
        // Then by individual verification
        { individual_verified: 'desc' },
        // Finally by newest
        { created_at: 'desc' },
      ],
      take: shopsPerPage,
      skip: offset,
    }),
    prisma.users.count({ where }),
    getLocationHierarchy(),
    getRootCategoriesWithChildren(),
  ]);

  const totalPages = Math.ceil(totalShops / shopsPerPage);

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

  // Transform shops data
  const transformedShops = shops.map((shop) => ({
    id: shop.id,
    shopSlug: shop.custom_shop_slug || shop.shop_slug || `shop-${shop.id}`,
    displayName: shop.business_name || shop.full_name || 'Shop',
    avatar: shop.avatar,
    coverPhoto: shop.cover_photo,
    bio: shop.bio,
    businessDescription: shop.business_description,
    accountType: shop.account_type,
    businessVerificationStatus: shop.business_verification_status,
    individualVerified: shop.individual_verified || false,
    categoryName: shop.default_category?.name || null,
    categoryIcon: shop.default_category?.icon || null,
    subcategoryName: shop.default_subcategory?.name || null,
    locationName: shop.locations?.name || null,
    totalAds: shop._count.ads_ads_user_idTousers,
    memberSince: new Date(shop.created_at || '').toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
  }));

  const breadcrumbItems = [
    { label: 'Home', path: `/${lang}` },
    { label: 'All Shops', current: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Container with sidebar layout */}
      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Fixed width */}
        <aside className="hidden lg:block w-[280px] min-w-[280px] bg-white border-r border-gray-200 sticky top-0 self-start">
          <ShopsFilters
            lang={lang}
            categories={categories}
            locationHierarchy={locationHierarchy}
            selectedCategory={categorySlug}
            selectedLocation={locationSlug}
          />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              All Shops
            </h1>
            <p className="text-gray-500">
              Found <span className="font-semibold text-gray-800">{totalShops.toLocaleString()}</span> shops
            </p>
          </div>

          {/* Shops Grid */}
          {transformedShops.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-2xl font-semibold mb-2">
                No shops found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
              {transformedShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} lang={lang} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-12">
            <ShopsPagination
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

// Helper function to get all child location IDs recursively
async function getChildLocationIds(parentId: number): Promise<number[]> {
  const children = await prisma.locations.findMany({
    where: { parent_id: parentId },
    select: { id: true },
  });

  const childIds = children.map((c) => c.id);
  const grandchildIds = await Promise.all(
    childIds.map((id) => getChildLocationIds(id))
  );

  return [...childIds, ...grandchildIds.flat()];
}
