import Typesense from 'typesense';

// Initialize Typesense client
export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108'),
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 5,
});

export const COLLECTION_NAME = 'ads';

// Typesense schema for ads collection
export const adsCollectionSchema = {
  name: COLLECTION_NAME,
  fields: [
    { name: 'id', type: 'string', facet: false },
    { name: 'title', type: 'string', facet: false },
    { name: 'description', type: 'string', facet: false },
    { name: 'price', type: 'float', facet: true },
    { name: 'condition', type: 'string', facet: true },
    { name: 'category_id', type: 'int32', facet: true },
    { name: 'category_name', type: 'string', facet: true },
    { name: 'location_id', type: 'int32', facet: true },
    { name: 'location_name', type: 'string', facet: true },
    { name: 'seller_name', type: 'string', facet: false },
    { name: 'seller_phone', type: 'string', facet: false },
    { name: 'is_featured', type: 'bool', facet: true },
    { name: 'is_active', type: 'bool', facet: true },
    { name: 'created_at', type: 'int64', facet: false },
    { name: 'updated_at', type: 'int64', facet: false },
    { name: 'primary_image', type: 'string', facet: false, optional: true },
    { name: 'images', type: 'string[]', facet: false, optional: true },
  ],
  default_sorting_field: 'created_at',
};

export interface TypesenseAdDocument {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category_id: number;
  category_name: string;
  location_id: number;
  location_name: string;
  seller_name: string;
  seller_phone: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: number;
  updated_at: number;
  primary_image?: string;
  images?: string[];
}

/**
 * Index a single ad to Typesense
 */
export async function indexAd(ad: any): Promise<void> {
  try {
    const document: TypesenseAdDocument = {
      id: ad.id.toString(),
      title: ad.title,
      description: ad.description || '',
      price: parseFloat(ad.price?.toString() || '0'),
      condition: ad.condition || 'Used',
      category_id: ad.category_id,
      category_name: ad.category_name || '',
      location_id: ad.location_id,
      location_name: ad.location_name || '',
      seller_name: ad.seller_name || '',
      seller_phone: ad.seller_phone || '',
      is_featured: ad.is_featured || false,
      is_active: ad.status === 'approved',
      created_at: new Date(ad.created_at).getTime(),
      updated_at: new Date(ad.updated_at || ad.created_at).getTime(),
      primary_image: ad.primary_image || '',
      images: ad.images || [],
    };

    await typesenseClient
      .collections(COLLECTION_NAME)
      .documents()
      .upsert(document);

    console.log(`✅ Indexed ad to Typesense: ${ad.id}`);
  } catch (error) {
    console.error(`❌ Failed to index ad ${ad.id}:`, error);
    throw error;
  }
}

/**
 * Remove ad from Typesense index
 */
export async function removeAdFromIndex(adId: number): Promise<void> {
  try {
    await typesenseClient
      .collections(COLLECTION_NAME)
      .documents(adId.toString())
      .delete();

    console.log(`✅ Removed ad from Typesense: ${adId}`);
  } catch (error) {
    console.error(`❌ Failed to remove ad ${adId} from Typesense:`, error);
    // Don't throw - ad might not exist in index
  }
}

/**
 * Bulk index ads to Typesense
 */
export async function bulkIndexAds(ads: any[]): Promise<void> {
  try {
    const documents: TypesenseAdDocument[] = ads.map((ad) => ({
      id: ad.id.toString(),
      title: ad.title,
      description: ad.description || '',
      price: parseFloat(ad.price?.toString() || '0'),
      condition: ad.condition || 'Used',
      category_id: ad.category_id,
      category_name: ad.category_name || '',
      location_id: ad.location_id,
      location_name: ad.location_name || '',
      seller_name: ad.seller_name || '',
      seller_phone: ad.seller_phone || '',
      is_featured: ad.is_featured || false,
      is_active: ad.status === 'approved',
      created_at: new Date(ad.created_at).getTime(),
      updated_at: new Date(ad.updated_at || ad.created_at).getTime(),
      primary_image: ad.primary_image || '',
      images: ad.images || [],
    }));

    await typesenseClient
      .collections(COLLECTION_NAME)
      .documents()
      .import(documents, { action: 'upsert' });

    console.log(`✅ Bulk indexed ${documents.length} ads to Typesense`);
  } catch (error) {
    console.error('❌ Failed to bulk index ads:', error);
    throw error;
  }
}

/**
 * Initialize Typesense collection (create if doesn't exist)
 */
export async function initializeCollection(): Promise<void> {
  try {
    // Check if collection exists
    await typesenseClient.collections(COLLECTION_NAME).retrieve();
    console.log('✅ Typesense collection already exists');
  } catch (error: any) {
    if (error.httpStatus === 404) {
      // Create collection
      await typesenseClient.collections().create(adsCollectionSchema);
      console.log('✅ Typesense collection created successfully');
    } else {
      console.error('❌ Typesense connection error:', error);
      throw error;
    }
  }
}

/**
 * Build filter query for Typesense
 */
export async function buildFilterQuery(params: {
  category?: number;
  parentCategoryId?: number;
  location?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  featured?: boolean;
}): Promise<string> {
  const filters: string[] = ['is_active:=true'];

  const {
    category,
    parentCategoryId,
    location,
    minPrice,
    maxPrice,
    condition,
    featured,
  } = params;

  // Handle parent category (includes all subcategories)
  if (parentCategoryId) {
    const { prisma } = await import('@thulobazaar/database');

    // Get all subcategory IDs for this parent category
    const subcategories = await prisma.categories.findMany({
      where: { parent_id: parentCategoryId },
      select: { id: true },
    });

    const subcategoryIds = subcategories.map((sub) => sub.id);

    if (subcategoryIds.length > 0) {
      // Include parent category AND all subcategories
      const categoryIds = [parentCategoryId, ...subcategoryIds];
      filters.push(`category_id:[${categoryIds.join(',')}]`);
    } else {
      // No subcategories, just filter by parent category
      filters.push(`category_id:=${parentCategoryId}`);
    }
  } else if (category) {
    // Handle single category (exact match)
    filters.push(`category_id:=${category}`);
  }

  if (location) {
    filters.push(`location_id:=${location}`);
  }

  if (minPrice !== undefined && maxPrice !== undefined) {
    filters.push(`price:[${minPrice}..${maxPrice}]`);
  } else if (minPrice !== undefined) {
    filters.push(`price:>=${minPrice}`);
  } else if (maxPrice !== undefined) {
    filters.push(`price:<=${maxPrice}`);
  }

  if (condition) {
    filters.push(`condition:=${condition}`);
  }

  if (featured === true) {
    filters.push('is_featured:=true');
  }

  return filters.join(' && ');
}
