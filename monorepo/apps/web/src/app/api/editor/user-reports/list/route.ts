import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const type = searchParams.get('type') || 'all'; // 'all' | 'suspended' | 'rejected'
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const where: any = {};

    if (type === 'suspended') {
      where.is_active = false;
    } else if (type === 'rejected') {
      where.business_verification_status = 'rejected';
    } else {
      // Default to "all" - both suspended and rejected
      where.OR = [{ is_active: false }, { business_verification_status: 'rejected' }];
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

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          is_active: true,
          business_verification_status: true,
          created_at: true,
          shop_slug: true,
          _count: { select: { ads_ads_user_idTousers: true } },
        },
        orderBy: { updated_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.users.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone,
        isActive: u.is_active,
        businessVerificationStatus: u.business_verification_status,
        createdAt: u.created_at,
        shopSlug: u.shop_slug,
        adCount: u._count.ads_ads_user_idTousers,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('User reports list error:', error);

    if (error?.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
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
      { success: false, message: 'Failed to fetch user reports' },
      { status: 500 }
    );
  }
}
