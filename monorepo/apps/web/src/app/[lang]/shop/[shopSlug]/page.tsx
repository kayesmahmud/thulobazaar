import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@thulobazaar/database';
import Link from 'next/link';
import ShopProfileClient from './ShopProfileClient';
import ShopSidebar from './ShopSidebar';
import ShopEmptyState from './ShopEmptyState';
import AdCard from '@/components/AdCard';
import { getShopProfile, buildShopMetadata } from '@/lib/shops';

interface ShopProfilePageProps {
  params: Promise<{ lang: string; shopSlug: string }>;
}

export async function generateMetadata({ params }: ShopProfilePageProps): Promise<Metadata> {
  const { shopSlug } = await params;

  try {
    const shop = await getShopProfile(shopSlug);
    if (shop) {
      return buildShopMetadata(shop);
    }
  } catch (error) {
    console.error('Error fetching shop metadata:', error);
  }

  return {
    title: 'Shop Profile - Thulobazaar',
    description: 'Browse products from shops on Thulobazaar.',
  };
}

export default async function ShopProfilePage({ params }: ShopProfilePageProps) {
  const { lang, shopSlug } = await params;

  const shop = await getShopProfile(shopSlug);
  if (!shop) {
    notFound();
  }

  // Fetch all approved ads from this shop
  const ads = await prisma.ads.findMany({
    where: {
      user_id: shop.id,
      status: 'approved',
      deleted_at: null,
    },
    include: {
      ad_images: {
        where: { is_primary: true },
        take: 1,
        select: {
          id: true,
          filename: true,
          file_path: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
    },
    orderBy: [
      { is_sticky: 'desc' },
      { is_bumped: 'desc' },
      { created_at: 'desc' },
    ],
  });

  // Calculate stats
  const stats = {
    totalAds: ads.length,
    totalViews: ads.reduce((sum, ad) => sum + (ad.view_count || 0), 0),
    featuredAds: ads.filter(ad => ad.is_featured).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb - Hidden visually but kept for SEO */}
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href={`/${lang}`} itemProp="item">
              <span itemProp="name">Home</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span itemProp="name">{shop.businessName || shop.fullName}</span>
            <meta itemProp="position" content="2" />
          </li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Cover Photo & Avatar - Rendered by Client Component */}
        <ShopProfileClient
          shopId={shop.id}
          shopSlug={shopSlug}
          lang={lang}
          initialAvatar={shop.avatar}
          initialCover={shop.coverPhoto}
          shopName={shop.businessName || shop.fullName}
          businessVerificationStatus={shop.businessVerificationStatus}
          individualVerified={shop.individualVerified}
          accountType={shop.accountType}
          stats={{
            total_ads: stats.totalAds,
            total_views: stats.totalViews,
            member_since: new Date(shop.createdAt || '').toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            }),
          }}
        />

        {/* Main Content: Sidebar + Ads Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[350px_1fr] gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - About, Contact & Location */}
          <ShopSidebar
            shopId={shop.id}
            shopSlug={shopSlug}
            bio={shop.bio}
            businessDescription={shop.businessDescription}
            businessPhone={shop.businessPhone}
            phone={shop.phone}
            businessWebsite={shop.businessWebsite}
            googleMapsLink={shop.googleMapsLink}
            locationName={shop.location?.name ?? ''}
            locationSlug={shop.location?.slug ?? ''}
            locationFullPath={shop.locationFullPath ?? ''}
          />

          {/* Right Side - Ads Grid */}
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6">
              Ads from {shop.businessName || shop.fullName} ({stats.totalAds})
            </h2>

            {ads.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 mb-6">No active ads at the moment</p>
                {/* POST FREE AD button - ShopEmptyState handles owner check on client side */}
                <ShopEmptyState shopId={shop.id} lang={lang} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      sellerName: shop.businessName || shop.fullName,
                      isFeatured: ad.is_featured || false,
                      isUrgent: ad.is_urgent || false,
                      condition: ad.condition || null,
                      slug: ad.slug || undefined,
                      accountType: shop.accountType || undefined,
                      businessVerificationStatus: shop.businessVerificationStatus || undefined,
                      individualVerified: shop.individualVerified || false,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
