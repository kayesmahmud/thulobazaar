import { Metadata } from 'next';
import Link from 'next/link';
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';
import { prisma } from '@thulobazaar/database';
import AdCard from '@/components/AdCard';

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;

  return {
    title: 'Thulobazaar - Buy, Sell, and Rent Across Nepal',
    description: "Nepal's leading classifieds marketplace. Buy and sell electronics, vehicles, real estate, and more. Post free ads and connect with buyers across Nepal.",
    keywords: 'Nepal classifieds, buy sell Nepal, online marketplace Nepal, free ads Nepal, Thulobazaar',
    openGraph: {
      title: 'Thulobazaar - Buy, Sell, and Rent Across Nepal',
      description: "Nepal's leading classifieds marketplace",
      type: 'website',
      siteName: 'Thulobazaar',
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;

  // ✅ Fetch real data from database using Prisma (parallel queries for performance)
  const [categories, latestAds] = await Promise.all([
    // Get all top-level categories (no parent)
    prisma.categories.findMany({
      where: {
        parent_id: null,
      },
      orderBy: {
        id: 'asc',
      },
      // Get all 16 categories instead of limiting to 8
    }),
    // Get latest 6 approved ads with images
    prisma.ads.findMany({
      where: {
        status: 'approved',
        deleted_at: null,
        ad_images: {
          some: {}, // Only show ads with at least one image
        },
      },
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
        categories: {
          select: {
            id: true,
            name: true,
            icon: true,
            categories: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
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
      orderBy: {
        created_at: 'desc',
      },
      take: 6,
    }),
  ]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Buy, Sell, and Rent Across Nepal
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
          Nepal's Leading Classifieds Marketplace
        </p>

        {/* Search Bar */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <input
            type="text"
            placeholder="Search for anything..."
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem'
            }}
          />
          <Link
            href={`/${lang}/search`}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Search
          </Link>
        </div>

        {/* Post Ad Button */}
        <Link
          href={`/${lang}/post-ad`}
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            background: '#f59e0b',
            color: 'white',
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          + Post Free Ad
        </Link>
      </div>

      {/* Categories Section */}
      <div style={{ maxWidth: '1200px', margin: '3rem auto', padding: '0 2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '2rem' }}>
          Browse Categories
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${lang}/ads/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#1f2937',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {category.icon || '📁'}
              </div>
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                {category.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest Ads Section */}
      <div style={{
        maxWidth: '1200px',
        margin: '3rem auto',
        padding: '0 2rem',
        marginBottom: '4rem'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '2rem' }}>
          Latest Ads ({latestAds.length} from Prisma 🎉)
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {latestAds.map((ad) => (
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
      </div>

      {/* Footer */}
      <footer style={{
        background: '#1f2937',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <p>&copy; 2025 Thulobazaar. All rights reserved.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.8 }}>
          🚀 Built with Next.js 15 + TypeScript + Monorepo Architecture
        </p>
      </footer>
    </div>
  );
}
