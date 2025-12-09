import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/jwt';

const BUSINESS_APPROVED = ['approved', 'verified'];

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 2000);
    const status = searchParams.get('status') || 'all'; // all | regular | individual | business
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (status === 'business') {
      where.business_verification_status = { in: BUSINESS_APPROVED };
    } else if (status === 'individual') {
      where.individual_verified = true;
    } else if (status === 'regular') {
      where.OR = [
        { business_verification_status: null },
        { business_verification_status: { notIn: BUSINESS_APPROVED } },
      ];
      where.individual_verified = false;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { full_name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        business_verification_status: true,
        individual_verified: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone,
        businessVerificationStatus: u.business_verification_status,
        individualVerified: u.individual_verified,
        createdAt: u.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Super-admin users list error:', error);

    if (error?.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Super admin access required' },
        { status: 401 }
      );
    }

    if (error?.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
