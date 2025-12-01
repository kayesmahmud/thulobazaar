import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { optionalAuth, requireAuth } from '@/lib/jwt';
import { generateSlug, generateSeoSlug } from '@/lib/slug';
import { processMultipleImages } from '@/lib/imageProcessing';
import { indexAd } from '@/lib/typesense';

/**
 * GET /api/ads
 * List ads with filters, pagination, and sorting
 *
 * Query params:
 * - search: string (search in title/description)
 * - categoryId: number
 * - locationId: number
 * - areaId: number
 * - minPrice: number
 * - maxPrice: number
 * - condition: 'new' | 'like_new' | 'good' | 'fair' | 'used'
 * - status: 'active' | 'pending' | 'sold' | 'expired' (default: 'active' for public)
 * - sort: 'newest' | 'price_low' | 'price_high' | 'popular' (default: 'newest')
 * - limit: number (default: 20, max: 100)
 * - page: number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Optional auth - to check if user is viewing their own ads
    const userId = await optionalAuth(request);

    // Parse query parameters
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const locationId = searchParams.get('locationId');
    const areaId = searchParams.get('areaId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const status = searchParams.get('status') || 'approved'; // Default to approved (public ads)
    const sort = searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: status,
      deleted_at: null, // Exclude deleted ads
    };

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (categoryId) {
      where.category_id = parseInt(categoryId);
    }

    // Filter by location
    if (locationId) {
      where.location_id = parseInt(locationId);
    }

    // Filter by area
    if (areaId) {
      where.area_id = parseInt(areaId);
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Filter by condition
    if (condition) {
      where.condition = condition;
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { view_count: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = [
          // Promoted ads first
          { is_featured: 'desc' },
          { is_urgent: 'desc' },
          { is_sticky: 'desc' },
          { created_at: 'desc' },
        ];
        break;
    }

    // Get total count for pagination
    const total = await prisma.ads.count({ where });

    // Fetch ads with related data
    const ads = await prisma.ads.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        condition: true,
        status: true,
        slug: true,
        view_count: true,
        is_featured: true,
        is_urgent: true,
        is_sticky: true,
        featured_until: true,
        urgent_until: true,
        sticky_until: true,
        created_at: true,
        updated_at: true,
        // Related data
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            type: true,
            slug: true,
          },
        },
        // Note: 'areas' relation removed - doesn't exist in schema
        users_ads_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
            seller_slug: true,
            shop_slug: true,
            individual_verified: true,
            business_verification_status: true,
          },
        },
        ad_images: {
          select: {
            id: true,
            filename: true,
            file_path: true,
            is_primary: true,
          },
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
          take: 1, // Only get primary image for list view
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price ? parseFloat(ad.price.toString()) : null,
      condition: ad.condition,
      status: ad.status,
      slug: ad.slug,
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isUrgent: ad.is_urgent,
      isSticky: ad.is_sticky,
      featuredUntil: ad.featured_until,
      urgentUntil: ad.urgent_until,
      stickyUntil: ad.sticky_until,
      createdAt: ad.created_at,
      updatedAt: ad.updated_at,
      category: ad.categories
        ? {
            id: ad.categories.id,
            name: ad.categories.name,
            slug: ad.categories.slug,
            icon: ad.categories.icon,
          }
        : null,
      location: ad.locations
        ? {
            id: ad.locations.id,
            name: ad.locations.name,
            type: ad.locations.type,
            slug: ad.locations.slug,
          }
        : null,
      // Note: 'area' removed - relation doesn't exist in schema
      user: ad.users_ads_user_idTousers
        ? {
            id: ad.users_ads_user_idTousers.id,
            fullName: ad.users_ads_user_idTousers.full_name,
            avatar: ad.users_ads_user_idTousers.avatar,
            sellerSlug: ad.users_ads_user_idTousers.seller_slug,
            shopSlug: ad.users_ads_user_idTousers.shop_slug,
            individualVerified: ad.users_ads_user_idTousers.individual_verified,
            businessVerificationStatus: ad.users_ads_user_idTousers.business_verification_status,
          }
        : null,
      primaryImage: ad.ad_images[0]
        ? {
            id: ad.ad_images[0].id,
            filename: ad.ad_images[0].filename,
            filePath: ad.ad_images[0].file_path,
            isPrimary: ad.ad_images[0].is_primary,
          }
        : null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedAds,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ads fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch ads',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ads
 * Create a new ad with images
 *
 * Body (multipart/form-data):
 * - title: string (required)
 * - description: string (required)
 * - price: number (required)
 * - condition: string
 * - categoryId: number (required)
 * - subcategoryId: number
 * - locationId: number (required)
 * - areaId: number
 * - latitude: number
 * - longitude: number
 * - googleMapsLink: string
 * - sellerName: string
 * - sellerPhone: string
 * - customFields: JSON string
 * - attributes: JSON string (alternative to customFields)
 * - isNegotiable: boolean
 * - images: File[] (max 10)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    // Parse FormData
    const formData = await request.formData();

    // Extract basic fields
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const priceStr = formData.get('price')?.toString();
    const condition = formData.get('condition')?.toString() || 'Used';
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

    // Parse custom fields (support both customFields and attributes)
    let customFields: any = {};
    const customFieldsStr = formData.get('customFields')?.toString();
    const attributesStr = formData.get('attributes')?.toString();

    if (customFieldsStr) {
      try {
        customFields = JSON.parse(customFieldsStr);
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Invalid customFields format' },
          { status: 400 }
        );
      }
    } else if (attributesStr) {
      try {
        customFields = JSON.parse(attributesStr);
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Invalid attributes format' },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!title || !description || !priceStr) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: title, description, price',
        },
        { status: 400 }
      );
    }

    const price = parseFloat(priceStr);
    const categoryId = parseInt(subcategoryIdStr || categoryIdStr || '0');
    const locationId = parseInt(areaIdStr || locationIdStr || '0');

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

    // Get user details if sellerName/sellerPhone not provided
    let finalSellerName = sellerName;
    let finalSellerPhone = sellerPhone;

    if (!finalSellerName || !finalSellerPhone) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { full_name: true, phone: true },
      });

      if (user) {
        finalSellerName = finalSellerName || user.full_name;
        finalSellerPhone = finalSellerPhone || user.phone || '';
      }
    }

    // Generate unique slug
    const slug = await generateSlug(title);

    // Prepare custom_fields JSON
    const customFieldsData = {
      ...customFields,
      ...(isNegotiableStr !== undefined && {
        isNegotiable: isNegotiableStr === 'true',
      }),
      ...(latitude && { latitude: parseFloat(latitude) }),
      ...(longitude && { longitude: parseFloat(longitude) }),
      ...(googleMapsLink && { googleMapsLink }),
    };

    // Process uploaded images
    const images: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        images.push(value);
      }
    }

    let processedImages: Awaited<ReturnType<typeof processMultipleImages>> = [];
    if (images.length > 0) {
      try {
        processedImages = await processMultipleImages(images, 'uploads/ads', {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 85,
          format: 'jpeg',
        });
      } catch (error: any) {
        return NextResponse.json(
          {
            success: false,
            message: `Image processing failed: ${error.message}`,
          },
          { status: 400 }
        );
      }
    }

    // Create ad in database
    const ad = await prisma.ads.create({
      data: {
        title,
        description,
        price,
        condition,
        category_id: categoryId,
        location_id: locationId,
        seller_name: finalSellerName || '',
        seller_phone: finalSellerPhone || '',
        user_id: userId,
        slug,
        custom_fields: customFieldsData,
        status: 'approved', // Auto-approve for now
      },
    });

    // Save images to database
    if (processedImages.length > 0) {
      await prisma.ad_images.createMany({
        data: processedImages.map((img, index) => ({
          ad_id: ad.id,
          filename: img.filename,
          file_path: img.filePath,
          original_name: images[index]?.name || img.filename,
          file_size: img.fileSize,
          mime_type: img.mimeType,
          is_primary: index === 0, // First image is primary
        })),
      });
    }

    // Get location hierarchy for SEO slug
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      select: {
        name: true,
        type: true,
        parent_id: true,
      },
    });

    let areaName: string | null = null;
    let districtName: string | null = null;

    if (location?.type === 'area') {
      areaName = location.name;
      // Get parent district
      if (location.parent_id) {
        const district = await prisma.locations.findUnique({
          where: { id: location.parent_id },
          select: { name: true, type: true },
        });
        if (district?.type === 'district') {
          districtName = district.name;
        }
      }
    } else if (location?.type === 'district') {
      districtName = location.name;
    }

    // Generate SEO slug
    const seoSlug = generateSeoSlug(ad.id, ad.title, areaName, districtName);

    // Index ad to Typesense (async, don't block response)
    indexAd({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      condition,
      category_id: categoryId,
      category_name: '', // Will be fetched separately if needed
      location_id: locationId,
      location_name: location?.name || '',
      seller_name: finalSellerName || '',
      seller_phone: finalSellerPhone || '',
      is_featured: false,
      status: ad.status,
      created_at: ad.created_at,
      updated_at: ad.updated_at,
      primary_image: processedImages[0]?.filePath || '',
      images: processedImages.map((img) => img.filePath),
    }).catch((error) => console.error('Failed to index ad to Typesense:', error));

    console.log(
      `✅ Created ad: ${ad.title} with ${processedImages.length} images, SEO slug: ${seoSlug}`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Ad created successfully',
        data: {
          id: ad.id,
          title: ad.title,
          price: ad.price ? parseFloat(ad.price.toString()) : 0,
          slug: ad.slug,
          seoSlug,
          imageCount: processedImages.length,
          createdAt: ad.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Ad creation error:', error);

    // Check for authentication errors
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create ad',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
