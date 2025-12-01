/**
 * Message Image Upload API
 * POST /api/messages/upload - Upload an image for messaging
 *
 * Restrictions:
 * - Max file size: 5MB
 * - Allowed formats: JPEG, PNG, GIF, WebP
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/jwt';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * POST - Upload image for messaging
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await requireAuth(request);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const conversationId = formData.get('conversationId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Get file extension
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `msg_${userId}_${conversationId}_${timestamp}_${randomStr}${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    // Return the public URL
    const imageUrl = `/uploads/messages/${filename}`;

    console.log(`✅ Image uploaded: ${imageUrl} by user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        filename,
        originalName,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
