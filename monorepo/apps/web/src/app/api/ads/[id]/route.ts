import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { generateSlug } from '@/lib/urls';
import { processMultipleImages, deleteImage } from '@/lib/utils';
import { indexAd, removeAdFromIndex } from '@/lib/typesense';
import { getLocationBreadcrumb } from '@/lib/location';
import {
  transformAdToResponse,
  normalizeCondition,
  parseJsonSafe,
  tryParseJson,
  errorResponse,
  successResponse,
  messageResponse,
  adSelectQuery,
  type AdWithRelations,
} from './helpers';

/**
 * GET /api/ads/:id - Get single ad with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adId = parseInt(id);

    if (isNaN(adId)) {
      return errorResponse('Invalid ad ID', 400);
    }

    const ad = await prisma.ads.findUnique({
      where: { id: adId, deleted_at: null },
      select: adSelectQuery,
    }) as AdWithRelations | null;

    if (!ad) {
      return errorResponse('Ad not found', 404);
    }

    // Increment view count (async, don't wait)
    prisma.ads
      .update({ where: { id: adId }, data: { view_count: { increment: 1 } } })
      .catch((error) => console.error('Failed to increment view count:', error));

    const locationHierarchy = ad.locations?.id
      ? await getLocationBreadcrumb(ad.locations.id)
      : [];

    return successResponse(transformAdToResponse(ad, locationHierarchy));
  } catch (error) {
    console.error('Ad fetch error:', error);
    return errorResponse('Failed to fetch ad', 500);
  }
}

/**
 * PUT /api/ads/:id - Update an ad with optional image management
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const adId = parseInt(id);

    if (isNaN(adId)) {
      return errorResponse('Invalid ad ID', 400);
    }

    const existingAd = await prisma.ads.findUnique({
      where: { id: adId },
      select: { id: true, user_id: true, title: true, status: true, custom_fields: true },
    });

    if (!existingAd) {
      return errorResponse('Ad not found', 404);
    }

    if (existingAd.user_id !== userId) {
      return errorResponse('You do not have permission to edit this ad', 403);
    }

    if (existingAd.status === 'approved') {
      return errorResponse(
        'Approved ads cannot be edited to maintain content integrity. Please contact support if you need to make changes.',
        403
      );
    }

    const formData = await request.formData();

    // Extract fields
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const priceStr = formData.get('price')?.toString();
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

    // Parse custom fields
    let customFields: Record<string, unknown> = (existingAd.custom_fields as Record<string, unknown>) || {};
    const customFieldsStr = formData.get('customFields')?.toString();
    const attributesStr = formData.get('attributes')?.toString();

    if (customFieldsStr) {
      const parsed = tryParseJson<Record<string, unknown>>(customFieldsStr);
      if (parsed === undefined) return errorResponse('Invalid customFields format', 400);
      customFields = { ...customFields, ...parsed };
    } else if (attributesStr) {
      const parsed = tryParseJson<Record<string, unknown>>(attributesStr);
      if (parsed === undefined) return errorResponse('Invalid attributes format', 400);
      customFields = { ...customFields, ...parsed };
    }

    // Extract and normalize condition
    let condition = formData.get('condition')?.toString();
    if (!condition && customFields.condition) {
      condition = customFields.condition as string;
      delete customFields.condition;
    }
    condition = normalizeCondition(condition);

    const existingImages = parseJsonSafe<string[]>(existingImagesStr, []);

    console.log('🖼️ [UPDATE AD] Ad ID:', adId);
    console.log('🖼️ [UPDATE AD] Existing images to keep:', existingImages);

    // Auto-reset rejected ads to pending
    const autoResetToPending = existingAd.status === 'rejected';
    if (autoResetToPending) {
      console.log('📝 [UPDATE AD] Rejected ad being edited - auto-resetting to pending status');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (title) {
      updateData.title = title;
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
    if (autoResetToPending && status === undefined) {
      updateData.status = 'pending';
    }

    updateData.custom_fields = {
      ...customFields,
      ...(isNegotiableStr !== undefined && { isNegotiable: isNegotiableStr === 'true' }),
      ...(latitude && { latitude: parseFloat(latitude) }),
      ...(longitude && { longitude: parseFloat(longitude) }),
      ...(googleMapsLink && { googleMapsLink }),
    };
    updateData.updated_at = new Date();

    const updatedAd = await prisma.ads.update({
      where: { id: adId },
      data: updateData,
    });

    // Handle image management
    const currentImages = await prisma.ad_images.findMany({
      where: { ad_id: adId },
      select: { id: true, file_path: true },
    });

    console.log('🖼️ [UPDATE AD] Current images in DB:', currentImages.length);

    const imagesToDelete = currentImages.filter(
      (img) =>
        !existingImages.includes(img.file_path) &&
        !existingImages.includes(`http://localhost:3333/${img.file_path}`)
    );

    console.log('🖼️ [UPDATE AD] Images to delete:', imagesToDelete.length);

    for (const img of imagesToDelete) {
      await prisma.ad_images.delete({ where: { id: img.id } });
      await deleteImage(img.file_path);
    }

    // Process new images
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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Image processing failed: ${message}`, 400);
      }

      const remainingImageCount = await prisma.ad_images.count({ where: { ad_id: adId } });
      console.log('🖼️ [UPDATE AD] Remaining images after deletion:', remainingImageCount);

      await prisma.ad_images.createMany({
        data: processedImages.map((img, index) => ({
          ad_id: adId,
          filename: img.filename,
          file_path: img.filePath,
          original_name: newImages[index]?.name || img.filename,
          file_size: img.fileSize,
          mime_type: img.mimeType,
          is_primary: remainingImageCount === 0 && index === 0,
        })),
      });
    }

    // Re-index to Typesense
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

    console.log(`✅ Updated ad: ${updatedAd.title} with ${processedImages.length} new images`);

    return NextResponse.json({
      success: true,
      message: 'Ad updated successfully',
      data: {
        id: updatedAd.id,
        title: updatedAd.title,
        price: updatedAd.price ? parseFloat(updatedAd.price.toString()) : null,
        updatedAt: updatedAd.updated_at,
        newImageCount: processedImages.length,
      },
    });
  } catch (error: unknown) {
    console.error('Ad update error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update ad', error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ads/:id - Soft delete an ad
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const adId = parseInt(id);

    if (isNaN(adId)) {
      return errorResponse('Invalid ad ID', 400);
    }

    const existingAd = await prisma.ads.findUnique({
      where: { id: adId },
      select: { id: true, user_id: true, title: true, deleted_at: true },
    });

    if (!existingAd) {
      return errorResponse('Ad not found', 404);
    }

    if (existingAd.deleted_at) {
      return errorResponse('Ad already deleted', 400);
    }

    if (existingAd.user_id !== userId) {
      return errorResponse('You do not have permission to delete this ad', 403);
    }

    await prisma.ads.update({
      where: { id: adId },
      data: { deleted_at: new Date(), deleted_by: userId, status: 'deleted' },
    });

    await prisma.ad_review_history.create({
      data: {
        ad_id: adId,
        action: 'deleted',
        actor_id: userId,
        actor_type: 'user',
        notes: 'User deleted their own ad',
      },
    });

    removeAdFromIndex(adId).catch((error) =>
      console.error('Failed to remove ad from Typesense:', error)
    );

    console.log(`✅ Deleted ad ID: ${adId} (${existingAd.title})`);

    return messageResponse('Ad deleted successfully');
  } catch (error: unknown) {
    console.error('Ad delete error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }

    return NextResponse.json(
      { success: false, message: 'Failed to delete ad', error: message },
      { status: 500 }
    );
  }
}
