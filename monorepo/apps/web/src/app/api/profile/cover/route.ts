import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

/**
 * POST /api/profile/cover
 * Upload user cover photo
 * Requires: Authentication
 *
 * Form data:
 * - cover: File (required) - Image file (JPG, PNG, WebP, max 5MB)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('cover') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file uploaded',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only JPG, PNG, and WebP images are allowed',
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size must be less than 5MB',
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.name);
    const filename = `cover-${userId}-${uniqueSuffix}${ext}`;

    // Get old cover photo to delete it later
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { cover_photo: true },
    });

    // Save file to public/uploads/covers
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Update user's cover photo in database
    await prisma.users.update({
      where: { id: userId },
      data: {
        cover_photo: filename,
        updated_at: new Date(),
      },
    });

    // Delete old cover photo file if it exists
    if (user?.cover_photo) {
      const oldPath = path.join(uploadDir, user.cover_photo);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.log('Old cover photo file not found or already deleted');
      }
    }

    console.log(`🖼️ Cover photo uploaded for user ${userId}: ${filename}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Cover photo uploaded successfully',
        data: {
          cover_photo: filename,
          url: `/uploads/covers/${filename}`,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cover photo upload error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload cover photo',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/cover
 * Remove user cover photo
 * Requires: Authentication
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    // Get current cover photo
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { cover_photo: true },
    });

    if (!user?.cover_photo) {
      return NextResponse.json(
        {
          success: false,
          message: 'No cover photo to delete',
        },
        { status: 404 }
      );
    }

    // Remove from database
    await prisma.users.update({
      where: { id: userId },
      data: {
        cover_photo: null,
        updated_at: new Date(),
      },
    });

    // Delete file
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'covers', user.cover_photo);
    try {
      await unlink(filePath);
    } catch (err) {
      console.log('Cover photo file not found or already deleted');
    }

    console.log(`🗑️ Cover photo removed for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Cover photo removed successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cover photo removal error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove cover photo',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
