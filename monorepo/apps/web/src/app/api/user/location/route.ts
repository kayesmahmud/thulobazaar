import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/user/location
 * Get user's default location with full hierarchy info
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        location_id: true,
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            parent_id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        locationId: user.location_id,
        location: user.locations,
      },
    });
  } catch (error: any) {
    console.error('Get user location error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to get user location' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/location
 * Update user's default location
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();
    const { locationSlug } = body;

    let locationId: number | null = null;

    if (locationSlug) {
      // Find location by slug
      const location = await prisma.locations.findUnique({
        where: { slug: locationSlug },
        select: { id: true },
      });

      if (!location) {
        return NextResponse.json(
          { success: false, message: 'Location not found' },
          { status: 404 }
        );
      }

      locationId = location.id;
    }

    // Update user's default location
    await prisma.users.update({
      where: { id: userId },
      data: { location_id: locationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error: any) {
    console.error('Update user location error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update location' },
      { status: 500 }
    );
  }
}
