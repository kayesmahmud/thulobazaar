/**
 * POST /api/support/upload
 * Thin proxy to the Express support photo upload, which enforces the
 * per-sender photo cap (5 per 10 minutes) and the image pipeline.
 */
import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const response = await fetch(`${API_URL}/api/support/upload`, {
      method: 'POST',
      headers: { Authorization: auth },
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Support upload proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 502 }
    );
  }
}
