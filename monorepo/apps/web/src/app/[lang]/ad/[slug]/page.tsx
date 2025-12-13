import { Metadata } from 'next';
import { cache } from 'react';
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';
import { prisma } from '@thulobazaar/database';
import { notFound } from 'next/navigation';
import AdDetailClient from './AdDetailClient';
import PromoteSection from './PromoteSection';
import { Breadcrumb } from '@/components/ui';
import PromotionSuccessToast from './PromotionSuccessToast';
import AdBanner from '@/components/ads/AdBanner';
import {
  AdBadges,
  SpecificationsSection,
  LocationSection,
  SellerCard,
  SafetyTips,
} from './components';

interface AdDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams?: Promise<{ promoted?: string; txnId?: string }>;
}

const getAdBySlug = cache(async (slug: string) => {
  return prisma.ads.findFirst({
    where: {
      slug,
      deleted_at: null,
    },
    include: {
      ad_images: {
        orderBy: [{ is_primary: 'desc' }, { id: 'asc' }],
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
          slug: true,
          icon: true,
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
      },
      locations: {
        select: {
          id: true,
          name: true,
          type: true,
          locations: {
            select: {
              id: true,
              name: true,
              type: true,
              locations: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  locations: {
                    select: {
                      id: true,
                      name: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      users_ads_user_idTousers: {
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          business_phone: true,
          avatar: true,
          shop_slug: true,
          account_type: true,
          business_name: true,
          individual_verified: true,
          business_verification_status: true,
          created_at: true,
        },
      },
    },
  });
});

export async function generateMetadata({ params }: AdDetailPageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com';

  try {
    const ad = await getAdBySlug(slug);

    if (ad) {
      const imagePath = ad.ad_images?.[0]?.file_path;
      const imageUrl = imagePath
        ? imagePath.startsWith('http')
          ? imagePath
          : `${baseUrl}/${imagePath}`
        : `${baseUrl}/placeholder-ad.png`;

      const description = ad.description?.substring(0, 160) || `View details for ${ad.title}`;
      const priceText = ad.price ? `Rs. ${parseFloat(ad.price.toString()).toLocaleString()}` : 'Price on request';

      return {
        title: `${ad.title} | ${priceText} - Thulobazaar`,
        description,
        openGraph: {
          title: ad.title,
          description,
          url: `${baseUrl}/${lang}/ad/${slug}`,
          siteName: 'Thulobazaar',
          images: [{ url: imageUrl, width: 800, height: 600, alt: ad.title }],
          locale: lang === 'en' ? 'en_US' : 'ne_NP',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: ad.title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (error) {
    console.error('Error fetching ad metadata:', error);
  }

  const title = slug.replace(/-/g, ' ');
  return {
    title: `${title} - Thulobazaar`,
    description: `View details for ${title}. Contact seller, check price, and more.`,
  };
}

// Helper functions for building location and category strings
function buildFullLocation(locations: any): string {
  const locationParts: string[] = [];
  if (locations?.name) locationParts.push(locations.name);
  if (locations?.locations?.name) locationParts.push(locations.locations.name);
  if (locations?.locations?.locations?.name) locationParts.push(locations.locations.locations.name);
  if (locations?.locations?.locations?.locations?.name) locationParts.push(locations.locations.locations.locations.name);
  return locationParts.join(', ');
}

function buildFullCategory(categories: any): string {
  const categoryParts: string[] = [];
  if (categories?.categories?.name) categoryParts.push(categories.categories.name);
  if (categories?.name) categoryParts.push(categories.name);
  return categoryParts.join(' > ');
}

export default async function AdDetailPage({ params, searchParams }: AdDetailPageProps) {
  const { lang, slug } = await params;
  const search = (await searchParams) || {};

  const ad = await getAdBySlug(slug);
  if (!ad) {
    notFound();
  }

  // Increment view count (fire and forget)
  prisma.ads.update({
    where: { id: ad.id },
    data: { view_count: { increment: 1 } },
  }).catch(console.error);

  const fullLocation = buildFullLocation(ad.locations);
  const fullCategory = buildFullCategory(ad.categories);
  const images = ad.ad_images.map(img => `/${img.file_path}`);
  const customFields = ad.custom_fields as Record<string, any> | null;

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', path: `/${lang}` },
    { label: 'All Ads', path: `/${lang}/search` },
  ];
  if (ad.categories?.name && ad.categories?.slug) {
    breadcrumbItems.push({
      label: ad.categories.name,
      path: `/${lang}/search?category=${ad.categories.slug}`
    });
  }
  breadcrumbItems.push({
    label: ad.title.substring(0, 40) + (ad.title.length > 40 ? '...' : ''),
    path: ''
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <PromotionSuccessToast promoted={search.promoted === 'true'} txnId={search.txnId} />

      <div className="max-w-[1440px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[160px_1fr_350px_160px] gap-6">
          {/* Left Vertical Banner */}
          <div className="hidden xl:flex xl:flex-col xl:items-center self-start" style={{ marginTop: '200px' }}>
            <div className="sticky top-4">
              <AdBanner slot="adDetailLeft" size="skyscraper" />
            </div>
          </div>

          {/* Main Content */}
          <div>
            {/* Top Banners */}
            <div className="flex sm:hidden justify-center mb-6">
              <AdBanner slot="adDetailTopMobile" size="mobileBanner" />
            </div>
            <div className="hidden sm:flex justify-center mb-6">
              <AdBanner slot="adDetailTop" size="leaderboard" />
            </div>

            {/* Image Gallery */}
            <AdDetailClient images={images} lang={lang} />

            {/* Ad Details */}
            <div className="bg-white rounded-xl p-8 mb-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{ad.title}</h1>
                  <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
                    <span>{formatRelativeTime(ad.created_at || new Date())}</span>
                    <span>•</span>
                    <span>{ad.view_count || 0} views</span>
                  </div>
                </div>
              </div>

              <div className="text-4xl font-bold text-green-600 mb-4">
                {ad.price ? formatPrice(parseFloat(ad.price.toString())) : 'Price on request'}
              </div>

              <AdBadges
                condition={ad.condition}
                isNegotiable={customFields?.isNegotiable || false}
                fullCategory={fullCategory}
                isFeatured={ad.is_featured ?? false}
                featuredUntil={ad.featured_until}
                isUrgent={ad.is_urgent ?? false}
                urgentUntil={ad.urgent_until}
                isSticky={ad.is_sticky ?? false}
                stickyUntil={ad.sticky_until}
              />

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Description</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{ad.description}</p>
              </div>

              <SpecificationsSection customFields={customFields} />
              <LocationSection fullLocation={fullLocation} locationType={ad.locations?.type || null} />
            </div>

            {/* Bottom Banner */}
            <div className="flex justify-center mt-8">
              <AdBanner slot="adDetailBottom" size="largeRectangle" />
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <SellerCard
              seller={ad.users_ads_user_idTousers}
              adId={ad.id}
              userId={ad.user_id}
              adTitle={ad.title}
              adSlug={slug}
              lang={lang}
            />

            <PromoteSection ad={{
              id: ad.id,
              title: ad.title,
              user_id: ad.user_id || 0,
              is_featured: ad.is_featured ?? false,
              featured_until: ad.featured_until,
              is_urgent: ad.is_urgent ?? false,
              urgent_until: ad.urgent_until,
              is_sticky: ad.is_sticky ?? false,
              sticky_until: ad.sticky_until
            }} />

            <SafetyTips />
          </div>

          {/* Right Vertical Banner */}
          <div className="hidden xl:flex xl:flex-col xl:items-center self-start" style={{ marginTop: '200px' }}>
            <div className="sticky top-4">
              <AdBanner slot="adDetailRight" size="skyscraper" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
