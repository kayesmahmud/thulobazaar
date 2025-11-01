// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * POST /api/admin/verifications/business/:id/:action
 * Approve or reject business verification request
 *
 * Params:
 * - id: verification request ID
 * - action: 'approve' or 'reject'
 *
 * Body:
 * - reason (required for reject)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    // Authenticate admin/editor
    const admin = await requireEditor(request);

    const { id, action } = await params;
    const requestId = parseInt(id);

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid action. Must be approve or reject',
        },
        { status: 400 }
      );
    }

    // Get request body for rejection reason
    let reason: string | null = null;
    if (action === 'reject') {
      const body = await request.json();
      reason = body.reason;

      if (!reason) {
        return NextResponse.json(
          {
            success: false,
            message: 'Rejection reason is required',
          },
          { status: 400 }
        );
      }
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update verification request
    const verificationRequest = await prisma.business_verification_requests.update({
      where: {
        id: requestId,
        status: 'pending',
      },
      data: {
        status: newStatus,
        rejection_reason: action === 'reject' ? reason : null,
        reviewed_by: admin.userId,
        reviewed_at: new Date(),
      },
      select: {
        id: true,
        user_id: true,
        business_name: true,
        status: true,
      },
    });

    // If approved, update user's profile to business account
    if (action === 'approve') {
      // Generate unique shop slug
      const baseSlug = verificationRequest.business_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check for slug collision
      let shopSlug = baseSlug;
      let counter = 1;

      while (true) {
        const existingUser = await prisma.users.findFirst({
          where: { shop_slug: shopSlug },
          select: { id: true },
        });

        if (!existingUser) {
          break;
        }

        counter++;
        shopSlug = `${baseSlug}-${counter}`;
      }

      // Update user to business account
      await prisma.users.update({
        where: { id: verificationRequest.user_id },
        data: {
          account_type: 'business',
          business_verification_status: 'approved',
          business_verified_at: new Date(),
          business_name: verificationRequest.business_name,
          shop_slug: shopSlug,
          full_name: verificationRequest.business_name,
        },
      });

      console.log(
        `✅ Business verification approved: ${verificationRequest.business_name} (ID: ${requestId})`
      );
      console.log(`   Shop URL: /shop/${shopSlug}`);
      console.log(`   Profile name updated and locked to: ${verificationRequest.business_name}`);
    } else {
      console.log(
        `❌ Business verification rejected: Request ID ${requestId}, Reason: ${reason}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Business verification ${action}d successfully`,
        data: {
          id: verificationRequest.id,
          userId: verificationRequest.user_id,
          businessName: verificationRequest.business_name,
          status: verificationRequest.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Business verification review error:', error);

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
          message: 'Verification request not found or already processed',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process verification request',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
