import { NextRequest, NextResponse } from 'next/server';
import { findProhibitedAccountSale, PROHIBITED_ACCOUNT_SALE_MESSAGE } from '@thulobazaar/types';
import { optionalAuth, requireAuth } from '@/lib/auth';
import {
  listAds,
  createAd,
  parseCustomFields,
  normalizeCondition,
  AD_DUPLICATE_PENDING_MESSAGE,
  AD_DUPLICATE_LIVE_MESSAGE,
} from '@/lib/services/ad.service';
import {
  getAdLimits,
  isUserVerified,
  countUserActiveAds,
  calculateExpiresAt,
  getBooleanSetting,
} from '@/lib/services/adLimits.service';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/ads
 * List ads with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await optionalAuth(request);

    const result = await listAds({
      search: searchParams.get('search'),
      categoryId: searchParams.get('categoryId'),
      locationId: searchParams.get('locationId'),
      areaId: searchParams.get('areaId'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      condition: searchParams.get('condition'),
      // 🔒 DB-2: the public listing must ONLY ever return approved ads. Honoring a
      // client `?status=pending|rejected` would enumerate every user's unmoderated
      // ads. Owners view their own non-approved ads via the dedicated /api/ads/my.
      status: 'approved',
      sort: searchParams.get('sort') || 'newest',
      limit: parseInt(searchParams.get('limit') || '20', 10),
      page: parseInt(searchParams.get('page') || '1', 10),
    });

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error('Ads fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ads
 * Create a new ad with images
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Next.js POST /api/ads - Request received');

    // Authenticate
    const userId = await requireAuth(request);
    console.log('✅ Auth successful, userId:', userId);

    // Check phone verification if required
    const requirePhoneVerification = await getBooleanSetting('require_phone_verification', true);
    if (requirePhoneVerification) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { phone_verified: true },
      });
      if (!user?.phone_verified) {
        return NextResponse.json(
          { success: false, message: 'Phone verification is required before posting ads' },
          { status: 403 }
        );
      }
    }

    // Parse FormData
    const formData = await request.formData();
    console.log('✅ FormData parsed, keys:', Array.from(formData.keys()));

    // Extract fields
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const priceStr = formData.get('price')?.toString();
    let condition: string | null | undefined = formData.get('condition')?.toString();
    const categoryIdStr = formData.get('categoryId')?.toString();
    const subcategoryIdStr = formData.get('subcategoryId')?.toString();
    const locationIdStr = formData.get('locationId')?.toString();
    const areaIdStr = formData.get('areaId')?.toString();
    const latitude = formData.get('latitude')?.toString();
    const longitude = formData.get('longitude')?.toString();
    const googleMapsLink = formData.get('googleMapsLink')?.toString();
    const sellerName = formData.get('sellerName')?.toString();
    const sellerPhone = formData.get('sellerPhone')?.toString();
    const isNegotiableStr = formData.get('isNegotiable')?.toString();
    const customFieldsStr = formData.get('customFields')?.toString();
    const attributesStr = formData.get('attributes')?.toString();

    // Parse custom fields
    let customFields: Record<string, unknown> = {};
    try {
      const parsed = parseCustomFields(customFieldsStr, attributesStr);
      customFields = parsed.customFields;
      if (!condition && parsed.condition) {
        condition = parsed.condition;
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    // Normalize condition
    condition = normalizeCondition(condition);

    // Validate required fields
    if (!title || !description || !priceStr) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: title, description, price' },
        { status: 400 }
      );
    }

    // Banned outright (not held for review): game IDs and social accounts.
    // Same shared rule the Express/mobile path uses — see @thulobazaar/types.
    if (findProhibitedAccountSale(title)) {
      return NextResponse.json(
        { success: false, message: PROHIBITED_ACCOUNT_SALE_MESSAGE },
        { status: 400 }
      );
    }

    const price = parseFloat(priceStr);
    const categoryId = parseInt(subcategoryIdStr || categoryIdStr || '0', 10);
    const locationId = parseInt(areaIdStr || locationIdStr || '0', 10);

    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid price' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category is required' },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { success: false, message: 'Location is required' },
        { status: 400 }
      );
    }

    // Enforce ad limits from site_settings (tiered by verification status)
    const [limits, verified, activeAdCount] = await Promise.all([
      getAdLimits(),
      isUserVerified(userId),
      countUserActiveAds(userId),
    ]);

    const maxActiveAds = verified ? limits.maxAdsPerUser : limits.freeAdsLimit;
    const imageLimit = verified ? limits.maxImagesVerified : limits.maxImagesUnverified;

    if (activeAdCount >= maxActiveAds) {
      return NextResponse.json(
        {
          success: false,
          message: verified
            ? `You have reached the maximum limit of ${maxActiveAds} ads`
            : `You have reached the limit of ${maxActiveAds} ads for unverified accounts. Get verified to post up to ${limits.maxAdsPerUser} ads`,
        },
        { status: 400 }
      );
    }

    // Extract images
    const images: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        images.push(value);
      }
    }

    // Enforce image limit based on verification status
    if (images.length > imageLimit) {
      return NextResponse.json(
        { success: false, message: `You can upload a maximum of ${imageLimit} images per ad` },
        { status: 400 }
      );
    }

    // Create ad with expiry
    const result = await createAd(
      userId,
      {
        title,
        description,
        price,
        condition,
        categoryId,
        locationId,
        sellerName,
        sellerPhone,
        customFields,
        isNegotiable: isNegotiableStr === 'true',
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        googleMapsLink,
        expiresAt: calculateExpiresAt(limits.adExpiryDays),
      },
      images
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Ad created successfully',
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Ad creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message?.includes('Image processing failed')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    // Impatient-repost guard — surface the bilingual explanation, not a 500
    if (
      error.message === AD_DUPLICATE_PENDING_MESSAGE ||
      error.message === AD_DUPLICATE_LIVE_MESSAGE
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create ad',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
