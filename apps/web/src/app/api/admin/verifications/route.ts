import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';

/**
 * GET /api/admin/verifications
 * Get verification requests (business + individual)
 * Requires: Editor or Super Admin role
 *
 * Query params:
 * - status: 'pending' | 'rejected' | 'approved' | 'all' (default: 'pending')
 * - type: 'individual' | 'business' | 'all' (default: 'all')
 * - search: matches applicant email / name, and business name (case-insensitive)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin/editor
    await requireEditor(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'pending';
    const typeParam = searchParams.get('type') || 'all';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;

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

    // Optional search across the applicant's identity fields
    const search = searchParams.get('search')?.trim() || '';
    const contains = { contains: search, mode: 'insensitive' as const };
    const businessWhere = search
      ? {
          ...statusFilter,
          OR: [
            { business_name: contains },
            {
              users_business_verification_requests_user_idTousers: {
                OR: [{ email: contains }, { full_name: contains }],
              },
            },
          ],
        }
      : statusFilter;
    const individualWhere = search
      ? {
          ...statusFilter,
          OR: [
            { full_name: contains },
            {
              users_individual_verification_requests_user_idTousers: {
                OR: [{ email: contains }, { full_name: contains }],
              },
            },
          ],
        }
      : statusFilter;

    // Count totals for pagination
    let businessCount = 0;
    let individualCount = 0;
    if (typeParam === 'all' || typeParam === 'business') {
      businessCount = await prisma.business_verification_requests.count({ where: businessWhere });
    }
    if (typeParam === 'all' || typeParam === 'individual') {
      individualCount = await prisma.individual_verification_requests.count({ where: individualWhere });
    }
    const total = businessCount + individualCount;
    const totalPages = Math.ceil(total / limit);

    // For combined queries, we need to figure out which records to fetch
    // based on the page/limit across both tables (sorted by created_at desc)
    // Strategy: fetch from both tables with pagination applied to the combined result
    // For simplicity with two tables, fetch enough from each to cover the page window
    const businessSelect = {
      id: true,
      user_id: true,
      business_name: true,
      business_license_document: true,
      business_category: true,
      business_description: true,
      business_website: true,
      business_phone: true,
      business_address: true,
      document_type: true,
      document_number: true,
      status: true,
      created_at: true,
      duration_days: true,
      payment_amount: true,
      payment_reference: true,
      payment_status: true,
      rejection_reason: true,
      reviewed_at: true,
      users_business_verification_requests_user_idTousers: {
        select: {
          email: true,
          full_name: true,
          shop_slug: true,
          custom_shop_slug: true,
        },
      },
      users_business_verification_requests_reviewed_byTousers: {
        select: { full_name: true, role: true },
      },
    };

    const individualSelect = {
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
      reviewed_at: true,
      users_individual_verification_requests_user_idTousers: {
        select: {
          email: true,
          shop_slug: true,
          custom_shop_slug: true,
        },
      },
      users_individual_verification_requests_reviewed_byTousers: {
        select: { full_name: true, role: true },
      },
    };

    // Get business verifications (if requested)
    let businessVerifications: any[] = [];
    if (typeParam === 'all' || typeParam === 'business') {
      // When combining two tables, fetch up to skip+limit from each to ensure correct pagination
      const fetchLimit = typeParam === 'all' ? skip + limit : limit;
      const fetchSkip = typeParam === 'all' ? 0 : skip;
      businessVerifications = await prisma.business_verification_requests.findMany({
        where: businessWhere,
        select: businessSelect,
        orderBy: { created_at: 'desc' },
        take: fetchLimit,
        skip: fetchSkip,
      });
    }

    // Get individual verifications (if requested)
    let individualVerifications: any[] = [];
    if (typeParam === 'all' || typeParam === 'individual') {
      const fetchLimit = typeParam === 'all' ? skip + limit : limit;
      const fetchSkip = typeParam === 'all' ? 0 : skip;
      individualVerifications = await prisma.individual_verification_requests.findMany({
        where: individualWhere,
        select: individualSelect,
        orderBy: { created_at: 'desc' },
        take: fetchLimit,
        skip: fetchSkip,
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
      documentType: bv.document_type,
      documentNumber: bv.document_number,
      status: bv.status,
      createdAt: bv.created_at,
      durationDays: bv.duration_days,
      paymentAmount: bv.payment_amount ? parseFloat(bv.payment_amount.toString()) : null,
      paymentReference: bv.payment_reference,
      paymentStatus: bv.payment_status,
      rejectionReason: bv.rejection_reason,
      email: bv.users_business_verification_requests_user_idTousers?.email,
      fullName: bv.users_business_verification_requests_user_idTousers?.full_name,
      shopSlug:
        bv.users_business_verification_requests_user_idTousers?.custom_shop_slug ||
        bv.users_business_verification_requests_user_idTousers?.shop_slug ||
        null,
      reviewedAt: bv.reviewed_at,
      reviewedByName: bv.users_business_verification_requests_reviewed_byTousers?.full_name || null,
      reviewedByRole: bv.users_business_verification_requests_reviewed_byTousers?.role || null,
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
      shopSlug:
        iv.users_individual_verification_requests_user_idTousers?.custom_shop_slug ||
        iv.users_individual_verification_requests_user_idTousers?.shop_slug ||
        null,
      reviewedAt: iv.reviewed_at,
      reviewedByName: iv.users_individual_verification_requests_reviewed_byTousers?.full_name || null,
      reviewedByRole: iv.users_individual_verification_requests_reviewed_byTousers?.role || null,
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

    // Apply pagination to the combined result when querying both types
    const paginatedData = typeParam === 'all'
      ? allVerifications.slice(skip, skip + limit)
      : allVerifications;

    return NextResponse.json(
      {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
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
      },
      { status: 500 }
    );
  }
}
