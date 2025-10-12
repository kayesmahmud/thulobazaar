const Typesense = require('typesense');

class SearchService {
  constructor() {
    this.client = new Typesense.Client({
      nodes: [{
        host: process.env.TYPESENSE_HOST || 'localhost',
        port: process.env.TYPESENSE_PORT || 8108,
        protocol: process.env.TYPESENSE_PROTOCOL || 'http'
      }],
      apiKey: process.env.TYPESENSE_API_KEY || 'your-api-key-change-in-production',
      connectionTimeoutSeconds: 2
    });

    this.collectionName = 'ads';
    this.initializeCollection();
  }

  async initializeCollection() {
    try {
      // Check if collection exists
      await this.client.collections(this.collectionName).retrieve();
      console.log('✅ Typesense collection already exists');
    } catch (error) {
      if (error.httpStatus === 404) {
        // Create collection
        await this.createCollection();
      } else {
        console.error('❌ Typesense connection error:', error);
      }
    }
  }

  async createCollection() {
    const schema = {
      name: this.collectionName,
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
        { name: 'images', type: 'string[]', facet: false, optional: true }
      ],
      default_sorting_field: 'created_at'
    };

    try {
      await this.client.collections().create(schema);
      console.log('✅ Typesense collection created successfully');
    } catch (error) {
      console.error('❌ Failed to create Typesense collection:', error);
      throw error;
    }
  }

  async indexAd(ad) {
    try {
      const document = {
        id: ad.id.toString(),
        title: ad.title,
        description: ad.description || '',
        price: parseFloat(ad.price) || 0,
        condition: ad.condition || 'used',
        category_id: ad.category_id,
        category_name: ad.category_name || '',
        location_id: ad.location_id,
        location_name: ad.location_name || '',
        seller_name: ad.seller_name || '',
        seller_phone: ad.seller_phone || '',
        is_featured: ad.is_featured || false,
        is_active: ad.is_active || (ad.status === 'approved'),
        created_at: new Date(ad.created_at).getTime(),
        updated_at: new Date(ad.updated_at || ad.created_at).getTime(),
        primary_image: ad.primary_image || '',
        images: ad.images ? ad.images.split(',').filter(img => img.trim()) : []
      };

      await this.client.collections(this.collectionName).documents().upsert(document);
      console.log(`✅ Indexed ad: ${ad.id}`);
    } catch (error) {
      console.error(`❌ Failed to index ad ${ad.id}:`, error);
      throw error;
    }
  }

  async bulkIndexAds(ads) {
    try {
      const documents = ads.map(ad => ({
        id: ad.id.toString(),
        title: ad.title,
        description: ad.description || '',
        price: parseFloat(ad.price) || 0,
        condition: ad.condition || 'used',
        category_id: ad.category_id,
        category_name: ad.category_name || '',
        location_id: ad.location_id,
        location_name: ad.location_name || '',
        seller_name: ad.seller_name || '',
        seller_phone: ad.seller_phone || '',
        is_featured: ad.is_featured || false,
        is_active: ad.is_active || (ad.status === 'approved'),
        created_at: new Date(ad.created_at).getTime(),
        updated_at: new Date(ad.updated_at || ad.created_at).getTime(),
        primary_image: ad.primary_image || '',
        images: ad.images ? ad.images.split(',').filter(img => img.trim()) : []
      }));

      await this.client.collections(this.collectionName).documents().import(documents);
      console.log(`✅ Bulk indexed ${documents.length} ads`);
    } catch (error) {
      console.error('❌ Failed to bulk index ads:', error);
      throw error;
    }
  }

  async deleteAd(adId) {
    try {
      await this.client.collections(this.collectionName).documents(adId.toString()).delete();
      console.log(`✅ Deleted ad from search index: ${adId}`);
    } catch (error) {
      console.error(`❌ Failed to delete ad ${adId} from search index:`, error);
      throw error;
    }
  }

  async search(params) {
    try {
      const {
        query = '',
        category,
        parentCategoryId,
        location,
        minPrice,
        maxPrice,
        condition,
        featured,
        page = 1,
        limit = 20,
        sortBy = 'created_at:desc'
      } = params;

      const searchParameters = {
        q: query || '*',
        query_by: 'title,description,category_name,location_name',
        filter_by: await this.buildFilterQuery({
          category,
          parentCategoryId,
          location,
          minPrice,
          maxPrice,
          condition,
          featured
        }),
        facet_by: 'category_name,location_name,condition,price',
        sort_by: sortBy,
        page: parseInt(page),
        per_page: parseInt(limit),
        highlight_full_fields: 'title,description'
      };

      // Remove empty filter_by
      if (!searchParameters.filter_by) {
        delete searchParameters.filter_by;
      }

      const results = await this.client.collections(this.collectionName).documents().search(searchParameters);

      return {
        hits: results.hits || [],
        found: results.found || 0,
        page: results.page || 1,
        search_time_ms: results.search_time_ms || 0,
        facet_counts: results.facet_counts || []
      };
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw error;
    }
  }

  async buildFilterQuery({ category, parentCategoryId, location, minPrice, maxPrice, condition, featured }) {
    const filters = ['is_active:=true'];

    // Handle parent category (includes all subcategories)
    if (parentCategoryId) {
      try {
        const pool = require('../config/database');
        // Get all subcategory IDs for this parent category
        const result = await pool.query(
          'SELECT id FROM categories WHERE parent_id = $1',
          [parentCategoryId]
        );

        const subcategoryIds = result.rows.map(row => row.id);

        // Build filter: parent_id OR any subcategory_id
        if (subcategoryIds.length > 0) {
          // Include parent category AND all subcategories
          const categoryIds = [parentCategoryId, ...subcategoryIds];
          filters.push(`category_id:[${categoryIds.join(',')}]`);
        } else {
          // No subcategories, just filter by parent category
          filters.push(`category_id:=${parentCategoryId}`);
        }
      } catch (error) {
        console.error('❌ Error fetching subcategories:', error);
        // Fallback to just parent category
        filters.push(`category_id:=${parentCategoryId}`);
      }
    } else if (category) {
      // Handle single category (exact match)
      if (typeof category === 'number') {
        filters.push(`category_id:=${category}`);
      } else {
        filters.push(`category_name:=${category}`);
      }
    }

    if (location) {
      if (typeof location === 'number') {
        filters.push(`location_id:=${location}`);
      } else {
        filters.push(`location_name:=${location}`);
      }
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

    if (featured === true || featured === 'true') {
      filters.push('is_featured:=true');
    }

    return filters.length > 1 ? filters.join(' && ') : filters[0];
  }

  async getStats() {
    try {
      const collection = await this.client.collections(this.collectionName).retrieve();
      return {
        total_documents: collection.num_documents,
        collection_name: collection.name,
        created_at: collection.created_at
      };
    } catch (error) {
      console.error('❌ Failed to get search stats:', error);
      throw error;
    }
  }

  async reindexAll() {
    try {
      // This would typically be called with all ads from your database
      console.log('🔄 Starting full reindex...');

      // Delete and recreate collection for fresh start
      try {
        await this.client.collections(this.collectionName).delete();
      } catch (e) {
        // Collection might not exist
      }

      await this.createCollection();
      console.log('✅ Full reindex completed');
    } catch (error) {
      console.error('❌ Failed to reindex:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();