import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * DELETE /api/favorites/:adId
 * Remove ad from favorites
 *
 * Params:
 * - adId: ad ID to remove from favorites
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { adId: adIdParam } = await params;
    const adId = parseInt(adIdParam);

    // Find and delete favorite
    const favorite = await prisma.user_favorites.findFirst({
      where: {
        user_id: userId,
        ad_id: adId,
      },
      select: { id: true },
    });

    if (!favorite) {
      return NextResponse.json(
        {
          success: false,
          message: 'Favorite not found',
        },
        { status: 404 }
      );
    }

    await prisma.user_favorites.delete({
      where: { id: favorite.id },
    });

    console.log(`✅ User ${userId} removed ad ${adId} from favorites`);

    return NextResponse.json(
      {
        success: true,
        message: 'Ad removed from favorites',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Remove favorite error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove from favorites',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/favorites/:adId
 * Check if ad is in user's favorites
 *
 * Params:
 * - adId: ad ID to check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { adId: adIdParam } = await params;
    const adId = parseInt(adIdParam);

    // Check if favorited
    const favorite = await prisma.user_favorites.findFirst({
      where: {
        user_id: userId,
        ad_id: adId,
      },
      select: { id: true, created_at: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          isFavorited: !!favorite,
          favoriteId: favorite?.id || null,
          createdAt: favorite?.created_at || null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Check favorite error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check favorite status',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
