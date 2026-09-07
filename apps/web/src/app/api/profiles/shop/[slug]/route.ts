import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { publicVerification } from '@thulobazaar/types';
import { cleanupExpiredPromotionFlags } from '@/lib/promotion/cleanupExpired';

/**
 * GET /api/profiles/shop/:slug
 * Get public shop/seller profile by slug
 *
 * Returns shop info, stats, and ads
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Clean up expired promotions before querying
    await cleanupExpiredPromotionFlags();

    const { slug } = await params;

    // Find user by shop_slug (exclude soft-deleted users)
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { shop_slug: slug },
          { custom_shop_slug: slug },
        ],
        deleted_at: null, // Exclude soft-deleted users
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        // 🔒 DB-1: email is the login identifier — never expose on a public shop
        // profile (harvestable via sitemap slugs). Express equivalent already omits it.
        phone: true,
        avatar: true,
        cover_photo: true,
        bio: true,
        account_type: true,
        shop_slug: true,
        business_name: true,
        business_category: true,
        business_description: true,
        business_website: true,
        business_phone: true,
        business_address: true,
        business_verification_status: true,
        business_verified_at: true,
        individual_verified: true,
        is_suspended: true,
        is_active: true,
        individual_verified_at: true,
        google_maps_link: true,
        created_at: true,
        location_id: true,
        locations: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shop not found',
        },
        { status: 404 }
      );
    }

    // 🔒 DB-M5: bound the list (a shop could have thousands of ads) and compute
    // stats with aggregate/count instead of scanning every row into JS.
    const adsWhere = {
      user_id: user.id,
      status: 'approved',
      deleted_at: null,
    };
    const SHOP_ADS_LIMIT = 100;

    // Get ads with basic info (for shop page)
    const ads = await prisma.ads.findMany({
      where: adsWhere,
      take: SHOP_ADS_LIMIT,
      select: {
        id: true,
        title: true,
        price: true,
        condition: true,
        description: true,
        created_at: true,
        reviewed_at: true,
        published_at: true,
        view_count: true,
        is_featured: true,
        is_sticky: true,
        is_urgent: true,
        slug: true,
        categories: {
          select: {
            name: true,
          },
        },
        locations: {
          select: {
            name: true,
          },
        },
        ad_images: {
          where: { is_primary: true },
          select: {
            filename: true,
            file_path: true,
          },
          take: 1,
        },
      },
      orderBy: [
        // Urgent > Sticky (Featured has its own homepage section)
        { is_urgent: 'desc' },
        { is_sticky: 'desc' },
        { published_at: { sort: 'desc', nulls: 'last' } }, // Sort by first-publish time, nulls last
      ],
    });

    // Calculate stats over the FULL approved set (not just the capped page).
    const [stats, featuredAds] = await Promise.all([
      prisma.ads.aggregate({
        where: adsWhere,
        _count: { _all: true },
        _sum: { view_count: true },
      }),
      prisma.ads.count({ where: { ...adsWhere, is_featured: true } }),
    ]);
    const totalAds = stats._count._all;
    const totalViews = stats._sum.view_count || 0;

    // Transform ads to camelCase
    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      price: ad.price ? parseFloat(ad.price.toString()) : 0,
      condition: ad.condition,
      description: ad.description,
      // publishedAt = when editor approved (use this for "time ago" display)
      publishedAt: ad.published_at || ad.reviewed_at || ad.created_at,
      createdAt: ad.created_at,
      reviewedAt: ad.published_at || ad.reviewed_at,
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isSticky: ad.is_sticky,
      isUrgent: ad.is_urgent,
      slug: ad.slug,
      categoryName: ad.categories?.name || null,
      locationName: ad.locations?.name || null,
      primaryImage: ad.ad_images[0]?.file_path || null,
    }));

    // Transform shop data to camelCase
    const shopData = {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      avatar: user.avatar,
      coverPhoto: user.cover_photo,
      bio: user.bio,
      accountType: user.account_type,
      shopSlug: user.shop_slug,
      businessName: user.business_name,
      businessCategory: user.business_category,
      businessDescription: user.business_description,
      businessWebsite: user.business_website,
      businessPhone: user.business_phone,
      businessAddress: user.business_address,
      // Suspended/deactivated accounts show no badge (publicVerification)
      businessVerificationStatus: publicVerification(user).businessVerificationStatus,
      businessVerifiedAt: user.business_verified_at,
      individualVerified: publicVerification(user).individualVerified,
      individualVerifiedAt: user.individual_verified_at,
      googleMapsLink: user.google_maps_link,
      createdAt: user.created_at,
      locationName: user.locations?.name || null,
      locationSlug: user.locations?.slug || null,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          shop: shopData,
          ads: transformedAds,
          stats: {
            totalAds,
            featuredAds,
            totalViews,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Shop profile fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching shop profile',
      },
      { status: 500 }
    );
  }
}
