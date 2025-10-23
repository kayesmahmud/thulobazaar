import { Metadata } from 'next';
import Link from 'next/link';
import { formatPrice, formatDateTime, formatRelativeTime } from '@thulobazaar/utils';
import { prisma } from '@thulobazaar/database';
import { notFound } from 'next/navigation';
import AdDetailClient from './AdDetailClient';
import PromoteSection from './PromoteSection';

interface AdDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({ params }: AdDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const ad = await prisma.ads.findFirst({
      where: { slug, status: 'approved', deleted_at: null },
      select: { title: true, description: true },
    });

    if (ad) {
      return {
        title: `${ad.title} - Thulobazaar`,
        description: ad.description?.substring(0, 160) || `View details for ${ad.title}`,
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
  const images = ad.ad_images.map(img =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${img.file_path}`
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Breadcrumb */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280', flexWrap: 'wrap' }}>
            <Link href={`/${lang}`} style={{ color: '#667eea', textDecoration: 'none' }}>
              Home
            </Link>
            <span>/</span>
            <Link href={`/${lang}/search`} style={{ color: '#667eea', textDecoration: 'none' }}>
              All Ads
            </Link>
            <span>/</span>
            {ad.categories?.name && ad.categories?.slug && (
              <>
                <Link href={`/${lang}/search?category=${ad.categories.slug}`} style={{ color: '#667eea', textDecoration: 'none' }}>
                  {ad.categories.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span>{ad.title.substring(0, 40)}{ad.title.length > 40 ? '...' : ''}</span>
          </div>
        </div>
      </div>

      {/* Success Banner - Show after successful promotion */}
      {search.promoted === 'true' && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1rem 0 1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '2rem' }}>🎉</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Promotion Activated Successfully!
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.95 }}>
                Your ad is now promoted and will get more visibility. Transaction ID: {search.txnId}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Image Gallery - Client component for interactivity */}
            <AdDetailClient images={images} lang={lang} />

            {/* Ad Details */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '0.5rem'
                  }}>
                    {ad.title}
                  </h1>
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    flexWrap: 'wrap'
                  }}>
                    {fullLocation && <span>📍 {fullLocation}</span>}
                    {fullLocation && <span>•</span>}
                    <span>🕒 {formatRelativeTime(ad.created_at || new Date())}</span>
                    <span>•</span>
                    <span>👁️ {ad.view_count || 0} views</span>
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '1rem'
              }}>
                {formatPrice(parseFloat(ad.price.toString()))}
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  background: '#f0f9ff',
                  color: '#0369a1',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  {condition}
                </span>
                {(ad.custom_fields as any)?.isNegotiable && (
                  <span style={{
                    background: '#fef3c7',
                    color: '#78350f',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    💰 Price is negotiable
                  </span>
                )}
                {fullCategory && (
                  <span style={{
                    background: '#f0fdf4',
                    color: '#166534',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
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

              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#1f2937'
                }}>
                  Description
                </h2>
                <p style={{
                  color: '#4b5563',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-line'
                }}>
                  {ad.description}
                </p>
              </div>

              {/* Specifications Section */}
              {ad.custom_fields && Object.keys(ad.custom_fields as object).length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#1f2937'
                  }}>
                    Specifications
                  </h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    {Object.entries(ad.custom_fields as Record<string, any>)
                      .filter(([key]) => key !== 'isNegotiable') // Filter out isNegotiable since it's shown as a badge
                      .map(([key, value]) => (
                      <div
                        key={key}
                        style={{
                          padding: '0.75rem',
                          background: '#f9fafb',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                          textTransform: 'capitalize'
                        }}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                        </div>
                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: '500',
                          color: '#1f2937'
                        }}>
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
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
                        <img
                          src="/golden-badge.png"
                          alt="Verified Business"
                          title="Verified Business"
                          style={{ width: '20px', height: '20px' }}
                        />
                      )}
                      {/* Blue Badge for Verified Individual */}
                      {ad.users_ads_user_idTousers?.account_type === 'individual' &&
                       (ad.users_ads_user_idTousers?.individual_verified || ad.users_ads_user_idTousers?.business_verification_status === 'verified') && (
                        <img
                          src="/blue-badge.png"
                          alt="Verified Individual Seller"
                          title="Verified Individual Seller"
                          style={{ width: '20px', height: '20px' }}
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
                <div style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  fontSize: '1rem',
                  textAlign: 'center'
                }}>
                  📞 {ad.users_ads_user_idTousers.phone}
                </div>
              )}

              {ad.users_ads_user_idTousers?.email && (
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}>
                  ✉️ Send Message
                </button>
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
              user_id: ad.user_id,
              is_featured: ad.is_featured,
              featured_until: ad.featured_until,
              is_urgent: ad.is_urgent,
              urgent_until: ad.urgent_until,
              is_sticky: ad.is_sticky,
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
        </div>
      </div>
    </div>
  );
}
