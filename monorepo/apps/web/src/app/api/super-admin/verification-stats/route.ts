import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/jwt';

/**
 * GET /api/super-admin/verification-stats
 * Read-only verification stats for Super Admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const [pendingBusiness, pendingIndividual, verifiedBusiness, verifiedIndividual, suspendedOrRejected] =
      await Promise.all([
        prisma.business_verification_requests.count({
          where: { status: { in: ['pending', 'pending_payment'] } },
        }),
        prisma.individual_verification_requests.count({
          where: { status: { in: ['pending', 'pending_payment'] } },
        }),
        prisma.users.count({
          where: {
            business_verification_status: { in: ['approved', 'verified'] },
          },
        }),
        prisma.users.count({
          where: { individual_verified: true },
        }),
        prisma.users.count({
          where: {
            OR: [
              { is_active: false },
              { business_verification_status: 'rejected' },
            ],
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        pending: pendingBusiness + pendingIndividual,
        verifiedBusiness,
        verifiedIndividual,
        suspendedRejected: suspendedOrRejected,
      },
    });
  } catch (error: any) {
    console.error('Super admin verification stats error:', error);

    if (error?.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Super admin access required' },
        { status: 401 }
      );
    }

    if (error?.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch verification stats' },
      { status: 500 }
    );
  }
}
