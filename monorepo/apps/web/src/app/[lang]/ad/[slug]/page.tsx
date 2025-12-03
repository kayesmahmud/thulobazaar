import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatDateTime, formatRelativeTime } from '@thulobazaar/utils';
import { prisma } from '@thulobazaar/database';
import { notFound } from 'next/navigation';
import AdDetailClient from './AdDetailClient';
import PromoteSection from './PromoteSection';
import Breadcrumb from '@/components/Breadcrumb';
import PromotionSuccessToast from './PromotionSuccessToast';
import SendMessageButton from '@/components/messages/SendMessageButton';
import { generateProductStructuredData, generateBreadcrumbStructuredData } from '@/lib/structuredData';
import AdBanner from '@/components/ads/AdBanner';

interface AdDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({ params }: AdDetailPageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const baseUrl = 'https://thulobazaar.com'; // TODO: Use env variable

  try {
    const ad = await prisma.ads.findFirst({
      where: { slug, status: 'approved', deleted_at: null },
      select: {
        title: true,
        description: true,
        price: true,
        ad_images: {
          where: { is_primary: true },
          take: 1,
          select: { file_path: true },
        },
      },
    });

    if (ad) {
      const imageUrl = ad.ad_images && ad.ad_images.length > 0
        ? ad.ad_images[0]?.file_path || `${baseUrl}/placeholder-ad.png`
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
          images: [
            {
              url: imageUrl,
              width: 800,
              height: 600,
              alt: ad.title,
            },
          ],
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

export default async function AdDetailPage({ params, searchParams }: AdDetailPageProps & { searchParams?: Promise<{ promoted?: string; txnId?: string }> }) {
  const { lang, slug } = await params;
  const search = searchParams ? await searchParams : {};

  // Fetch ad data with Prisma
  const ad = await prisma.ads.findFirst({
    where: {
      slug,
      status: 'approved',
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
          avatar: true,
          seller_slug: true,
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

  if (!ad) {
    notFound();
  }

  // Increment view count (fire and forget)
  prisma.ads.update({
    where: { id: ad.id },
    data: { view_count: { increment: 1 } },
  }).catch(console.error);

  // Format condition for display
  const conditionMap: Record<string, string> = {
    'new': 'Brand New',
    'used': 'Used',
    'refurbished': 'Refurbished',
  };

  const condition = ad.condition
    ? conditionMap[ad.condition] || ad.condition
    : 'Not specified';

  // Build full location string (Province › District › Municipality)
  const locationParts = [];
  if (ad.locations?.locations?.locations?.name) locationParts.push(ad.locations.locations.locations.name);
  if (ad.locations?.locations?.name) locationParts.push(ad.locations.locations.name);
  if (ad.locations?.name) locationParts.push(ad.locations.name);
  const fullLocation = locationParts.join(' › ');

  // Build full category string (Parent › Child)
  const categoryParts = [];
  if (ad.categories?.categories?.name) categoryParts.push(ad.categories.categories.name);
  if (ad.categories?.name) categoryParts.push(ad.categories.name);
  const fullCategory = categoryParts.join(' › ');

  // Prepare images for client component (array of full URL strings)
  // Images are served from the public folder at /uploads/ads/...
  const images = ad.ad_images.map(img =>
    `/${img.file_path}`
  );

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
    path: '' // Current page
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Toast notification for successful promotion */}
      <PromotionSuccessToast promoted={search.promoted === 'true'} txnId={search.txnId} />

      <div className="max-w-[1440px] mx-auto px-4 py-8">
        {/* 4-column grid: Left Banner | Main Content | Sidebar | Right Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[160px_1fr_350px_160px] gap-6">
          {/* Left Vertical Banner (160x600) - Hidden on smaller screens, positioned 200px down */}
          <div className="hidden xl:flex xl:flex-col xl:items-center self-start" style={{ marginTop: '200px' }}>
            <div className="sticky top-4">
              <AdBanner slot="adDetailLeft" size="skyscraper" />
            </div>
          </div>

          {/* Main Content */}
          <div>
            {/* Horizontal Banner - Above Images */}
            {/* Mobile: 320x100, Desktop: 728x90 */}
            <div className="flex sm:hidden justify-center mb-6">
              <AdBanner slot="adDetailTopMobile" size="mobileBanner" />
            </div>
            <div className="hidden sm:flex justify-center mb-6">
              <AdBanner slot="adDetailTop" size="leaderboard" />
            </div>

            {/* Image Gallery - Client component for interactivity */}
            <AdDetailClient images={images} lang={lang} />

            {/* Ad Details */}
            <div className="bg-white rounded-xl p-8 mb-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {ad.title}
                  </h1>
                  <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
                    {fullLocation && <span>📍 {fullLocation}</span>}
                    {fullLocation && <span>•</span>}
                    <span>🕒 {formatRelativeTime(ad.created_at || new Date())}</span>
                    <span>•</span>
                    <span>👁️ {ad.view_count || 0} views</span>
                  </div>
                </div>
              </div>

              <div className="text-4xl font-bold text-green-600 mb-4">
                {ad.price ? formatPrice(parseFloat(ad.price.toString())) : 'Price on request'}
              </div>

              <div className="flex gap-2 mb-8 flex-wrap">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm">
                  {condition}
                </span>
                {(ad.custom_fields as any)?.isNegotiable && (
                  <span className="bg-amber-50 text-amber-900 px-3 py-1 rounded text-sm font-semibold">
                    💰 Price is negotiable
                  </span>
                )}
                {fullCategory && (
                  <span className="bg-green-50 text-green-800 px-3 py-1 rounded text-sm">
                    {fullCategory}
                  </span>
                )}
                {ad.is_featured && ad.featured_until && new Date(ad.featured_until) > new Date() && (
                  <span style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(251, 191, 36, 0.3)'
                  }}>
                    ⭐ Featured
                  </span>
                )}
                {ad.is_urgent && ad.urgent_until && new Date(ad.urgent_until) > new Date() && (
                  <span style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}>
                    🔥 Urgent Sale
                  </span>
                )}
                {ad.is_sticky && ad.sticky_until && new Date(ad.sticky_until) > new Date() && (
                  <span style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}>
                    📌 Promoted
                  </span>
                )}
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Description
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {ad.description}
                </p>
              </div>

              {/* Specifications Section */}
              {ad.custom_fields && Object.keys(ad.custom_fields as object).length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Specifications
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const entries = Object.entries(ad.custom_fields as Record<string, any>)
                        .filter(([key]) => key !== 'isNegotiable' && key !== 'amenities');

                      // Check if this is a property-related ad (has totalArea field)
                      const hasAreaFields = entries.some(([key]) => key === 'totalArea' || key === 'areaUnit');

                      if (hasAreaFields) {
                        // Sort to put totalArea first, then areaUnit, then everything else
                        entries.sort((a, b) => {
                          const [keyA] = a;
                          const [keyB] = b;

                          if (keyA === 'totalArea') return -1;
                          if (keyB === 'totalArea') return 1;
                          if (keyA === 'areaUnit') return -1;
                          if (keyB === 'areaUnit') return 1;

                          return 0;
                        });
                      }

                      return entries.map(([key, value]) => (
                        <div
                          key={key}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="text-xs text-gray-600 mb-1 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                          </div>
                          <div className="text-base font-medium text-gray-800">
                            {String(value)}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Amenities Section - Display at bottom with checkmarks */}
                  {(ad.custom_fields as Record<string, any>)?.amenities && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(() => {
                          const amenitiesValue = (ad.custom_fields as Record<string, any>).amenities;
                          let amenitiesList: string[] = [];

                          // Handle if amenities is a string (comma-separated)
                          if (typeof amenitiesValue === 'string') {
                            amenitiesList = amenitiesValue.split(',').map(a => a.trim()).filter(Boolean);
                          }
                          // Handle if amenities is an array
                          else if (Array.isArray(amenitiesValue)) {
                            amenitiesList = amenitiesValue;
                          }

                          return amenitiesList.map((amenity, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 text-gray-700"
                            >
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm font-bold flex-shrink-0">
                                ✓
                              </span>
                              <span>{amenity}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Location Section */}
              {fullLocation && (
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#1f2937'
                  }}>
                    Location
                  </h2>
                  <div style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>📍</span>
                    <div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {fullLocation.replace(/› /g, ', ')}
                      </div>
                      {ad.locations?.type && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          textTransform: 'capitalize'
                        }}>
                          {ad.locations.type.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Banner (336x280) - Large Rectangle - After Location */}
            <div className="flex justify-center mt-8">
              <AdBanner slot="adDetailBottom" size="largeRectangle" />
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Seller Card */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#1f2937'
              }}>
                Seller Information
              </h3>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: ad.users_ads_user_idTousers?.avatar ? `url(/uploads/avatars/${ad.users_ads_user_idTousers.avatar})` : '#667eea',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  {!ad.users_ads_user_idTousers?.avatar && (ad.users_ads_user_idTousers?.full_name?.charAt(0) || 'U')}
                </div>
                <div style={{ flex: 1 }}>
                  {/* Seller/Shop Name with Badge - Clickable */}
                  {ad.users_ads_user_idTousers?.shop_slug ? (
                    <Link
                      href={`/${lang}/shop/${ad.users_ads_user_idTousers.shop_slug}`}
                      style={{
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none'
                      }}
                    >
                      {ad.users_ads_user_idTousers?.business_verification_status === 'approved' && ad.users_ads_user_idTousers?.business_name
                        ? ad.users_ads_user_idTousers.business_name
                        : ad.users_ads_user_idTousers?.full_name || 'Seller'}
                      {/* Golden Badge for Verified Business */}
                      {ad.users_ads_user_idTousers?.account_type === 'business' && ad.users_ads_user_idTousers?.business_verification_status === 'approved' && (
                        <Image
                          src="/golden-badge.png"
                          alt="Verified Business"
                          title="Verified Business"
                          width={20}
                          height={20}
                        />
                      )}
                      {/* Blue Badge for Verified Individual */}
                      {ad.users_ads_user_idTousers?.account_type === 'individual' &&
                       (ad.users_ads_user_idTousers?.individual_verified || ad.users_ads_user_idTousers?.business_verification_status === 'verified') && (
                        <Image
                          src="/blue-badge.png"
                          alt="Verified Individual Seller"
                          title="Verified Individual Seller"
                          width={20}
                          height={20}
                        />
                      )}
                    </Link>
                  ) : (
                    <div style={{
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {ad.users_ads_user_idTousers?.full_name || 'Seller'}
                    </div>
                  )}
                  {/* Verification Status Text - only for verified sellers */}
                  {ad.users_ads_user_idTousers?.account_type === 'business' && ad.users_ads_user_idTousers?.business_verification_status === 'approved' && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Verified Business Account
                    </div>
                  )}
                  {ad.users_ads_user_idTousers?.account_type === 'individual' &&
                   (ad.users_ads_user_idTousers?.individual_verified || ad.users_ads_user_idTousers?.business_verification_status === 'verified') && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Verified Individual Seller
                    </div>
                  )}
                </div>
              </div>

              {ad.users_ads_user_idTousers?.phone && (
                <a
                  href={`tel:${ad.users_ads_user_idTousers.phone}`}
                  className="block w-full px-3 py-3 bg-green-600 text-white rounded-lg font-semibold mb-3 text-center no-underline transition-all duration-200 hover:bg-green-700 hover:-translate-y-0.5 active:translate-y-0"
                >
                  📞 {ad.users_ads_user_idTousers.phone}
                </a>
              )}

              {ad.user_id && (
                <SendMessageButton
                  sellerId={ad.user_id}
                  adId={ad.id}
                  adTitle={ad.title}
                  lang={lang}
                />
              )}

              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center'
              }}>
                <div style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}>
                  🚩 Report this ad
                </div>
              </div>
            </div>

            {/* Promote Section - Only visible to ad owner */}
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

            {/* Safety Tips */}
            <div style={{
              background: '#fff7ed',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #fed7aa'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#9a3412'
              }}>
                ⚠️ Safety Tips
              </h4>
              <ul style={{
                fontSize: '0.875rem',
                color: '#78350f',
                lineHeight: '1.7',
                paddingLeft: '1.25rem'
              }}>
                <li>Meet in a safe public place</li>
                <li>Check the item before payment</li>
                <li>Never pay in advance</li>
                <li>Beware of unrealistic offers</li>
              </ul>
            </div>
          </div>

          {/* Right Vertical Banner (160x600) - Hidden on smaller screens, positioned 200px down */}
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
