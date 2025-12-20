import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * POST /api/profile/cover
 * Forward cover photo upload to Express API
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

    const response = await fetch(`${API_URL}/api/profile/cover`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Cover upload proxy error:', error);
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
 * Forward cover photo deletion to Express API
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/api/profile/cover`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Cover deletion proxy error:', error);
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
