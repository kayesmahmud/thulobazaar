import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'http://localhost:5000';

/**
 * GET /api/editor/editors
 * Proxy to backend to get list of all editors
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    const response = await fetch(`${API_BASE}/api/editor/editors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching editors:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch editors' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/editor/editors
 * Proxy to backend to create a new editor
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE}/api/editor/editors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating editor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create editor' },
      { status: 500 }
    );
  }
}
