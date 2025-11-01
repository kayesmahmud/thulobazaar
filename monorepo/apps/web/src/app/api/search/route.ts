import { NextRequest, NextResponse } from 'next/server';
import { typesenseClient, COLLECTION_NAME, buildFilterQuery } from '@/lib/typesense';

/**
 * GET /api/search
 * Search ads using Typesense
 *
 * Query params:
 * - q: Search query string
 * - category: Category ID
 * - parentCategoryId: Parent category ID (includes all subcategories)
 * - location: Location ID
 * - minPrice: Minimum price
 * - maxPrice: Maximum price
 * - condition: Condition filter
 * - featured: Show only featured ads
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sortBy: Sort order (default: 'created_at:desc')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = searchParams.get('q') || '*';
    const category = searchParams.get('category');
    const parentCategoryId = searchParams.get('parentCategoryId');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const featured = searchParams.get('featured');
    const sortBy = searchParams.get('sortBy') || 'created_at:desc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);

    // Build filter query
    const filterBy = await buildFilterQuery({
      category: category ? parseInt(category) : undefined,
      parentCategoryId: parentCategoryId ? parseInt(parentCategoryId) : undefined,
      location: location ? parseInt(location) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      condition: condition || undefined,
      featured: featured === 'true',
    });

    // Search parameters
    const searchParameters: any = {
      q: query,
      query_by: 'title,description,category_name,location_name,seller_name',
      filter_by: filterBy,
      facet_by: 'category_name,location_name,condition,price',
      sort_by: sortBy,
      page,
      per_page: limit,
      highlight_full_fields: 'title,description',
    };

    // Execute search
    const results = await typesenseClient
      .collections(COLLECTION_NAME)
      .documents()
      .search(searchParameters);

    // Transform results
    const ads = (results.hits || []).map((hit: any) => {
      const doc = hit.document;
      return {
        id: parseInt(doc.id),
        title: doc.title,
        description: doc.description,
        price: doc.price,
        condition: doc.condition,
        categoryId: doc.category_id,
        categoryName: doc.category_name,
        locationId: doc.location_id,
        locationName: doc.location_name,
        sellerName: doc.seller_name,
        isFeatured: doc.is_featured,
        isActive: doc.is_active,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
        primaryImage: doc.primary_image,
        images: doc.images,
        // Add search highlights if available
        highlights: hit.highlights || [],
      };
    });

    const totalPages = Math.ceil((results.found || 0) / limit);

    return NextResponse.json(
      {
        success: true,
        data: ads,
        pagination: {
          total: results.found || 0,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        facets: results.facet_counts || [],
        searchTimeMs: results.search_time_ms || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Search failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
