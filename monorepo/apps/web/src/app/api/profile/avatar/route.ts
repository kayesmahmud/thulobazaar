import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

/**
 * POST /api/profile/avatar
 * Upload user avatar
 * Requires: Authentication
 *
 * Form data:
 * - avatar: File (required) - Image file (JPG, PNG, WebP, max 2MB)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

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

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size must be less than 2MB',
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.name);
    const filename = `avatar-${userId}-${uniqueSuffix}${ext}`;

    // Get old avatar to delete it later
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Save file to public/uploads/avatars
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Update user's avatar in database
    await prisma.users.update({
      where: { id: userId },
      data: {
        avatar: filename,
        updated_at: new Date(),
      },
    });

    // Delete old avatar file if it exists
    if (user?.avatar) {
      const oldPath = path.join(uploadDir, user.avatar);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.log('Old avatar file not found or already deleted');
      }
    }

    console.log(`🖼️ Avatar uploaded for user ${userId}: ${filename}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: filename,
          url: `/uploads/avatars/${filename}`,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Avatar upload error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload avatar',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Remove user avatar
 * Requires: Authentication
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    // Get current avatar
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user?.avatar) {
      return NextResponse.json(
        {
          success: false,
          message: 'No avatar to delete',
        },
        { status: 404 }
      );
    }

    // Remove from database
    await prisma.users.update({
      where: { id: userId },
      data: {
        avatar: null,
        updated_at: new Date(),
      },
    });

    // Delete file
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'avatars', user.avatar);
    try {
      await unlink(filePath);
    } catch (err) {
      console.log('Avatar file not found or already deleted');
    }

    console.log(`🗑️ Avatar removed for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Avatar removed successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Avatar removal error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove avatar',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
