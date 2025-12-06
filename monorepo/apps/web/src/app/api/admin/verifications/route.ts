import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/verifications
 * Get verification requests (business + individual)
 * Requires: Editor or Super Admin role
 *
 * Query params:
 * - status: 'pending' | 'rejected' | 'approved' | 'all' (default: 'pending')
 * - type: 'individual' | 'business' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin/editor
    await requireEditor(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'pending';
    const typeParam = searchParams.get('type') || 'all';

    // Build status filter
    let statusFilter: any = {};
    if (statusParam === 'all') {
      statusFilter = {}; // No filter, get all
    } else if (statusParam === 'approved') {
      statusFilter = { status: 'approved' };
    } else if (statusParam === 'rejected') {
      statusFilter = { status: 'rejected' };
    } else {
      statusFilter = { status: 'pending' };
    }

    // Get business verifications (if requested)
    let businessVerifications: any[] = [];
    if (typeParam === 'all' || typeParam === 'business') {
      businessVerifications = await prisma.business_verification_requests.findMany({
        where: statusFilter,
        select: {
          id: true,
          user_id: true,
          business_name: true,
          business_license_document: true,
          business_category: true,
          business_description: true,
          business_website: true,
          business_phone: true,
          business_address: true,
          status: true,
          created_at: true,
          duration_days: true,
          payment_amount: true,
          payment_reference: true,
          payment_status: true,
          rejection_reason: true,
          users_business_verification_requests_user_idTousers: {
            select: {
              email: true,
              full_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
    }

    // Get individual verifications (if requested)
    let individualVerifications: any[] = [];
    if (typeParam === 'all' || typeParam === 'individual') {
      individualVerifications = await prisma.individual_verification_requests.findMany({
        where: statusFilter,
        select: {
          id: true,
          user_id: true,
          full_name: true,
          id_document_type: true,
          id_document_number: true,
          id_document_front: true,
          id_document_back: true,
          selfie_with_id: true,
          status: true,
          created_at: true,
          duration_days: true,
          payment_amount: true,
          payment_reference: true,
          payment_status: true,
          rejection_reason: true,
          users_individual_verification_requests_user_idTousers: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
    }

    // Transform business verifications
    const businessData = businessVerifications.map((bv) => ({
      id: bv.id,
      userId: bv.user_id,
      businessName: bv.business_name,
      businessLicenseDocument: bv.business_license_document,
      businessCategory: bv.business_category,
      businessDescription: bv.business_description,
      businessWebsite: bv.business_website,
      businessPhone: bv.business_phone,
      businessAddress: bv.business_address,
      status: bv.status,
      createdAt: bv.created_at,
      durationDays: bv.duration_days,
      paymentAmount: bv.payment_amount ? parseFloat(bv.payment_amount.toString()) : null,
      paymentReference: bv.payment_reference,
      paymentStatus: bv.payment_status,
      rejectionReason: bv.rejection_reason,
      email: bv.users_business_verification_requests_user_idTousers?.email,
      fullName: bv.users_business_verification_requests_user_idTousers?.full_name,
      type: 'business',
    }));

    // Transform individual verifications
    const individualData = individualVerifications.map((iv) => ({
      id: iv.id,
      userId: iv.user_id,
      fullName: iv.full_name,
      idDocumentType: iv.id_document_type,
      idDocumentNumber: iv.id_document_number,
      idDocumentFront: iv.id_document_front,
      idDocumentBack: iv.id_document_back,
      selfieWithId: iv.selfie_with_id,
      status: iv.status,
      createdAt: iv.created_at,
      durationDays: iv.duration_days,
      paymentAmount: iv.payment_amount ? parseFloat(iv.payment_amount.toString()) : null,
      paymentReference: iv.payment_reference,
      paymentStatus: iv.payment_status,
      rejectionReason: iv.rejection_reason,
      email: iv.users_individual_verification_requests_user_idTousers?.email,
      type: 'individual',
    }));

    // Combine and sort by creation date
    const allVerifications = [...businessData, ...individualData].sort(
      (a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: allVerifications,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin verifications fetch error:', error);

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
        message: 'Failed to fetch verifications',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
