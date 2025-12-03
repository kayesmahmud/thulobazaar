import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import {
  isIndividualVerificationActive,
  isBusinessVerificationActive,
  getDaysUntilExpiry,
  isVerificationExpiringSoon,
} from '@/lib/verificationUtils';

/**
 * GET /api/verification/status
 * Get unified verification status (business + individual)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    // Get user account type and verification status
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        account_type: true,
        business_verification_status: true,
        business_verification_expires_at: true,
        individual_verified: true,
        individual_verification_expires_at: true,
        business_name: true,
        full_name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check active status considering expiry
    const businessActive = isBusinessVerificationActive(user);
    const individualActive = isIndividualVerificationActive(user);

    // Initialize response
    const response: any = {
      success: true,
      data: {
        accountType: user.account_type,
        businessVerification: {
          status: user.business_verification_status || 'none',
          verified: user.business_verification_status === 'approved',
          isActive: businessActive,
          businessName: user.business_name || null,
          expiresAt: user.business_verification_expires_at || null,
          daysRemaining: getDaysUntilExpiry(user, 'business'),
          isExpiringSoon: isVerificationExpiringSoon(user, 'business'),
        },
        individualVerification: {
          verified: user.individual_verified || false,
          isActive: individualActive,
          fullName: user.full_name || null,
          expiresAt: user.individual_verification_expires_at || null,
          daysRemaining: getDaysUntilExpiry(user, 'individual'),
          isExpiringSoon: isVerificationExpiringSoon(user, 'individual'),
        },
      },
    };

    // Get pending business verification requests (if business account)
    if (user.account_type === 'business') {
      const businessRequest = await prisma.business_verification_requests.findFirst({
        where: {
          user_id: userId,
          status: {
            in: ['pending', 'rejected'],
          },
        },
        select: {
          id: true,
          status: true,
          business_name: true,
          created_at: true,
          rejection_reason: true,
        },
        orderBy: { created_at: 'desc' },
      });

      if (businessRequest) {
        response.data.businessVerification.hasRequest = true;
        response.data.businessVerification.request = {
          id: businessRequest.id,
          status: businessRequest.status,
          businessName: businessRequest.business_name,
          createdAt: businessRequest.created_at,
          rejectionReason: businessRequest.rejection_reason,
        };
      } else {
        response.data.businessVerification.hasRequest = false;
      }
    }

    // Get pending individual verification requests
    const individualRequest = await prisma.individual_verification_requests.findFirst({
      where: {
        user_id: userId,
        status: {
          in: ['pending', 'rejected'],
        },
      },
      select: {
        id: true,
        status: true,
        full_name: true,
        id_document_type: true,
        created_at: true,
        rejection_reason: true,
      },
      orderBy: { created_at: 'desc' },
    });

    if (individualRequest) {
      response.data.individualVerification.hasRequest = true;
      response.data.individualVerification.request = {
        id: individualRequest.id,
        status: individualRequest.status,
        fullName: individualRequest.full_name,
        idDocumentType: individualRequest.id_document_type,
        createdAt: individualRequest.created_at,
        rejectionReason: individualRequest.rejection_reason,
      };
    } else {
      response.data.individualVerification.hasRequest = false;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Verification status error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch verification status',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
