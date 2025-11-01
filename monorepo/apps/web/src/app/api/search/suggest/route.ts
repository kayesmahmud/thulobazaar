import { NextRequest, NextResponse } from 'next/server';
import { typesenseClient, COLLECTION_NAME } from '@/lib/typesense';

/**
 * GET /api/search/suggest
 * Auto-complete/suggestions endpoint
 *
 * Query params:
 * - q: Search query string (minimum 2 characters)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          success: true,
          suggestions: [],
        },
        { status: 200 }
      );
    }

    // Search for suggestions
    const searchParameters: any = {
      q: query,
      query_by: 'title,category_name',
      filter_by: 'is_active:=true',
      per_page: 5,
      highlight_full_fields: 'title',
    };

    const results = await typesenseClient
      .collections(COLLECTION_NAME)
      .documents()
      .search(searchParameters);

    // Extract unique titles and category names for suggestions
    const suggestions = new Set<string>();

    (results.hits || []).forEach((hit: any) => {
      const doc = hit.document;

      if (doc.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(doc.title);
      }

      if (doc.category_name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(doc.category_name);
      }
    });

    return NextResponse.json(
      {
        success: true,
        suggestions: Array.from(suggestions).slice(0, 8),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get suggestions',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
