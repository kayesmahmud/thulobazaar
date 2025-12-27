/**
 * Message Image Upload API
 * POST /api/messages/upload - Forward to Express API
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * POST - Upload image for messaging
 * Forwards to Express API
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    // Forward to Express API
    const response = await fetch(`${API_URL}/api/messages/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Message upload proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload image',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
