import { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';
import { prisma } from '@thulobazaar/database';
import { maskVerificationColumns, publicVerification } from '@thulobazaar/types';
import { notFound } from 'next/navigation';
import AdDetailClient from './AdDetailClient';
import TrackViewContent from './TrackViewContent';
import PromoteSection from './PromoteSection';
import ExpandableDescription from './ExpandableDescription';
import ReportAdButton from './ReportAdButton';
import OwnerEditButton from './OwnerEditButton';
import { Breadcrumb } from '@/components/ui';
import PromotionSuccessToast from './PromotionSuccessToast';
import AdBanner from '@/components/ads/AdBanner';
import {
  AdBadges,
  SpecificationsSection,
  LocationSection,
  SellerCard,
  SafetyTips,
  RelatedAds,
  AdContactBar,
} from './components';
import { getImageUrl } from '@/lib/images/imageUrl';
import { AD_CARD_LOCATION_SELECT, resolveDistrictName } from '@/lib/location/district';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdJsonLd } from '@/components/seo/AdJsonLd';

interface AdDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams?: Promise<{ promoted?: string; txnId?: string }>;
}

// Get related ads from same category (excluding current ad)
const getRelatedAds = cache(async (categoryId: number | null, currentAdId: number, limit = 4) => {
  if (!categoryId) return [];

  return prisma.ads.findMany({
    where: {
      category_id: categoryId,
      id: { not: currentAdId },
      status: 'approved',
      deleted_at: null,
      users_ads_user_idTousers: {
        is_active: true,
      },
    },
    include: {
      ad_images: {
        where: { is_primary: true },
        take: 1,
        select: {
          file_path: true,
        },
      },
      categories: {
        select: {
          name: true,
          icon: true,
        },
      },
      locations: { select: AD_CARD_LOCATION_SELECT },
      users_ads_user_idTousers: {
        select: {
          full_name: true,
          business_name: true,
          account_type: true,
          business_verification_status: true,
          individual_verified: true,
          is_suspended: true,
          is_active: true,
        },
      },
    },
    orderBy: {
      published_at: { sort: 'desc', nulls: 'last' },
    },
    take: limit,
  });
});

