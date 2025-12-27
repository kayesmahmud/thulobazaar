import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/locations/slug/:slug
 * Get a location by its slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Slug is required' },
        { status: 400 }
      );
    }

    const location = await prisma.locations.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        type: true,
        parent_id: true,
        slug: true,
        latitude: true,
        longitude: true,
        created_at: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    // Transform to camelCase
    const transformedLocation = {
      id: location.id,
      name: location.name,
      type: location.type,
      parentId: location.parent_id,
      slug: location.slug,
      latitude: location.latitude ? parseFloat(location.latitude.toString()) : null,
      longitude: location.longitude ? parseFloat(location.longitude.toString()) : null,
      createdAt: location.created_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedLocation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Location by slug fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch location',
      },
      { status: 500 }
    );
  }
}
