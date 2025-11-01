import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/admin/ads/:id/featured
 * Toggle featured status for an ad
 * Requires: Editor or Super Admin role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { id } = await params;
    const adId = parseInt(id);

    if (isNaN(adId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ad ID' },
        { status: 400 }
      );
    }

    // Get current featured status
    const ad = await prisma.ads.findUnique({
      where: { id: adId },
      select: { id: true, is_featured: true, title: true },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      );
    }

    // Toggle featured status
    const updatedAd = await prisma.ads.update({
      where: { id: adId },
      data: { is_featured: !ad.is_featured },
    });

    console.log(
      `Toggled featured status for ad ${adId}: ${ad.is_featured} -> ${!ad.is_featured}`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedAd.id,
          isFeatured: updatedAd.is_featured,
        },
        message: `Ad ${updatedAd.is_featured ? 'featured' : 'unfeatured'} successfully`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Toggle featured error:', error);

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

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to toggle featured status',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
