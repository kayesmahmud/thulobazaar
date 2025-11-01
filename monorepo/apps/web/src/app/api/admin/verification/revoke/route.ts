import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * POST /api/admin/verification/revoke
 * Revoke individual or business verification (for violations)
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - userId: User ID
 * - type: 'individual' | 'business'
 * - reason: Reason for revocation
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const body = await request.json();
    const { userId, type, reason } = body;

    if (!userId || !type || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: 'userId, type, and reason are required',
        },
        { status: 400 }
      );
    }

    if (type === 'individual') {
      // Revoke individual verification
      await prisma.users.updateMany({
        where: {
          id: userId,
          individual_verified: true,
        },
        data: {
          individual_verified: false,
          individual_verification_expires_at: null,
          verified_seller_name: null,
        },
      });

      console.log('Revoked individual verification:', {
        userId,
        reason,
        editorId: editor.userId,
      });

      return NextResponse.json(
        {
          success: true,
          message:
            'Individual verification revoked successfully. User can now edit their name.',
        },
        { status: 200 }
      );
    } else if (type === 'business') {
      // Revoke business verification
      await prisma.users.updateMany({
        where: {
          id: userId,
          business_verification_status: 'approved',
        },
        data: {
          business_verification_status: 'revoked',
          business_verification_expires_at: null,
          account_type: 'individual',
        },
      });

      console.log('Revoked business verification:', {
        userId,
        reason,
        editorId: editor.userId,
      });

      return NextResponse.json(
        {
          success: true,
          message:
            'Business verification revoked successfully. User reverted to individual account.',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid type. Must be "individual" or "business"',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Revoke verification error:', error);

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
        message: 'Failed to revoke verification',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
