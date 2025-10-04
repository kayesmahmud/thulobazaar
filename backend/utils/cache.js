/**
 * Simple in-memory cache for API responses
 * Reduces database queries for frequently accessed data
 */

class Cache {
  constructor() {
    this.cache = new Map();
    this.ttlTimers = new Map();
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
   */
  set(key, value, ttl = 300) {
    // Clear existing timer if any
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
    }

    // Set value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.ttlTimers.set(key, timer);

    console.log(`📦 Cached: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const cached = this.cache.get(key);
    const age = Date.now() - cached.timestamp;

    // Check if expired
    if (age > cached.ttl) {
      this.delete(key);
      return null;
    }

    console.log(`✅ Cache hit: ${key} (age: ${Math.round(age / 1000)}s)`);
    return cached.value;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }
    this.cache.delete(key);
    console.log(`🗑️  Cache cleared: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    // Clear all timers
    for (const timer of this.ttlTimers.values()) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.ttlTimers.clear();
    console.log('🗑️  All cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  stats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, data]) => ({
      key,
      age: Math.round((now - data.timestamp) / 1000),
      ttl: Math.round(data.ttl / 1000),
      remaining: Math.round((data.ttl - (now - data.timestamp)) / 1000)
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  /**
   * Middleware to cache GET requests
   * @param {number} ttl - Time to live in seconds
   * @returns {Function} - Express middleware
   */
  middleware(ttl = 300) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = `${req.method}:${req.originalUrl}`;
      const cachedResponse = this.get(key);

      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache response
      res.json = (data) => {
        this.set(key, data, ttl);
        return originalJson(data);
      };

      next();
    };
  }
}

// Create singleton instance
const cache = new Cache();

module.exports = cache;
