import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await verifyToken(request);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const userId = payload.userId as number;

    // Get user profile from database
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        bio: true,
        avatar: true,
        cover_photo: true,
        role: true,
        is_active: true,
        is_suspended: true,
        location_id: true,
        account_type: true,
        business_name: true,
        business_verification_status: true,
        business_category: true,
        business_description: true,
        business_website: true,
        business_phone: true,
        business_address: true,
        business_subscription_status: true,
        shop_slug: true,
        custom_shop_slug: true,
        seller_slug: true,
        individual_verified: true,
        individual_verified_at: true,
        individual_verification_expires_at: true,
        business_verified_at: true,
        business_verification_expires_at: true,
        verified_seller_name: true,
        latitude: true,
        longitude: true,
        formatted_address: true,
        google_maps_link: true,
        created_at: true,
        updated_at: true,
        locations: {
          select: {
            id: true,
            name: true,
            type: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Transform to camelCase for frontend
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      bio: user.bio,
      avatar: user.avatar,
      coverPhoto: user.cover_photo,
      role: user.role,
      isActive: user.is_active,
      isSuspended: user.is_suspended,
      locationId: user.location_id,
      location: user.locations,
      accountType: user.account_type,
      businessName: user.business_name,
      businessVerificationStatus: user.business_verification_status,
      businessCategory: user.business_category,
      businessDescription: user.business_description,
      businessWebsite: user.business_website,
      businessPhone: user.business_phone,
      businessAddress: user.business_address,
      businessSubscriptionStatus: user.business_subscription_status,
      shopSlug: user.shop_slug,
      customShopSlug: user.custom_shop_slug,
      sellerSlug: user.seller_slug,
      individualVerified: user.individual_verified,
      individualVerifiedAt: user.individual_verified_at,
      individualVerificationExpiresAt: user.individual_verification_expires_at,
      businessVerifiedAt: user.business_verified_at,
      businessVerificationExpiresAt: user.business_verification_expires_at,
      verifiedSellerName: user.verified_seller_name,
      latitude: user.latitude,
      longitude: user.longitude,
      formattedAddress: user.formatted_address,
      googleMapsLink: user.google_maps_link,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await verifyToken(request);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const userId = payload.userId as number;
    const body = await request.json();

    // Allowed fields to update
    const updateData: any = {};

    if (body.fullName) updateData.full_name = body.fullName;
    if (body.phone) updateData.phone = body.phone;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.locationId) updateData.location_id = body.locationId;

    // Update user profile
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        bio: true,
        avatar: true,
        cover_photo: true,
        role: true,
        location_id: true,
        updated_at: true,
      },
    });

    // Transform to camelCase
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      coverPhoto: updatedUser.cover_photo,
      role: updatedUser.role,
      locationId: updatedUser.location_id,
      updatedAt: updatedUser.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
