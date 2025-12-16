import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    ads: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    ad_images: {
      createMany: vi.fn(),
    },
    categories: {
      findUnique: vi.fn(),
    },
    locations: {
      findUnique: vi.fn(),
    },
  },
}));

const app = createApp();

// Sample ad data for testing
const mockAd = {
  id: 1,
  title: 'Test iPhone 15 Pro',
  description: 'Brand new iPhone for sale',
  price: 150000,
  condition: 'new',
  status: 'approved',
  slug: 'test-iphone-15-pro-for-sale-kathmandu-1',
  view_count: 10,
  is_featured: false,
  is_urgent: false,
  is_bumped: false,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  category_id: 1,
  location_id: 1,
  user_id: 1,
  categories: { name: 'Electronics', icon: 'smartphone' },
  locations: { name: 'Kathmandu' },
  users_ads_user_idTousers: {
    id: 1,
    full_name: 'Test Seller',
    phone: '9800000000',
    avatar: null,
    account_type: 'individual',
    business_verification_status: null,
    individual_verified: true,
    shop_slug: 'test-seller',
  },
  ad_images: [
    { id: 1, filename: 'image1.jpg', file_path: '/uploads/image1.jpg', is_primary: true },
    { id: 2, filename: 'image2.jpg', file_path: '/uploads/image2.jpg', is_primary: false },
  ],
};

describe('Ads Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // GET /api/ads - List all approved ads
  // ==========================================
  describe('GET /api/ads', () => {
    it('should return list of approved ads', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test iPhone 15 Pro');
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(1);
    });

    it('should return empty array when no ads found', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([]);
      vi.mocked(prisma.ads.count).mockResolvedValue(0);

      const response = await request(app).get('/api/ads');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should filter by search term', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads?search=iPhone');

      expect(response.status).toBe(200);
      expect(prisma.ads.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should filter by category', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads?category=1');

      expect(response.status).toBe(200);
      expect(prisma.ads.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category_id: 1,
          }),
        })
      );
    });

    it('should filter by location', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads?location=1');

      expect(response.status).toBe(200);
      expect(prisma.ads.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location_id: 1,
          }),
        })
      );
    });

    it('should filter by price range', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads?minPrice=100000&maxPrice=200000');

      expect(response.status).toBe(200);
      expect(prisma.ads.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 100000, lte: 200000 },
          }),
        })
      );
    });

    it('should filter by condition', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads?condition=new');

      expect(response.status).toBe(200);
      expect(prisma.ads.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            condition: 'new',
          }),
        })
      );
    });

    it('should sort by price low to high', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads?sortBy=price-low');

      expect(response.status).toBe(200);
      expect(prisma.ads.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        })
      );
    });

    it('should sort by price high to low', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads?sortBy=price-high');

      expect(response.status).toBe(200);
      expect(prisma.ads.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'desc' },
        })
      );
    });

    it('should handle pagination', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(100);

      const response = await request(app).get('/api/ads?limit=10&offset=20');

      expect(response.status).toBe(200);
      expect(prisma.ads.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it('should transform response to camelCase', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findMany).mockResolvedValue([mockAd] as any);
      vi.mocked(prisma.ads.count).mockResolvedValue(1);

      const response = await request(app).get('/api/ads');

      expect(response.status).toBe(200);
      const ad = response.body.data[0];
      expect(ad.viewCount).toBeDefined();
      expect(ad.isFeatured).toBeDefined();
      expect(ad.categoryName).toBe('Electronics');
      expect(ad.locationName).toBe('Kathmandu');
      expect(ad.primaryImage).toBe('image1.jpg');
    });
  });

  // ==========================================
  // GET /api/ads/:id - Get single ad by ID
  // ==========================================
  describe('GET /api/ads/:id', () => {
    it('should return ad by ID', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findUnique).mockResolvedValue(mockAd as any);
      vi.mocked(prisma.ads.update).mockResolvedValue(mockAd as any);

      const response = await request(app).get('/api/ads/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.title).toBe('Test iPhone 15 Pro');
    });

    it('should increment view count when ad is viewed', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findUnique).mockResolvedValue(mockAd as any);
      vi.mocked(prisma.ads.update).mockResolvedValue(mockAd as any);

      await request(app).get('/api/ads/1');

      expect(prisma.ads.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { view_count: { increment: 1 } },
      });
    });

    it('should return 404 when ad not found', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findUnique).mockResolvedValue(null);

      const response = await request(app).get('/api/ads/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should include seller information', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findUnique).mockResolvedValue(mockAd as any);
      vi.mocked(prisma.ads.update).mockResolvedValue(mockAd as any);

      const response = await request(app).get('/api/ads/1');

      expect(response.status).toBe(200);
      expect(response.body.data.seller).toBeDefined();
      expect(response.body.data.seller.full_name).toBe('Test Seller');
    });

    it('should include images', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findUnique).mockResolvedValue(mockAd as any);
      vi.mocked(prisma.ads.update).mockResolvedValue(mockAd as any);

      const response = await request(app).get('/api/ads/1');

      expect(response.status).toBe(200);
      expect(response.body.data.images).toHaveLength(2);
      expect(response.body.data.images[0].is_primary).toBe(true);
    });
  });

  // ==========================================
  // GET /api/ads/slug/:slug - Get ad by slug
  // ==========================================
  describe('GET /api/ads/slug/:slug', () => {
    it('should return ad by slug', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findFirst).mockResolvedValue(mockAd as any);
      vi.mocked(prisma.ads.update).mockResolvedValue(mockAd as any);

      const response = await request(app).get('/api/ads/slug/test-iphone-15-pro-for-sale-kathmandu-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('test-iphone-15-pro-for-sale-kathmandu-1');
    });

    it('should return 404 for non-existent slug', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.ads.findFirst).mockResolvedValue(null);

      const response = await request(app).get('/api/ads/slug/non-existent-slug');

      expect(response.status).toBe(404);
    });
  });

  // ==========================================
  // GET /api/ads/my-ads - User's ads (requires auth)
  // ==========================================
  describe('GET /api/ads/my-ads', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/ads/my-ads');

      expect(response.status).toBe(401);
    });

    // Note: Testing authenticated routes requires proper JWT mock
    // This test is skipped as it needs the full auth middleware mock
    it.skip('should return user ads when authenticated', async () => {
      // TODO: Add proper auth mock
      expect(true).toBe(true);
    });
  });
});
