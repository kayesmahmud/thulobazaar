import { Metadata } from 'next';
import Link from 'next/link';
import { formatPrice, formatRelativeTime } from '@thulobazaar/utils';
import { prisma } from '@thulobazaar/database';
import AdCard from '@/components/AdCard';
import HeroSearch from './HeroSearch';

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
    <div className="min-h-screen">
      {/* Hero Section with Enhanced Design */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center text-white">
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold mb-4 animate-fade-in-up">
            Buy, Sell, and Rent Across Nepal
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Nepal&apos;s Leading Classifieds Marketplace
          </p>

          {/* Enhanced Search Bar */}
          <HeroSearch lang={lang} />

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${lang}/post-ad`}
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 no-underline"
            >
              + Post Free Ad
            </Link>
            <Link
              href={`/${lang}/all-ads`}
              className="px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center gap-2 backdrop-blur-sm no-underline"
            >
              Browse All Ads →
            </Link>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Browse Categories
            </h2>
            <p className="text-gray-500">
              Find what you&apos;re looking for
            </p>
          </div>
          <Link
            href={`/${lang}/all-ads`}
            className="text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 no-underline transition-colors"
          >
            View All
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${lang}/ads/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group bg-white rounded-2xl p-6 text-center border-2 border-gray-100 hover:border-rose-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 no-underline"
            >
              <div className="text-5xl mb-3 transition-transform duration-300 group-hover:scale-110">
                {category.icon || '📁'}
              </div>
              <div className="font-semibold text-gray-900 group-hover:text-rose-500 transition-colors">
                {category.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest Ads Section */}
      <div className="max-w-7xl mx-auto py-12 px-4 mb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Latest Ads
          </h2>
          <Link
            href={`/${lang}/all-ads`}
            className="text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 no-underline transition-colors"
          >
            View All Ads
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {latestAds.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold mb-2 text-gray-900">
              No ads yet
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to post an ad!
            </p>
            <Link
              href={`/${lang}/post-ad`}
              className="inline-block px-6 py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors no-underline"
            >
              Post Free Ad
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {latestAds.map((ad) => (
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
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-gray-300">&copy; 2025 Thulobazaar. All rights reserved.</p>
          <p className="text-sm mt-2 text-gray-400">
            Built with Next.js 15 + TypeScript + Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
