import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/ads/[id]/mark-sold
 * Mark an ad as sold - changes status to 'sold', removes from active listings
 * Users can mark their own approved ads as sold
 */
export async function POST(
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
        status: true,
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
        { success: false, message: 'Cannot mark deleted ad as sold' },
        { status: 400 }
      );
    }

    if (existingAd.user_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to mark this ad as sold',
        },
        { status: 403 }
      );
    }

    if (existingAd.status === 'sold') {
      return NextResponse.json(
        { success: false, message: 'Ad is already marked as sold' },
        { status: 400 }
      );
    }

    // Update ad status to sold
    const updatedAd = await prisma.ads.update({
      where: { id: adId },
      data: {
        status: 'sold',
        updated_at: new Date(),
      },
    });

    // Log this action in review history (actor is the user who owns the ad)
    await prisma.ad_review_history.create({
      data: {
        ad_id: adId,
        action: 'marked_as_sold',
        actor_id: userId,
        actor_type: 'user',
        notes: 'User marked their ad as sold',
      },
    });

    console.log(`✅ User ${userId} marked ad ${adId} (${existingAd.title}) as sold`);

    return NextResponse.json(
      {
        success: true,
        message: 'Ad marked as sold successfully',
        data: {
          id: updatedAd.id,
          title: updatedAd.title,
          status: updatedAd.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mark as sold error:', error);

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
        message: 'Failed to mark ad as sold',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
