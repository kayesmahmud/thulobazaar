import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * DELETE /api/admin/ads/:id
 * Soft delete an ad
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - reason: string (optional)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const { id } = await params;
    const adId = parseInt(id);
    const body = await request.json();
    const reason = body.reason || 'No reason provided';

    // Soft delete ad
    const ad = await prisma.ads.update({
      where: {
        id: adId,
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
        deleted_by: editor.userId,
        deletion_reason: reason,
        updated_at: new Date(),
      },
      select: {
        id: true,
        title: true,
        deleted_at: true,
        deletion_reason: true,
      },
    });

    console.log(`🗑️ Ad ${adId} deleted by editor ${editor.userId}. Reason: ${reason}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Ad deleted successfully',
        data: {
          id: ad.id,
          title: ad.title,
          deletedAt: ad.deleted_at,
          deletionReason: ad.deletion_reason,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Ad deletion error:', error);

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
        message: 'Failed to delete ad',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
