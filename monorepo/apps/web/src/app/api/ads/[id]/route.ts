import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { generateSlug } from '@/lib/slug';
import { processMultipleImages, deleteImage } from '@/lib/imageProcessing';
import { indexAd, removeAdFromIndex } from '@/lib/typesense';
import { getLocationBreadcrumb } from '@/lib/locationHierarchy';

/**
 * GET /api/ads/:id
 * Get single ad with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adId = parseInt(id);

    if (isNaN(adId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid ad ID',
        },
        { status: 400 }
      );
    }

    // Fetch ad with all related data
    const ad = await prisma.ads.findUnique({
      where: {
        id: adId,
        deleted_at: null, // Exclude deleted ads
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        condition: true,
        status: true,
        slug: true,
        seller_name: true,
        seller_phone: true,
        view_count: true,
        custom_fields: true,
        is_featured: true,
        is_urgent: true,
        is_sticky: true,
        featured_until: true,
        urgent_until: true,
        sticky_until: true,
        latitude: true,
        longitude: true,
        created_at: true,
        updated_at: true,
        // Related data
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            form_template: true,
            parent_id: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            type: true,
            slug: true,
            parent_id: true,
          },
        },
        areas: {
          select: {
            id: true,
            name: true,
            name_np: true,
            ward_number: true,
            municipality_id: true,
          },
        },
        users_ads_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            avatar: true,
            bio: true,
            seller_slug: true,
            shop_slug: true,
            individual_verified: true,
            business_name: true,
            business_verification_status: true,
            created_at: true,
          },
        },
        ad_images: {
          select: {
            id: true,
            filename: true,
            file_path: true,
            original_name: true,
            file_size: true,
            mime_type: true,
            is_primary: true,
            created_at: true,
          },
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
      },
    });

    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ad not found',
        },
        { status: 404 }
      );
    }

    // Increment view count (async, don't wait for it)
    prisma.ads
      .update({
        where: { id: adId },
        data: { view_count: { increment: 1 } },
      })
      .catch((error) => console.error('Failed to increment view count:', error));

    // Get location hierarchy
    const locationHierarchy = ad.locations?.id
      ? await getLocationBreadcrumb(ad.locations.id)
      : [];

    // Transform to camelCase
    const transformedAd = {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price ? parseFloat(ad.price.toString()) : null,
      condition: ad.condition,
      status: ad.status,
      slug: ad.slug,
      sellerName: ad.seller_name,
      sellerPhone: ad.seller_phone,
      viewCount: ad.view_count,
      customFields: ad.custom_fields || {},
      isFeatured: ad.is_featured,
      isUrgent: ad.is_urgent,
      isSticky: ad.is_sticky,
      featuredUntil: ad.featured_until,
      urgentUntil: ad.urgent_until,
      stickyUntil: ad.sticky_until,
      latitude: ad.latitude ? parseFloat(ad.latitude.toString()) : null,
      longitude: ad.longitude ? parseFloat(ad.longitude.toString()) : null,
      createdAt: ad.created_at,
      updatedAt: ad.updated_at,
      category: ad.categories
        ? {
            id: ad.categories.id,
            name: ad.categories.name,
            slug: ad.categories.slug,
            icon: ad.categories.icon,
            formTemplate: ad.categories.form_template,
            parentId: ad.categories.parent_id,
          }
        : null,
      location: ad.locations
        ? {
            id: ad.locations.id,
            name: ad.locations.name,
            type: ad.locations.type,
            slug: ad.locations.slug,
            parentId: ad.locations.parent_id,
          }
        : null,
      locationHierarchy,
      area: ad.areas
        ? {
            id: ad.areas.id,
            name: ad.areas.name,
            nameNp: ad.areas.name_np,
            wardNumber: ad.areas.ward_number,
            municipalityId: ad.areas.municipality_id,
          }
        : null,
      user: ad.users_ads_user_idTousers
        ? {
            id: ad.users_ads_user_idTousers.id,
            fullName: ad.users_ads_user_idTousers.full_name,
            phone: ad.users_ads_user_idTousers.phone,
            avatar: ad.users_ads_user_idTousers.avatar,
            bio: ad.users_ads_user_idTousers.bio,
            sellerSlug: ad.users_ads_user_idTousers.seller_slug,
            shopSlug: ad.users_ads_user_idTousers.shop_slug,
            individualVerified: ad.users_ads_user_idTousers.individual_verified,
            businessName: ad.users_ads_user_idTousers.business_name,
            businessVerificationStatus: ad.users_ads_user_idTousers.business_verification_status,
            memberSince: ad.users_ads_user_idTousers.created_at,
          }
        : null,
      images: ad.ad_images.map((img) => ({
        id: img.id,
        filename: img.filename,
        filePath: img.file_path,
        originalName: img.original_name,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        isPrimary: img.is_primary,
        createdAt: img.created_at,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedAd,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ad fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch ad',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ads/:id
 * Update an ad with optional image management
 *
 * Body (multipart/form-data):
 * - title, description, price, condition, categoryId, locationId, etc.
 * - existingImages: JSON string of image file paths to keep
 * - images: New image files to add
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { id } = await params;
    const adId = parseInt(id);

    if (isNaN(adId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ad ID' },
        { status: 400 }
      );
    }

    // Check if ad exists and user owns it
    const existingAd = await prisma.ads.findUnique({
      where: { id: adId },
      select: {
        id: true,
        user_id: true,
        title: true,
        custom_fields: true,
      },
    });

    if (!existingAd) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      );
    }

    if (existingAd.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to edit this ad' },
        { status: 403 }
      );
    }

    // Parse FormData
    const formData = await request.formData();

    // Extract fields
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const priceStr = formData.get('price')?.toString();
    const condition = formData.get('condition')?.toString();
    const categoryIdStr = formData.get('categoryId')?.toString();
    const subcategoryIdStr = formData.get('subcategoryId')?.toString();
    const locationIdStr = formData.get('locationId')?.toString();
    const areaIdStr = formData.get('areaId')?.toString();
    const status = formData.get('status')?.toString();
    const latitude = formData.get('latitude')?.toString();
    const longitude = formData.get('longitude')?.toString();
    const googleMapsLink = formData.get('googleMapsLink')?.toString();
    const isNegotiableStr = formData.get('isNegotiable')?.toString();
    const existingImagesStr = formData.get('existingImages')?.toString();

    // Parse custom fields (support both customFields and attributes)
    let customFields: any = existingAd.custom_fields || {};
    const customFieldsStr = formData.get('customFields')?.toString();
    const attributesStr = formData.get('attributes')?.toString();

    if (customFieldsStr) {
      try {
        const parsed = JSON.parse(customFieldsStr);
        customFields = { ...customFields, ...parsed };
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Invalid customFields format' },
          { status: 400 }
        );
      }
    } else if (attributesStr) {
      try {
        const parsed = JSON.parse(attributesStr);
        customFields = { ...customFields, ...parsed };
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Invalid attributes format' },
          { status: 400 }
        );
      }
    }

    // Parse existing images to keep
    let existingImages: string[] = [];
    if (existingImagesStr) {
      try {
        existingImages = JSON.parse(existingImagesStr);
      } catch (error) {
        console.error('Failed to parse existingImages:', error);
        existingImages = [];
      }
    }

    console.log('🖼️ [UPDATE AD] Ad ID:', adId);
    console.log('🖼️ [UPDATE AD] Existing images to keep:', existingImages);

    // Build update data
    const updateData: any = {};

    if (title) {
      updateData.title = title;
      // Generate new slug if title changed
      if (title !== existingAd.title) {
        updateData.slug = await generateSlug(title, adId);
      }
    }
    if (description !== undefined) updateData.description = description;
    if (priceStr !== undefined) updateData.price = parseFloat(priceStr);
    if (condition !== undefined) updateData.condition = condition;
    if (subcategoryIdStr || categoryIdStr) {
      updateData.category_id = parseInt(subcategoryIdStr || categoryIdStr || '0');
    }
    if (areaIdStr || locationIdStr) {
      updateData.location_id = parseInt(areaIdStr || locationIdStr || '0');
    }
    if (status !== undefined) updateData.status = status;

    // Update custom fields
    const updatedCustomFields = {
      ...customFields,
      ...(isNegotiableStr !== undefined && {
        isNegotiable: isNegotiableStr === 'true',
      }),
      ...(latitude && { latitude: parseFloat(latitude) }),
      ...(longitude && { longitude: parseFloat(longitude) }),
      ...(googleMapsLink && { googleMapsLink }),
    };
    updateData.custom_fields = updatedCustomFields;
    updateData.updated_at = new Date();

    // Update ad in database
    const updatedAd = await prisma.ads.update({
      where: { id: adId },
      data: updateData,
    });

    // Handle image management
    // 1. Get all current images
    const currentImages = await prisma.ad_images.findMany({
      where: { ad_id: adId },
      select: { id: true, file_path: true },
    });

    console.log('🖼️ [UPDATE AD] Current images in DB:', currentImages.length);

    // 2. Delete images not in the existingImages array
    const imagesToDelete = currentImages.filter(
      (img) =>
        !existingImages.includes(img.file_path) &&
        !existingImages.includes(`http://localhost:3333/${img.file_path}`)
    );

    console.log('🖼️ [UPDATE AD] Images to delete:', imagesToDelete.length);

    for (const img of imagesToDelete) {
      // Delete from database
      await prisma.ad_images.delete({ where: { id: img.id } });
      // Delete file from disk
      await deleteImage(img.file_path);
    }

    // 3. Process new uploaded images
    const newImages: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        newImages.push(value);
      }
    }

    console.log('🖼️ [UPDATE AD] New images to add:', newImages.length);

    let processedImages: Awaited<ReturnType<typeof processMultipleImages>> = [];
    if (newImages.length > 0) {
      try {
        processedImages = await processMultipleImages(newImages, 'uploads/ads', {
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

      // Get remaining image count to determine if new images should be primary
      const remainingImageCount = await prisma.ad_images.count({
        where: { ad_id: adId },
      });

      console.log(
        '🖼️ [UPDATE AD] Remaining images after deletion:',
        remainingImageCount
      );

      // Insert new images
      await prisma.ad_images.createMany({
        data: processedImages.map((img, index) => ({
          ad_id: adId,
          filename: img.filename,
          file_path: img.filePath,
          original_name: newImages[index].name,
          file_size: img.fileSize,
          mime_type: img.mimeType,
          is_primary: remainingImageCount === 0 && index === 0, // First is primary if no existing images
        })),
      });
    }

    // Re-index ad to Typesense (async, don't block response)
    // Fetch full ad data for reindexing
    const adForIndex = await prisma.ads.findUnique({
      where: { id: adId },
      include: {
        categories: { select: { name: true } },
        locations: { select: { name: true } },
        ad_images: { select: { file_path: true }, orderBy: { is_primary: 'desc' } },
      },
    });

    if (adForIndex) {
      indexAd({
        id: adForIndex.id,
        title: adForIndex.title,
        description: adForIndex.description,
        price: adForIndex.price,
        condition: adForIndex.condition,
        category_id: adForIndex.category_id,
        category_name: adForIndex.categories?.name || '',
        location_id: adForIndex.location_id,
        location_name: adForIndex.locations?.name || '',
        seller_name: adForIndex.seller_name || '',
        seller_phone: adForIndex.seller_phone || '',
        is_featured: adForIndex.is_featured,
        status: adForIndex.status,
        created_at: adForIndex.created_at,
        updated_at: adForIndex.updated_at,
        primary_image: adForIndex.ad_images[0]?.file_path || '',
        images: adForIndex.ad_images.map((img) => img.file_path),
      }).catch((error) => console.error('Failed to reindex ad to Typesense:', error));
    }

    console.log(
      `✅ Updated ad: ${updatedAd.title} with ${processedImages.length} new images`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Ad updated successfully',
        data: {
          id: updatedAd.id,
          title: updatedAd.title,
          price: parseFloat(updatedAd.price.toString()),
          updatedAt: updatedAd.updated_at,
          newImageCount: processedImages.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Ad update error:', error);

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
        message: 'Failed to update ad',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ads/:id
 * Soft delete an ad (set deleted_at timestamp)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { id } = await params;
    const adId = parseInt(id);

    if (isNaN(adId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ad ID' },
        { status: 400 }
      );
    }

    // Check if ad exists and user owns it
    const existingAd = await prisma.ads.findUnique({
      where: { id: adId },
      select: {
        id: true,
        user_id: true,
        title: true,
        deleted_at: true,
      },
    });

    if (!existingAd) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      );
    }

    if (existingAd.deleted_at) {
      return NextResponse.json(
        { success: false, message: 'Ad already deleted' },
        { status: 400 }
      );
    }

    if (existingAd.user_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to delete this ad',
        },
        { status: 403 }
      );
    }

    // Soft delete the ad
    await prisma.ads.update({
      where: { id: adId },
      data: {
        deleted_at: new Date(),
        status: 'deleted',
      },
    });

    // Remove from Typesense index (async, don't block response)
    removeAdFromIndex(adId).catch((error) =>
      console.error('Failed to remove ad from Typesense:', error)
    );

    console.log(`✅ Deleted ad ID: ${adId} (${existingAd.title})`);

    return NextResponse.json(
      {
        success: true,
        message: 'Ad deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Ad delete error:', error);

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
        message: 'Failed to delete ad',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