const getAdBySlug = cache(async (slug: string) => {
  const ad = await prisma.ads.findFirst({
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
      ad_edit_history: {
        select: { created_at: true },
      },
      categories: {
        select: {
          id: true,
          name: true,
          name_ne: true,
          slug: true,
          icon: true,
          categories: {
            select: {
              id: true,
              name: true,
              name_ne: true,
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
          name_ne: true,
          slug: true,
          type: true,
          locations: {
            select: {
              id: true,
              name: true,
              name_ne: true,
              slug: true,
              type: true,
              locations: {
                select: {
                  id: true,
                  name: true,
                  name_ne: true,
                  slug: true,
                  type: true,
                  locations: {
                    select: {
                      id: true,
                      name: true,
                      name_ne: true,
                      slug: true,
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
          custom_shop_slug: true,
          account_type: true,
          business_name: true,
          individual_verified: true,
          business_verification_status: true,
          is_suspended: true,
          is_active: true,
          created_at: true,
        },
      },
    },
  });
  if (!ad?.users_ads_user_idTousers) return ad;
  // Suspended/deactivated sellers show no badge: SellerCard reads the raw
  // seller row, so mask it here rather than in every consumer.
  return {
    ...ad,
    users_ads_user_idTousers: maskVerificationColumns(ad.users_ads_user_idTousers),
  };
});

export async function generateMetadata({ params }: AdDetailPageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  try {
    const ad = await getAdBySlug(slug);

    if (ad) {
      const imagePath = ad.ad_images?.[0]?.file_path;
      const imageUrl = imagePath
        ? getImageUrl(imagePath, 'ads') || `${baseUrl}/placeholder-ad.png`
        : `${baseUrl}/placeholder-ad.png`;

      const t = await getTranslations({ locale: lang, namespace: 'metadata' });
      const description = ad.description?.substring(0, 160) || t('viewDetailsFor', { title: ad.title });
      const priceText = ad.price ? `Rs. ${parseFloat(ad.price.toString()).toLocaleString()}` : t('priceOnRequest');

      // SEO Fix: Quality-based noindex for thin content
      // Don't index ads with no images or very short descriptions (low quality signal)
      const hasImages = (ad.ad_images?.length || 0) > 0;
      const hasDescription = (ad.description?.trim() || '').length >= 20;
      const isLowQuality = !hasImages || !hasDescription;

      const metadata: Metadata = {
        title: `${ad.title} | ${priceText} - Thulo Bazaar`,
        description,
        openGraph: {
          title: ad.title,
          description,
          url: `${baseUrl}/${lang}/ad/${slug}`,
          siteName: 'Thulo Bazaar',
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
        alternates: {
          canonical: `${baseUrl}/${lang}/ad/${slug}`,
          languages: {
            en: `${baseUrl}/en/ad/${slug}`,
            ne: `${baseUrl}/ne/ad/${slug}`,
            'x-default': `${baseUrl}/en/ad/${slug}`,
          },
        },
        appLinks: {
          ios: {
            app_store_id: '6774762315',
            url: `${baseUrl}/${lang}/ad/${slug}`,
            app_name: 'Thulo Bazaar',
          },
          android: {
            package: 'com.thulobazaar.mobile',
            url: `${baseUrl}/${lang}/ad/${slug}`,
            app_name: 'Thulo Bazaar',
          },
          web: {
            url: `${baseUrl}/${lang}/ad/${slug}`,
            should_fallback: true,
          },
        },
      };

      if (isLowQuality) {
        metadata.robots = { index: false, follow: true };
      }

      return metadata;
    }
  } catch (error) {
    console.error('Error fetching ad metadata:', error);
  }

  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const title = slug.replace(/-/g, ' ');
  return {
    title: `${title} - Thulo Bazaar`,
    description: t('adFallbackDescription', { title }),
    robots: { index: false, follow: true }, // Don't index fallback/missing ads
  };
}

// Helper functions for building location and category strings
function buildFullLocation(locations: any, lang: string): string {
  const locationParts: string[] = [];
  const loc = (item: any) => lang === 'ne' && item?.name_ne ? item.name_ne : item?.name;
  if (locations?.name) locationParts.push(loc(locations));
  if (locations?.locations?.name) locationParts.push(loc(locations.locations));
  if (locations?.locations?.locations?.name) locationParts.push(loc(locations.locations.locations));
  if (locations?.locations?.locations?.locations?.name) locationParts.push(loc(locations.locations.locations.locations));
  return locationParts.join(', ');
}

function buildFullCategory(categories: any, lang: string): string {
  const categoryParts: string[] = [];
  const loc = (item: any) => lang === 'ne' && item?.name_ne ? item.name_ne : item?.name;
  if (categories?.categories?.name) categoryParts.push(loc(categories.categories));
  if (categories?.name) categoryParts.push(loc(categories));
  return categoryParts.join(' > ');
}

export default async function AdDetailPage({ params, searchParams }: AdDetailPageProps) {
  const { lang, slug } = await params;
  setRequestLocale(lang);
  const t = await getTranslations('ads');
  const tc = await getTranslations('common');
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

  // Get favorites count for this ad
  const favoritesCount = await prisma.user_favorites.count({
    where: { ad_id: ad.id },
  });

  // Fetch related ads from same category
  const relatedAdsRaw = await getRelatedAds(ad.category_id, ad.id);
  const relatedAds = relatedAdsRaw.map((relAd: any) => ({
    id: relAd.id,
    title: relAd.title,
    price: relAd.price ? parseFloat(relAd.price.toString()) : 0,
    primaryImage: relAd.ad_images?.[0]?.file_path || null,
    categoryName: relAd.categories?.name || null,
    categoryIcon: relAd.categories?.icon || null,
    districtName: resolveDistrictName(relAd.locations),
    publishedAt: relAd.published_at || relAd.reviewed_at || relAd.created_at || new Date(),
    sellerName: relAd.users_ads_user_idTousers?.business_name || relAd.users_ads_user_idTousers?.full_name || tc('unknownSeller'),
    isFeatured: relAd.is_featured || false,
    isUrgent: relAd.is_urgent || false,
    isSticky: relAd.is_sticky || false,
    condition: relAd.condition || null,
    slug: relAd.slug,
    accountType: relAd.users_ads_user_idTousers?.account_type || null,
    // Suspended/deactivated sellers show no badge (publicVerification)
    ...publicVerification(relAd.users_ads_user_idTousers),
  }));

  const fullLocation = buildFullLocation(ad.locations, lang);
  const fullCategory = buildFullCategory(ad.categories, lang);

  // Clickable category > subcategory links (each goes to that category's listing)
  const locName = (item: { name: string; name_ne?: string | null } | null | undefined) =>
    lang === 'ne' && item?.name_ne ? item.name_ne : item?.name;
  const categoryLinks: Array<{ name: string; href: string }> = [];
  if (ad.categories?.categories?.slug) {
    categoryLinks.push({
      name: locName(ad.categories.categories) || '',
      href: `/${lang}/ads/${ad.categories.categories.slug}`,
    });
  }
  if (ad.categories?.slug) {
    categoryLinks.push({
      name: locName(ad.categories) || '',
      href: `/${lang}/ads/${ad.categories.slug}`,
    });
  }

  // Clickable location chain, leaf → root (each level goes to its own listing)
  const locationLinks: Array<{ name: string; href: string }> = [];
  let locationNode: any = ad.locations;
  while (locationNode) {
    if (locationNode.slug) {
      locationLinks.push({
        name: locName(locationNode) || '',
        href: `/${lang}/ads/${locationNode.slug}`,
      });
    }
    locationNode = locationNode.locations;
  }
  const images = ad.ad_images.map((img: any) =>
    getImageUrl(img.file_path, 'ads') || ''
  );
  const customFields = ad.custom_fields as Record<string, any> | null;

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: tc('home'), path: `/${lang}` },
    { label: t('allAds'), path: `/${lang}/ads` },
  ];
  if (ad.categories?.name && ad.categories?.slug) {
    breadcrumbItems.push({
      label: lang === 'ne' && ad.categories.name_ne ? ad.categories.name_ne : ad.categories.name,
      path: `/${lang}/ads/${ad.categories.slug}`
    });
  }
  breadcrumbItems.push({
    label: ad.title.substring(0, 40) + (ad.title.length > 40 ? '...' : ''),
    path: ''
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const sellerName = ad.users_ads_user_idTousers?.business_name || ad.users_ads_user_idTousers?.full_name || 'Seller';
  const sellerType = ad.users_ads_user_idTousers?.account_type === 'business' ? 'Organization' as const : 'Person' as const;
  // Must match the shop page's canonical slug, not just shop_slug.
  const sellerSlug =
    ad.users_ads_user_idTousers?.custom_shop_slug || ad.users_ads_user_idTousers?.shop_slug;
  const sellerShopUrl = sellerSlug ? `${baseUrl}/${lang}/shop/${sellerSlug}` : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdJsonLd
        name={ad.title}
        description={ad.description || ''}
        images={images.filter(Boolean)}
        price={ad.price ? parseFloat(ad.price.toString()) : 0}
        condition={ad.condition}
        url={`${baseUrl}/${lang}/ad/${slug}`}
        sellerName={sellerName}
        sellerType={sellerType}
        sellerUrl={sellerShopUrl}
        category={fullCategory || undefined}
        location={fullLocation || undefined}
        adId={ad.id}
        publishedAt={ad.published_at || ad.reviewed_at || ad.created_at}
        expiresAt={ad.expires_at}
        breadcrumbItems={breadcrumbItems.filter(b => b.path).map(b => ({
          name: b.label,
          url: `${baseUrl}${b.path}`,
        }))}
      />
      <Breadcrumb items={breadcrumbItems} />
      <PromotionSuccessToast promoted={search.promoted === 'true'} txnId={search.txnId} />

      <div className="max-w-[1440px] mx-auto px-4 py-4 md:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[160px_1fr_350px_160px] gap-4 md:gap-6">
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

            {/* Meta Pixel ViewContent */}
            <TrackViewContent
              id={ad.id}
              title={ad.title}
              price={ad.price ? parseFloat(ad.price.toString()) : null}
              category={ad.categories?.name ?? null}
            />

            {/* Image Gallery */}
            <AdDetailClient images={images} lang={lang} adTitle={ad.title} />

            {/* Ad Details */}
            <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 mb-4 md:mb-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">{ad.title}</h1>
                  <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                    {/* Show when the ad first went live, not when submitted */}
                    <span>{formatRelativeTime(ad.published_at || ad.reviewed_at || ad.created_at || new Date())}</span>
                    <span>•</span>
                    <span>{ad.view_count || 0} {t('views')}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 mb-4">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
                  {ad.price ? formatPrice(parseFloat(ad.price.toString())) : t('priceOnRequest')}
                </div>
                <OwnerEditButton
                  adId={ad.id}
                  sellerId={ad.user_id || 0}
                  adTitle={ad.title}
                  editCount={ad.ad_edit_history.length}
                />
              </div>

              <AdBadges
                lastEditedAt={
                  ad.ad_edit_history.length > 0
                    ? new Date(Math.max(...ad.ad_edit_history.map((e) => new Date(e.created_at || 0).getTime())))
                    : null
                }
                condition={ad.condition}
                isNegotiable={customFields?.isNegotiable || false}
                isCodAvailable={customFields?.isCodAvailable || false}
                categoryLinks={categoryLinks}
                fullCategory={fullCategory}
                isFeatured={ad.is_featured ?? false}
                featuredUntil={ad.featured_until}
                isUrgent={ad.is_urgent ?? false}
                urgentUntil={ad.urgent_until}
                isSticky={ad.is_sticky ?? false}
                stickyUntil={ad.sticky_until}
                categorySlug={ad.categories?.slug ?? null}
                parentCategorySlug={ad.categories?.categories?.slug ?? null}
              />

              <div className="mb-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{t('description')}</h2>
                  <ReportAdButton
                    adId={ad.id}
                    adTitle={ad.title}
                    lang={lang}
                    sellerId={ad.user_id}
                  />
                </div>
                <ExpandableDescription
                  text={ad.description ?? ''}
                  moreLabel={t('viewMore')}
                  lessLabel={t('viewLess')}
                />
              </div>

              <SpecificationsSection
                customFields={customFields}
                lang={lang}
                categoryName={ad.categories?.name ?? null}
                parentCategoryName={ad.categories?.categories?.name ?? null}
              />
              <LocationSection
                fullLocation={fullLocation}
                locationLinks={locationLinks}
                locationType={ad.locations?.type || null}
              />
            </div>

            {/* Safety + Seller Card + Promote - Mobile only, shown after ad details */}
            <div className="lg:hidden mt-4 space-y-4">
              <SafetyTips />
              <SellerCard
                seller={ad.users_ads_user_idTousers}
                adId={ad.id}
                userId={ad.user_id}
                adTitle={ad.title}
                adSlug={slug}
                lang={lang}
                favoritesCount={favoritesCount}
                whatsappNumber={(customFields?.whatsapp_number as string) || null}
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
            </div>

            {/* Related Ads — deferred for better LCP */}
            {relatedAds.length > 0 && (
              <Suspense fallback={null}>
                <div className="mt-8">
                  <RelatedAds ads={relatedAds} lang={lang} />
                </div>
              </Suspense>
            )}

            {/* Bottom Banner */}
            <div className="flex justify-center mt-8">
              <AdBanner slot="adDetailBottom" size="largeRectangle" />
            </div>
          </div>

          {/* Sidebar - Desktop only for SellerCard & Promote (shown inline on mobile) */}
          <div>
            <div className="hidden lg:block">
              <SellerCard
                seller={ad.users_ads_user_idTousers}
                adId={ad.id}
                userId={ad.user_id}
                adTitle={ad.title}
                adSlug={slug}
                lang={lang}
                favoritesCount={favoritesCount}
                whatsappNumber={(customFields?.whatsapp_number as string) || null}
              />
            </div>

            <div className="hidden lg:block">
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
            </div>

            <div className="hidden lg:block">
              <SafetyTips />
            </div>
          </div>

          {/* Right Vertical Banner */}
          <div className="hidden xl:flex xl:flex-col xl:items-center self-start" style={{ marginTop: '200px' }}>
            <div className="sticky top-4">
              <AdBanner slot="adDetailRight" size="skyscraper" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Contact Action Bar */}
      <AdContactBar
        sellerId={ad.user_id || 0}
        sellerPhone={ad.users_ads_user_idTousers?.phone || null}
        sellerBusinessPhone={ad.users_ads_user_idTousers?.business_phone || null}
        adId={ad.id}
        adTitle={ad.title}
        adSlug={slug}
        lang={lang}
      />
    </div>
  );
}
