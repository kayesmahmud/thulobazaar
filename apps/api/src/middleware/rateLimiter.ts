import { Request, Response, NextFunction } from 'express';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

/**
 * Simple rate limiter to prevent spam and abuse
 * Tracks requests per IP address and user ID
 */
class RateLimiter {
  private requests: Map<string, number[]>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.requests = new Map();

    // Clean up old entries every 10 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    let userRequests = this.requests.get(key) || [];

    // Filter out old requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (userRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...userRequests) + windowMs,
      };
    }

    // Add current request
    userRequests.push(now);
    this.requests.set(key, userRequests);

    return {
      allowed: true,
      remaining: limit - userRequests.length,
      resetTime: now + windowMs,
    };
  }

  /**
   * Create middleware for different rate limits
   */
  createMiddleware(options: RateLimitOptions) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes default
      max = 100, // 100 requests per window default
      keyGenerator = (req: Request) => req.ip || 'unknown',
      message = 'Too many requests, please try again later',
    } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
      const key = keyGenerator(req);
      const result = this.isAllowed(key, max, windowMs);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          message: message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
        return;
      }

      next();
    };
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => now - timestamp < maxAge);

      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }

    console.log(`🧹 Rate limiter cleanup: ${this.requests.size} active keys`);
  }

  /**
   * Get current stats
   */
  getStats(): { totalKeys: number; totalRequests: number } {
    return {
      totalKeys: this.requests.size,
      totalRequests: Array.from(this.requests.values()).reduce(
        (sum, requests) => sum + requests.length,
        0
      ),
    };
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Create single instance
export const rateLimiter = new RateLimiter();

// Pre-configured middleware for different use cases
export const rateLimiters = {
  // General API rate limit
  general: rateLimiter.createMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later',
  }),

  // Strict rate limit for posting content (ads, messages)
  posting: rateLimiter.createMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 posts per 5 minutes
    keyGenerator: (req: Request) => (req.user ? `user_${req.user.userId}` : req.ip || 'unknown'),
    message: 'Too many posts, please wait before posting again',
  }),

  // Message sending rate limit
  messaging: rateLimiter.createMiddleware({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // 5 messages per minute
    keyGenerator: (req: Request) => (req.user ? `user_${req.user.userId}` : req.ip || 'unknown'),
    message: 'Too many messages sent, please wait before sending another',
  }),

  // Authentication rate limit (login/register)
  auth: rateLimiter.createMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 auth attempts per 15 minutes
    keyGenerator: (req: Request) => req.ip || 'unknown',
    message: 'Too many authentication attempts, please try again later',
  }),

  // Search rate limit
  search: rateLimiter.createMiddleware({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 searches per minute
    keyGenerator: (req: Request) => (req.user ? `user_${req.user.userId}` : req.ip || 'unknown'),
    message: 'Too many search requests, please slow down',
  }),
};
