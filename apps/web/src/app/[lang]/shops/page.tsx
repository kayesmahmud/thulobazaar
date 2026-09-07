// @ts-nocheck
import { Metadata } from 'next';
import { prisma } from '@thulobazaar/database';
import { publicVerification } from '@thulobazaar/types';
import ShopsFilters from './ShopsFilters';
import ShopCard from './ShopCard';
import ShopsPagination from './ShopsPagination';
import { Breadcrumb } from '@/components/ui';
import { getRootCategoriesWithChildren, getLocationHierarchy } from '@/lib/location';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

interface ShopsPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    page?: string;
    category?: string;
    location?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: ShopsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const filters = await searchParams;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const page = filters.page ? parseInt(filters.page) : 1;
  const pageSuffix = page > 1 ? `?page=${page}` : '';
  const title = page > 1 ? `${t('shopsTitle')} - Page ${page}` : t('shopsTitle');
  const description = t('shopsDescription');

  return {
    title,
    description,
    openGraph: {
      title: t('shopsTitle'),
      description,
      url: `${baseUrl}/${lang}/shops${pageSuffix}`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: t('shopsTitle'),
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/shops${pageSuffix}`,
      languages: {
        en: `${baseUrl}/en/shops${pageSuffix}`,
        ne: `${baseUrl}/ne/shops${pageSuffix}`,
        'x-default': `${baseUrl}/en/shops${pageSuffix}`,
      },
    },
    // The directory itself isn't a search landing page — the individual shop
    // pages are. At 24 shops/page that's ~92 paginated URLs per language, and
    // every ?category x ?location combination is another one on top.
    //
    // follow stays ON deliberately: this listing is the only remaining crawl
    // path to shops with no ads (they were dropped from the sitemap), and
    // Google has to reach those pages to see their noindex before it will drop
    // them from the index. Blocking this in robots.txt instead would strand
    // them as "Indexed, though blocked by robots.txt".
    robots: { index: false, follow: true },
  };
}

export default async function ShopsPage({ params, searchParams }: ShopsPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  const tc = await getTranslations('common');
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

  // Build where clause for shops (exclude soft-deleted users and staff —
  // editors/admins are moderators, not sellers)
  const where: any = {
    is_active: true,
    deleted_at: null,
    NOT: { role: { in: ['editor', 'super_admin'] } },
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
        is_suspended: true,
        is_active: true,
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

  // Use DB display_order (already sorted by getRootCategoriesWithChildren)
  const categories = rootCategories;

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
    // Suspended/deactivated accounts show no badge (publicVerification)
    ...publicVerification(shop),
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
    { label: tc('home'), path: `/${lang}` },
    { label: tc('allShops'), current: true },
  ];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbJsonLd
        items={[
          { name: tc('home'), url: `${baseUrl}/${lang}` },
          { name: tc('allShops'), url: `${baseUrl}/${lang}/shops` },
        ]}
      />
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 px-4 lg:px-8">
          {/* Header */}
          <div className="mb-4 md:mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {tc('allShops')}
            </h1>
            <p className="text-gray-500">
              {tc('found')} <span className="font-semibold text-gray-800">{totalShops.toLocaleString()}</span> {tc('shops')}
            </p>
          </div>

          {/* Shops Grid */}
          {transformedShops.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-2xl font-semibold mb-2">
                {tc('noShopsFound')}
              </h3>
              <p className="text-gray-500">
                {tc('tryAdjustingFilters')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {transformedShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} lang={lang} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8 md:mt-12">
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
