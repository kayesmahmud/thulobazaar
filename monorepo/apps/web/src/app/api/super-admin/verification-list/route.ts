import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/jwt';

const BUSINESS_STATUSES = ['approved', 'verified'];

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'business'; // 'business' | 'individual'
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '200', 10);

    const whereBase: any = {};
    if (search) {
      whereBase.AND = [
        {
          OR: [
            { full_name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (type === 'individual') {
      const users = await prisma.users.findMany({
        where: {
          ...whereBase,
          individual_verified: true,
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          shop_slug: true,
          individual_verified_at: true,
          created_at: true,
        },
        orderBy: { individual_verified_at: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        data: users.map((u) => ({
          id: u.id,
          user_id: u.id,
          type: 'individual' as const,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          shop_slug: u.shop_slug,
          status: 'approved',
          created_at: u.individual_verified_at || u.created_at,
        })),
      });
    }

    // Default: business
    const users = await prisma.users.findMany({
      where: {
        ...whereBase,
        business_verification_status: { in: BUSINESS_STATUSES },
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        shop_slug: true,
        business_name: true,
        business_category: true,
        business_verification_status: true,
        business_verified_at: true,
        created_at: true,
      },
      orderBy: { business_verified_at: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        user_id: u.id,
        type: 'business' as const,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        business_name: u.business_name || u.full_name,
        business_category: u.business_category,
        status: u.business_verification_status,
        shop_slug: u.shop_slug,
        created_at: u.business_verified_at || u.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Super admin verification list error:', error);

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
      { success: false, message: 'Failed to fetch verification list' },
      { status: 500 }
    );
  }
}
