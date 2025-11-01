import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/admin/ads/:id/reject
 * Reject an ad
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - reason: string (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const { id } = await params;
    const adId = parseInt(id);
    const body = await request.json();
    const reason = body.reason || '';

    // Update ad status
    const ad = await prisma.ads.update({
      where: {
        id: adId,
        deleted_at: null,
      },
      data: {
        status: 'rejected',
        reviewed_by: editor.userId,
        reviewed_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    console.log(`❌ Ad ${adId} rejected by editor ${editor.userId}. Reason: ${reason}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Ad rejected successfully',
        data: {
          id: ad.id,
          title: ad.title,
          status: ad.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Ad rejection error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          message: 'Ad not found or already deleted',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reject ad',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
