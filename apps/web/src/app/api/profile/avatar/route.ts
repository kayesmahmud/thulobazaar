import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * POST /api/profile/avatar
 * Forward avatar upload to Express API
 */
export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request headers
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the form data from the request
    const formData = await request.formData();

    // Forward the request to Express API
    const response = await fetch(`${API_URL}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Avatar upload proxy error:', error);
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
 * Forward avatar deletion to Express API
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

    const response = await fetch(`${API_URL}/api/profile/avatar`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Avatar deletion proxy error:', error);
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
