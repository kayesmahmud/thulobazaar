// Mobile-optimized location utilities for React Native and web apps
// Provides caching, offline support, and batch operations

const { Pool } = require('pg');

// Location cache for fast mobile responses
const locationCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

class MobileLocationService {
  constructor(pool) {
    this.pool = pool;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0
    };
  }

  // Get cache key for location data
  getCacheKey(type, params) {
    return `${type}:${JSON.stringify(params)}`;
  }

  // Check if cache entry is valid
  isCacheValid(entry) {
    return entry && (Date.now() - entry.timestamp < CACHE_TTL);
  }

  // Get from cache or fetch from database
  async getCachedOrFetch(cacheKey, fetchFunction) {
    const cached = locationCache.get(cacheKey);

    if (this.isCacheValid(cached)) {
      this.cacheStats.hits++;
      return cached.data;
    }

    this.cacheStats.misses++;
    const data = await fetchFunction();

    // Cache the result
    locationCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    this.cacheStats.size = locationCache.size;
    return data;
  }

  // Batch location search for mobile apps
  async batchLocationSearch(queries) {
    const results = await Promise.all(
      queries.map(async (query) => {
        const { q, lat, lng, limit = 5 } = query;
        const cacheKey = this.getCacheKey('search', { q: q.toLowerCase(), lat, lng, limit });

        return this.getCachedOrFetch(cacheKey, async () => {
          const searchQuery = `
            SELECT l.*,
              CASE
                WHEN $2::decimal IS NOT NULL AND $3::decimal IS NOT NULL THEN
                  (6371 * acos(
                    cos(radians($2)) *
                    cos(radians(l.latitude)) *
                    cos(radians(l.longitude) - radians($3)) +
                    sin(radians($2)) *
                    sin(radians(l.latitude))
                  ))
                ELSE NULL
              END AS distance
            FROM locations l
            WHERE LOWER(l.name) LIKE LOWER($1)
              AND l.latitude IS NOT NULL
              AND l.longitude IS NOT NULL
            ORDER BY ${lat && lng ? 'distance ASC,' : ''} l.name ASC
            LIMIT $4
          `;

          const params = [`%${q}%`, lat || null, lng || null, limit];
          const result = await this.pool.query(searchQuery, params);

          return result.rows.map(location => ({
            id: location.id,
            name: location.name,
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
            distance: location.distance ? parseFloat(location.distance.toFixed(1)) : null
          }));
        });
      })
    );

    return {
      success: true,
      data: results,
      cacheStats: this.getCacheStats()
    };
  }

  // Get popular locations with caching
  async getPopularLocations(limit = 10) {
    const cacheKey = this.getCacheKey('popular', { limit });

    return this.getCachedOrFetch(cacheKey, async () => {
      const query = `
        SELECT l.*, COUNT(a.id) as ad_count
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id
        WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        GROUP BY l.id, l.name, l.latitude, l.longitude
        ORDER BY ad_count DESC, l.name ASC
        LIMIT $1
      `;

      const result = await this.pool.query(query, [limit]);

      return result.rows.map(location => ({
        id: location.id,
        name: location.name,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        adCount: parseInt(location.ad_count),
        // Add mobile-specific formatting
        displayName: location.name,
        shortName: location.name.length > 15 ? location.name.substring(0, 12) + '...' : location.name
      }));
    });
  }

  // Reverse geocoding with caching
  async reverseGeocode(lat, lng, radius = 50) {
    const roundedLat = Math.round(lat * 1000) / 1000; // Round to 3 decimals for caching
    const roundedLng = Math.round(lng * 1000) / 1000;
    const cacheKey = this.getCacheKey('reverse', { lat: roundedLat, lng: roundedLng, radius });

    return this.getCachedOrFetch(cacheKey, async () => {
      const query = `
        SELECT * FROM (
          SELECT l.*,
            (6371 * acos(
              cos(radians($1)) *
              cos(radians(l.latitude)) *
              cos(radians(l.longitude) - radians($2)) +
              sin(radians($1)) *
              sin(radians(l.latitude))
            )) AS distance
          FROM locations l
          WHERE l.latitude IS NOT NULL
            AND l.longitude IS NOT NULL
        ) locations_with_distance
        WHERE distance <= $3
        ORDER BY distance ASC
        LIMIT 5
      `;

      const result = await this.pool.query(query, [lat, lng, radius]);

      return result.rows.map(location => ({
        id: location.id,
        name: location.name,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        distance: parseFloat(location.distance.toFixed(1)),
        // Mobile-friendly formatting
        formattedDistance: this.formatDistance(location.distance),
        confidence: this.calculateConfidence(location.distance)
      }));
    });
  }

  // Get location suggestions optimized for mobile
  async getLocationSuggestions(lat, lng, limit = 5) {
    const cacheKey = this.getCacheKey('suggestions', {
      lat: lat ? Math.round(lat * 100) / 100 : null,
      lng: lng ? Math.round(lng * 100) / 100 : null,
      limit
    });

    return this.getCachedOrFetch(cacheKey, async () => {
      let query, params;

      if (lat && lng) {
        // Location-based suggestions with distance grouping for mobile
        query = `
          SELECT l.*, COUNT(a.id) as ad_count,
            (6371 * acos(
              cos(radians($1)) *
              cos(radians(l.latitude)) *
              cos(radians(l.longitude) - radians($2)) +
              sin(radians($1)) *
              sin(radians(l.latitude))
            )) AS distance,
            CASE
              WHEN (6371 * acos(
                cos(radians($1)) *
                cos(radians(l.latitude)) *
                cos(radians(l.longitude) - radians($2)) +
                sin(radians($1)) *
                sin(radians(l.latitude))
              )) <= 10 THEN 'nearby'
              WHEN (6371 * acos(
                cos(radians($1)) *
                cos(radians(l.latitude)) *
                cos(radians(l.longitude) - radians($2)) +
                sin(radians($1)) *
                sin(radians(l.latitude))
              )) <= 50 THEN 'close'
              ELSE 'far'
            END as proximity_group
          FROM locations l
          LEFT JOIN ads a ON l.id = a.location_id
          WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
          GROUP BY l.id, l.name, l.latitude, l.longitude
          HAVING (6371 * acos(
            cos(radians($1)) *
            cos(radians(l.latitude)) *
            cos(radians(l.longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(l.latitude))
          )) <= 100
          ORDER BY
            CASE proximity_group
              WHEN 'nearby' THEN 1
              WHEN 'close' THEN 2
              ELSE 3
            END,
            ad_count DESC,
            distance ASC
          LIMIT $3
        `;
        params = [lat, lng, limit];
      } else {
        // Popular locations fallback
        query = `
          SELECT l.*, COUNT(a.id) as ad_count, 'popular' as proximity_group
          FROM locations l
          LEFT JOIN ads a ON l.id = a.location_id
          WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
          GROUP BY l.id, l.name, l.latitude, l.longitude
          ORDER BY ad_count DESC, l.name ASC
          LIMIT $1
        `;
        params = [limit];
      }

      const result = await this.pool.query(query, params);

      return result.rows.map(location => ({
        id: location.id,
        name: location.name,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        adCount: parseInt(location.ad_count),
        distance: location.distance ? parseFloat(location.distance.toFixed(1)) : null,
        proximityGroup: location.proximity_group,
        // Mobile UI helpers
        displayName: location.name,
        subtitle: this.generateSubtitle(location),
        iconColor: this.getProximityColor(location.proximity_group)
      }));
    });
  }

  // Get nearby ads with enhanced mobile features
  async getNearbyAds(lat, lng, radius = 25, options = {}) {
    const {
      category = null,
      limit = 20,
      offset = 0,
      sortBy = 'distance', // distance, price, date
      priceRange = null,
      condition = null
    } = options;

    const cacheKey = this.getCacheKey('nearby_ads', {
      lat: Math.round(lat * 1000) / 1000,
      lng: Math.round(lng * 1000) / 1000,
      radius,
      category,
      limit,
      offset,
      sortBy,
      priceRange,
      condition
    });

    return this.getCachedOrFetch(cacheKey, async () => {
      let queryConditions = ['1=1'];
      let queryParams = [lat, lng];
      let paramIndex = 3;

      // Build dynamic query conditions
      if (category) {
        queryConditions.push(`c.slug = $${paramIndex} OR c.name = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      if (priceRange) {
        const [minPrice, maxPrice] = priceRange;
        if (minPrice !== null) {
          queryConditions.push(`a.price >= $${paramIndex}`);
          queryParams.push(minPrice);
          paramIndex++;
        }
        if (maxPrice !== null) {
          queryConditions.push(`a.price <= $${paramIndex}`);
          queryParams.push(maxPrice);
          paramIndex++;
        }
      }

      if (condition) {
        queryConditions.push(`a.condition = $${paramIndex}`);
        queryParams.push(condition);
        paramIndex++;
      }

      // Sort options
      let orderBy = 'distance ASC, a.is_featured DESC, a.created_at DESC';
      if (sortBy === 'price') {
        orderBy = 'a.price ASC, distance ASC';
      } else if (sortBy === 'date') {
        orderBy = 'a.created_at DESC, distance ASC';
      }

      const query = `
        SELECT *
        FROM (
          SELECT
            a.id, a.title, a.description, a.price, a.condition, a.view_count,
            a.seller_name, a.seller_phone, a.created_at, a.is_featured,
            a.latitude, a.longitude,
            c.name as category_name, c.icon as category_icon, c.slug as category_slug,
            l.name as location_name, l.latitude as location_latitude, l.longitude as location_longitude,
            (SELECT filename FROM ad_images WHERE ad_id = a.id AND is_primary = true LIMIT 1) as primary_image,
            (6371 * acos(
              cos(radians($1)) *
              cos(radians(COALESCE(a.latitude, l.latitude))) *
              cos(radians(COALESCE(a.longitude, l.longitude)) - radians($2)) +
              sin(radians($1)) *
              sin(radians(COALESCE(a.latitude, l.latitude)))
            )) AS distance
          FROM ads a
          LEFT JOIN categories c ON a.category_id = c.id
          LEFT JOIN locations l ON a.location_id = l.id
          WHERE ${queryConditions.join(' AND ')}
            AND ((a.latitude IS NOT NULL AND a.longitude IS NOT NULL)
             OR (l.latitude IS NOT NULL AND l.longitude IS NOT NULL))
        ) ads_with_distance
        WHERE distance <= ${radius}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await this.pool.query(query, queryParams);

      return result.rows.map(ad => ({
        ...ad,
        distance: parseFloat(ad.distance.toFixed(1)),
        formattedDistance: this.formatDistance(ad.distance),
        // Mobile-specific enhancements
        imageUrl: ad.primary_image ? `/uploads/${ad.primary_image}` : null,
        formattedPrice: this.formatPrice(ad.price),
        timeAgo: this.formatTimeAgo(ad.created_at),
        isFeatured: !!ad.is_featured,
        coordinates: {
          lat: parseFloat(ad.latitude || ad.location_latitude),
          lng: parseFloat(ad.longitude || ad.location_longitude)
        }
      }));
    });
  }

  // Utility functions for mobile formatting
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  }

  formatPrice(price) {
    const numPrice = parseFloat(price);
    if (numPrice >= 100000) {
      return `NPR ${(numPrice / 100000).toFixed(1)}L`;
    } else if (numPrice >= 1000) {
      return `NPR ${(numPrice / 1000).toFixed(0)}K`;
    } else {
      return `NPR ${numPrice.toFixed(0)}`;
    }
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return date.toLocaleDateString();
  }

  calculateConfidence(distance) {
    if (distance < 1) return 'high';
    if (distance < 10) return 'medium';
    return 'low';
  }

  generateSubtitle(location) {
    const adCount = location.ad_count || 0;
    const distance = location.distance;

    if (distance && adCount > 0) {
      return `${this.formatDistance(distance)} • ${adCount} ads`;
    } else if (distance) {
      return this.formatDistance(distance);
    } else if (adCount > 0) {
      return `${adCount} ads`;
    }
    return '';
  }

  getProximityColor(proximityGroup) {
    switch (proximityGroup) {
      case 'nearby': return '#22c55e'; // green
      case 'close': return '#f59e0b';  // amber
      case 'far': return '#6b7280';    // gray
      case 'popular': return '#dc1e4a'; // red (brand color)
      default: return '#6b7280';
    }
  }

  // Cache management
  getCacheStats() {
    return {
      ...this.cacheStats,
      size: locationCache.size,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    };
  }

  clearCache() {
    locationCache.clear();
    this.cacheStats = { hits: 0, misses: 0, size: 0 };
  }

  // Clean expired cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of locationCache.entries()) {
      if (now - entry.timestamp >= CACHE_TTL) {
        locationCache.delete(key);
      }
    }
    this.cacheStats.size = locationCache.size;
  }
}

// Cleanup cache every 5 minutes
setInterval(() => {
  if (global.mobileLocationService) {
    global.mobileLocationService.cleanupCache();
  }
}, 5 * 60 * 1000);

module.exports = { MobileLocationService };