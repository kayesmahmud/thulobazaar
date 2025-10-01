const Typesense = require('typesense');
const config = require('../config/env');

class TypesenseService {
  constructor() {
    this.client = new Typesense.Client({
      nodes: [{
        host: config.TYPESENSE_HOST,
        port: config.TYPESENSE_PORT,
        protocol: config.TYPESENSE_PROTOCOL
      }],
      apiKey: config.TYPESENSE_API_KEY,
      connectionTimeoutSeconds: 5
    });

    this.collectionName = 'ads';
  }

  /**
   * Initialize Typesense collection
   */
  async initializeCollection() {
    try {
      // Check if collection exists
      await this.client.collections(this.collectionName).retrieve();
      console.log('✅ Typesense collection already exists');
    } catch (error) {
      if (error.httpStatus === 404) {
        // Create collection if it doesn't exist
        const schema = {
          name: this.collectionName,
          fields: [
            { name: 'id', type: 'int32' },
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'price', type: 'float' },
            { name: 'condition', type: 'string', facet: true },
            { name: 'category_id', type: 'int32', facet: true },
            { name: 'category_name', type: 'string', facet: true },
            { name: 'location_id', type: 'int32', facet: true },
            { name: 'location_name', type: 'string', facet: true },
            { name: 'seller_name', type: 'string' },
            { name: 'created_at', type: 'int64' },
            { name: 'view_count', type: 'int32' },
            { name: 'is_featured', type: 'bool', facet: true }
          ],
          default_sorting_field: 'created_at'
        };

        await this.client.collections().create(schema);
        console.log('✅ Typesense collection created successfully');
      } else {
        throw error;
      }
    }
  }

  /**
   * Index a single ad
   */
  async indexAd(ad) {
    try {
      const document = {
        id: ad.id.toString(),
        title: ad.title,
        description: ad.description,
        price: parseFloat(ad.price),
        condition: ad.condition,
        category_id: ad.category_id,
        category_name: ad.category_name || '',
        location_id: ad.location_id,
        location_name: ad.location_name || '',
        seller_name: ad.seller_name,
        created_at: Math.floor(new Date(ad.created_at).getTime() / 1000),
        view_count: ad.view_count || 0,
        is_featured: ad.is_featured || false
      };

      await this.client.collections(this.collectionName)
        .documents()
        .upsert(document);

      return true;
    } catch (error) {
      console.error('Error indexing ad:', error);
      return false;
    }
  }

  /**
   * Remove ad from index
   */
  async removeAd(adId) {
    try {
      await this.client.collections(this.collectionName)
        .documents(adId.toString())
        .delete();
      return true;
    } catch (error) {
      console.error('Error removing ad from index:', error);
      return false;
    }
  }

  /**
   * Search ads
   */
  async search(params) {
    const {
      query = '*',
      category,
      location,
      minPrice,
      maxPrice,
      condition,
      page = 1,
      perPage = 20
    } = params;

    try {
      const searchParameters = {
        q: query,
        query_by: 'title,description,seller_name',
        filter_by: [],
        sort_by: 'created_at:desc',
        page: parseInt(page),
        per_page: parseInt(perPage)
      };

      // Build filter string
      const filters = [];

      if (category) {
        filters.push(`category_id:${category}`);
      }

      if (location) {
        filters.push(`location_id:${location}`);
      }

      if (minPrice) {
        filters.push(`price:>=${minPrice}`);
      }

      if (maxPrice) {
        filters.push(`price:<=${maxPrice}`);
      }

      if (condition) {
        filters.push(`condition:${condition}`);
      }

      if (filters.length > 0) {
        searchParameters.filter_by = filters.join(' && ');
      }

      const results = await this.client.collections(this.collectionName)
        .documents()
        .search(searchParameters);

      return {
        hits: results.hits.map(hit => hit.document),
        found: results.found,
        page: results.page
      };
    } catch (error) {
      console.error('Typesense search error:', error);
      throw error;
    }
  }

  /**
   * Bulk index ads
   */
  async bulkIndexAds(ads) {
    try {
      const documents = ads.map(ad => ({
        id: ad.id.toString(),
        title: ad.title,
        description: ad.description,
        price: parseFloat(ad.price),
        condition: ad.condition,
        category_id: ad.category_id,
        category_name: ad.category_name || '',
        location_id: ad.location_id,
        location_name: ad.location_name || '',
        seller_name: ad.seller_name,
        created_at: Math.floor(new Date(ad.created_at).getTime() / 1000),
        view_count: ad.view_count || 0,
        is_featured: ad.is_featured || false
      }));

      await this.client.collections(this.collectionName)
        .documents()
        .import(documents, { action: 'upsert' });

      console.log(`✅ Indexed ${documents.length} ads to Typesense`);
      return true;
    } catch (error) {
      console.error('Error bulk indexing ads:', error);
      return false;
    }
  }
}

module.exports = new TypesenseService();