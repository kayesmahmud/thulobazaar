import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/admin/locations/:id
 * Update a location
 * Requires: Editor or Super Admin role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { id } = await params;
    const locationId = parseInt(id);
    const body = await request.json();
    const { name, type, parent_id, slug } = body;

    if (isNaN(locationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid location ID' },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingLocation = await prisma.locations.findUnique({
      where: { id: locationId },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (slug) updateData.slug = slug;
    if (parent_id !== undefined) {
      updateData.parent_id = parent_id ? parseInt(parent_id) : null;
    }

    // Update location
    const location = await prisma.locations.update({
      where: { id: locationId },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: location.id,
          name: location.name,
          type: location.type,
          slug: location.slug,
          parentId: location.parent_id,
        },
        message: 'Location updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Location update error:', error);

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
        message: 'Failed to update location',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/locations/:id
 * Delete a location
 * Requires: Editor or Super Admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { id } = await params;
    const locationId = parseInt(id);

    if (isNaN(locationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid location ID' },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingLocation = await prisma.locations.findUnique({
      where: { id: locationId },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if location has ads
    const adsCount = await prisma.ads.count({
      where: { location_id: locationId, deleted_at: null },
    });

    if (adsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete location with ${adsCount} active ads`,
        },
        { status: 400 }
      );
    }

    // Check if location has child locations
    const childrenCount = await prisma.locations.count({
      where: { parent_id: locationId },
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete location with ${childrenCount} child locations`,
        },
        { status: 400 }
      );
    }

    // Delete location
    await prisma.locations.delete({
      where: { id: locationId },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Location deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Location deletion error:', error);

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
        message: 'Failed to delete location',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
