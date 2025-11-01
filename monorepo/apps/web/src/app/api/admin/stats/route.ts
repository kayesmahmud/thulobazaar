import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/stats
 * Get dashboard statistics for editor dashboard
 * Requires: Editor or Super Admin role
 *
 * Returns:
 * - totalAds: Total ads count (not deleted)
 * - pendingAds: Pending ads count
 * - activeAds: Approved ads count
 * - rejectedAds: Rejected ads count
 * - pendingVerifications: Pending business + individual verifications count
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    // Get ad counts
    const [totalAds, pendingAds, activeAds, rejectedAds] = await Promise.all([
      prisma.ads.count({ where: { deleted_at: null } }),
      prisma.ads.count({ where: { status: 'pending', deleted_at: null } }),
      prisma.ads.count({ where: { status: 'approved', deleted_at: null } }),
      prisma.ads.count({ where: { status: 'rejected', deleted_at: null } }),
    ]);

    // Get pending verifications count (business + individual)
    const [pendingBusinessVerifications, pendingIndividualVerifications] = await Promise.all([
      prisma.business_verification_requests.count({ where: { status: 'pending' } }),
      prisma.individual_verification_requests.count({ where: { status: 'pending' } }),
    ]);

    const pendingVerifications = pendingBusinessVerifications + pendingIndividualVerifications;

    return NextResponse.json(
      {
        success: true,
        data: {
          totalAds,
          pendingAds,
          activeAds,
          rejectedAds,
          pendingVerifications,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin stats fetch error:', error);

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
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
