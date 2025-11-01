import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/admin/ads/:id/restore
 * Restore a soft-deleted ad
 * Requires: Editor or Super Admin role
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

    // Restore ad - clear deletion fields
    const ad = await prisma.ads.update({
      where: {
        id: adId,
        deleted_at: { not: null },
      },
      data: {
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
        updated_at: new Date(),
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    console.log(`♻️ Ad ${adId} restored by editor ${editor.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Ad restored successfully',
        data: {
          id: ad.id,
          title: ad.title,
          status: ad.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Ad restoration error:', error);

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
          message: 'Deleted ad not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to restore ad',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
