import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@thulobazaar/database';
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';
import AllAdsFilters from './AllAdsFilters';
import AdCard from '@/components/AdCard';

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
  const categorySlug = filters.category || undefined; // Keep as slug
  const locationId = filters.location ? parseInt(filters.location) : undefined;
  const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : undefined;
  const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : undefined;
  const sortBy = filters.sortBy || 'newest';
  const adsPerPage = 24;
  const offset = (page - 1) * adsPerPage;

  // Convert category slug to ID for database queries
  let categoryId: number | undefined;
  if (categorySlug) {
    const category = await prisma.categories.findFirst({
      where: { slug: categorySlug },
      select: { id: true },
    });
    categoryId = category?.id;
  }

  // Build order by clause
  let orderBy: any = { created_at: 'desc' }; // Default: newest first
  if (sortBy === 'oldest') orderBy = { created_at: 'asc' };
  if (sortBy === 'price_asc') orderBy = { price: 'asc' };
  if (sortBy === 'price_desc') orderBy = { price: 'desc' };

  // Build where clause with filters
  const where: any = {
    status: 'approved',
    deleted_at: null,
    ad_images: {
      some: {}, // Only show ads with at least one image
    },
  };

  // Category filter (supports hierarchy - parent and subcategories)
  if (categoryId) {
    const selectedCategory = await prisma.categories.findUnique({
      where: { id: categoryId },
      select: { id: true, parent_id: true },
    });

    if (selectedCategory) {
      if (selectedCategory.parent_id === null) {
        // This is a parent category, get all its subcategories
        const subcategories = await prisma.categories.findMany({
          where: { parent_id: categoryId },
          select: { id: true },
        });

        const allCategoryIds = [categoryId, ...subcategories.map((c) => c.id)];
        where.category_id = { in: allCategoryIds };
      } else {
        // This is a subcategory - exact match
        where.category_id = categoryId;
      }
    }
  }

  // Location filter (supports hierarchy)
  if (locationId) {
    const selectedLocation = await prisma.locations.findUnique({
      where: { id: locationId },
      select: { id: true, type: true },
    });

    if (selectedLocation) {
      if (selectedLocation.type === 'province') {
        // Get all districts in this province
        const districts = await prisma.locations.findMany({
          where: { parent_id: locationId, type: 'district' },
          select: { id: true },
        });
        const districtIds = districts.map((d) => d.id);

        // Get all municipalities in these districts
        const municipalities = await prisma.locations.findMany({
          where: { parent_id: { in: districtIds }, type: 'municipality' },
          select: { id: true },
        });

        // Combine all location IDs
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

  // Fetch all parent categories with their subcategories
  const allCategories = await prisma.categories.findMany({
    where: { parent_id: null },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      other_categories: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
    },
  });

  // Sort subcategories alphabetically in JavaScript (Prisma doesn't allow orderBy in nested select)
  allCategories.forEach((category) => {
    if (category.other_categories && category.other_categories.length > 0) {
      category.other_categories.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  // Define custom order for categories
  const categoryOrder = ['Mobile', 'Electronics', 'Vehicles', 'Home & Living', 'Property'];

  // Sort categories according to the custom order
  const categories = allCategories.sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.name);
    const bIndex = categoryOrder.indexOf(b.name);

    // If both are in the order array, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only a is in the order array, it comes first
    if (aIndex !== -1) return -1;
    // If only b is in the order array, it comes first
    if (bIndex !== -1) return 1;
    // If neither is in the order array, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  // Fetch ads with images and hierarchical data
  const [ads, totalAds] = await Promise.all([
    prisma.ads.findMany({
      where,
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
      orderBy,
      take: adsPerPage,
      skip: offset,
    }),
    prisma.ads.count({ where }),
  ]);

  const totalPages = Math.ceil(totalAds / adsPerPage);


  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Breadcrumb */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <Link href={`/${lang}`} style={{ color: '#667eea', textDecoration: 'none' }}>
              Home
            </Link>
            <span>/</span>
            <span>All Ads</span>
          </div>
        </div>
      </div>

      {/* Container with sidebar layout */}
      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Left Sidebar - Fixed width */}
        <aside style={{
          width: '280px',
          minWidth: '280px',
          background: 'white',
          borderRight: '1px solid #e5e7eb',
          minHeight: 'calc(100vh - 120px)',
          position: 'sticky',
          top: '0',
          alignSelf: 'flex-start',
          overflowY: 'auto',
          maxHeight: '100vh',
        }} className="hidden lg:block">
          <AllAdsFilters
            lang={lang}
            categories={categories}
            selectedCategory={categorySlug}
            selectedLocation={locationId}
            minPrice={minPrice?.toString() || ''}
            maxPrice={maxPrice?.toString() || ''}
            sortBy={sortBy}
          />
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem 1rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
              All Ads
            </h1>
            <p style={{ color: '#6b7280' }}>
              Found <span style={{ fontWeight: '600', color: '#1f2937' }}>{totalAds.toLocaleString()}</span> ads
            </p>
          </div>

          {/* Ads Grid */}
          {ads.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 0',
              background: 'white',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                No ads found
              </h3>
              <p style={{ color: '#6b7280' }}>
                Check back later for new listings
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
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
          )}

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '3rem'
          }}>
            <button style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer'
            }}>
              Previous
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: '#667eea',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              1
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer'
            }}>
              2
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer'
            }}>
              3
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer'
            }}>
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
