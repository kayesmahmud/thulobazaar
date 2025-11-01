import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/profiles/seller/:slug
 * Get public seller profile by slug (individual verified sellers)
 *
 * Returns seller info, stats, and ads
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find user by seller_slug
    const user = await prisma.users.findFirst({
      where: { seller_slug: slug },
      select: {
        id: true,
        full_name: true,
        verified_seller_name: true,
        email: true,
        phone: true,
        avatar: true,
        cover_photo: true,
        bio: true,
        account_type: true,
        seller_slug: true,
        individual_verified: true,
        individual_verified_at: true,
        business_verification_status: true,
        business_website: true,
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
          message: 'Seller not found',
        },
        { status: 404 }
      );
    }

    // Get ads
    const ads = await prisma.ads.findMany({
      where: {
        user_id: user.id,
        status: 'approved',
        deleted_at: null,
      },
      select: {
        id: true,
        title: true,
        price: true,
        condition: true,
        description: true,
        created_at: true,
        view_count: true,
        is_featured: true,
        is_bumped: true,
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
        { is_sticky: 'desc' },
        { is_bumped: 'desc' },
        { created_at: 'desc' },
      ],
    });

    // Calculate stats
    const totalAds = ads.length;
    const featuredAds = ads.filter((ad) => ad.is_featured).length;
    const totalViews = ads.reduce((sum, ad) => sum + ad.view_count, 0);

    // Transform
    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      price: ad.price ? parseFloat(ad.price.toString()) : 0,
      condition: ad.condition,
      description: ad.description,
      createdAt: ad.created_at,
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isBumped: ad.is_bumped,
      isSticky: ad.is_sticky,
      isUrgent: ad.is_urgent,
      slug: ad.slug,
      categoryName: ad.categories?.name || null,
      locationName: ad.locations?.name || null,
      primaryImage: ad.ad_images[0]?.file_path || null,
    }));

    const sellerData = {
      id: user.id,
      fullName: user.full_name,
      verifiedSellerName: user.verified_seller_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      coverPhoto: user.cover_photo,
      bio: user.bio,
      accountType: user.account_type,
      sellerSlug: user.seller_slug,
      individualVerified: user.individual_verified,
      individualVerifiedAt: user.individual_verified_at,
      businessVerificationStatus: user.business_verification_status,
      businessWebsite: user.business_website,
      createdAt: user.created_at,
      locationName: user.locations?.name || null,
      locationSlug: user.locations?.slug || null,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          seller: sellerData,
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
    console.error('Seller profile fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching seller profile',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
