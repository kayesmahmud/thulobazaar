// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * POST /api/admin/verifications/individual/:id/:action
 * Approve or reject individual verification request
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
    const verificationRequest = await prisma.individual_verification_requests.update({
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
        full_name: true,
        status: true,
        duration_days: true,
        payment_amount: true,
        payment_reference: true,
      },
    });

    // If approved, update user's individual_verified status
    if (action === 'approve') {
      // Generate unique shop slug
      const baseSlug = verificationRequest.full_name
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

      // Calculate expiry date based on duration_days
      const durationDays = verificationRequest.duration_days || 365; // Default to 1 year
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // Update user
      await prisma.users.update({
        where: { id: verificationRequest.user_id },
        data: {
          individual_verified: true,
          individual_verified_at: new Date(),
          individual_verification_expires_at: expiresAt,
          full_name: verificationRequest.full_name,
          seller_slug: shopSlug,
          shop_slug: shopSlug,
        },
      });

      console.log(
        `✅ Individual verification approved: ${verificationRequest.full_name} (ID: ${requestId})`
      );
      console.log(`   Shop URL: /shop/${shopSlug}`);
      console.log(`   Duration: ${durationDays} days (expires: ${expiresAt.toISOString()})`);
      console.log(`   Payment: NPR ${verificationRequest.payment_amount || 'N/A'} (Ref: ${verificationRequest.payment_reference || 'N/A'})`);
      console.log(`   Profile name updated and locked to: ${verificationRequest.full_name}`);
    } else {
      console.log(
        `❌ Individual verification rejected: Request ID ${requestId}, Reason: ${reason}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Individual verification ${action}d successfully`,
        data: {
          id: verificationRequest.id,
          userId: verificationRequest.user_id,
          fullName: verificationRequest.full_name,
          status: verificationRequest.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Individual verification review error:', error);

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
