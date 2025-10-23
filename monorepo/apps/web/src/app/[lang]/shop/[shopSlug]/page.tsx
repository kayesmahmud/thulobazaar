import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@thulobazaar/database';
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';
import Link from 'next/link';
import ShopProfileClient from './ShopProfileClient';
import ShopSidebar from './ShopSidebar';
import AdCard from '@/components/AdCard';

interface ShopProfilePageProps {
  params: Promise<{ lang: string; shopSlug: string }>;
}

export async function generateMetadata({ params }: ShopProfilePageProps): Promise<Metadata> {
  const { shopSlug } = await params;

  try {
    const shop = await prisma.users.findFirst({
      where: {
        shop_slug: shopSlug,
      },
      select: {
        full_name: true,
        business_name: true,
        business_description: true,
        bio: true,
      },
    });

    if (shop) {
      const displayName = shop.business_name || shop.full_name;
      const description = shop.business_description || shop.bio;

      return {
        title: `${displayName} - Shop | Thulobazaar`,
        description: description?.substring(0, 160) || `Shop profile for ${displayName}. Browse products and contact the seller.`,
      };
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

  // Fetch shop details - all users use shop_slug
  const shop = await prisma.users.findFirst({
    where: {
      shop_slug: shopSlug,
    },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      avatar: true,
      cover_photo: true,
      bio: true,
      account_type: true,
      shop_slug: true,
      seller_slug: true,
      business_name: true,
      business_category: true,
      business_description: true,
      business_website: true,
      business_phone: true,
      business_address: true,
      google_maps_link: true,
      business_verification_status: true,
      individual_verified: true,
      created_at: true,
      locations: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

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
    total_ads: ads.length,
    total_views: ads.reduce((sum, ad) => sum + (ad.view_count || 0), 0),
    featured_ads: ads.filter(ad => ad.is_featured).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-desktop mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Link href={`/${lang}`} className="text-primary hover:underline">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900 truncate">{shop.business_name || shop.full_name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-desktop mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Cover Photo & Avatar - Rendered by Client Component */}
        <ShopProfileClient
          shopId={shop.id}
          shopSlug={shopSlug}
          lang={lang}
          initialAvatar={shop.avatar}
          initialCover={shop.cover_photo}
          shopName={shop.business_name || shop.full_name}
          businessVerificationStatus={shop.business_verification_status}
          individualVerified={shop.individual_verified}
          accountType={shop.account_type}
          stats={{
            total_ads: stats.total_ads,
            total_views: stats.total_views,
            member_since: new Date(shop.created_at || '').toLocaleDateString('en-US', {
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
            lang={lang}
            isOwner={false} // Will be determined on client side
            bio={shop.bio}
            businessDescription={shop.business_description}
            businessPhone={shop.business_phone}
            phone={shop.phone}
            businessWebsite={shop.business_website}
            googleMapsLink={shop.google_maps_link}
            businessAddress={shop.business_address}
            locationName={shop.locations?.name || null}
            accountType={shop.account_type}
            businessVerificationStatus={shop.business_verification_status}
            individualVerified={shop.individual_verified}
          />

          {/* Right Side - Ads Grid */}
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6">
              Ads from {shop.business_name || shop.full_name} ({stats.total_ads})
            </h2>

            {ads.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 mb-6">No active ads at the moment</p>
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
                      price: parseFloat(ad.price.toString()),
                      primaryImage: ad.ad_images && ad.ad_images.length > 0
                        ? ad.ad_images[0].file_path
                        : null,
                      categoryName: ad.categories?.name || null,
                      categoryIcon: ad.categories?.icon || null,
                      createdAt: ad.created_at || new Date(),
                      sellerName: shop.business_name || shop.full_name,
                      isFeatured: ad.is_featured || false,
                      isUrgent: ad.is_urgent || false,
                      condition: ad.condition || null,
                      slug: ad.slug || undefined,
                      accountType: shop.account_type || undefined,
                      businessVerificationStatus: shop.business_verification_status || undefined,
                      individualVerified: shop.individual_verified || false,
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
