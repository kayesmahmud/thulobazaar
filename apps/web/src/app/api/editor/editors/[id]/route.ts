import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'http://localhost:5000';

/**
 * GET /api/editor/editors/[id]
 * Get a specific editor by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');

    const response = await fetch(`${API_BASE}/api/editor/editors/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching editor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch editor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/editor/editors/[id]
 * Update an editor (supports both JSON and FormData for file uploads)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type') || '';

    let response: Response;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (file uploads)
      const formData = await request.formData();

      response = await fetch(`${API_BASE}/api/editor/editors/${id}`, {
        method: 'PUT',
        headers: {
          ...(authHeader && { Authorization: authHeader }),
        },
        body: formData,
      });
    } else {
      // Handle JSON
      const body = await request.json();

      response = await fetch(`${API_BASE}/api/editor/editors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating editor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update editor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/editor/editors/[id]
 * Delete an editor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');

    const response = await fetch(`${API_BASE}/api/editor/editors/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting editor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete editor' },
      { status: 500 }
    );
  }
}
