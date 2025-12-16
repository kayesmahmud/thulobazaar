import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    categories: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

const app = createApp();

// Sample category data for testing
const mockCategories = [
  {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    icon: 'smartphone',
    parent_id: null,
    form_template: null,
    ad_count: 25,
  },
  {
    id: 2,
    name: 'Vehicles',
    slug: 'vehicles',
    icon: 'car',
    parent_id: null,
    form_template: null,
    ad_count: 15,
  },
];

const mockCategoryWithSubcategories = {
  id: 1,
  name: 'Electronics',
  slug: 'electronics',
  icon: 'smartphone',
  parent_id: null,
  form_template: null,
  other_categories: [
    { id: 10, name: 'Mobile Phones', slug: 'mobile-phones', icon: 'phone', parent_id: 1 },
    { id: 11, name: 'Laptops', slug: 'laptops', icon: 'laptop', parent_id: 1 },
    { id: 12, name: 'TVs', slug: 'tvs', icon: 'tv', parent_id: 1 },
  ],
};

describe('Categories Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // GET /api/categories - List all categories
  // ==========================================
  describe('GET /api/categories', () => {
    it('should return list of categories with ad counts', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockCategories as any);

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Electronics');
      expect(response.body.data[0].ad_count).toBe(25);
    });

    it('should return categories with subcategories when includeSubcategories=true', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.categories.findMany).mockResolvedValue([mockCategoryWithSubcategories] as any);

      const response = await request(app).get('/api/categories?includeSubcategories=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].other_categories).toHaveLength(3);
      expect(response.body.data[0].other_categories[0].name).toBe('Mobile Phones');
    });

    it('should return empty array when no categories found', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  // ==========================================
  // GET /api/categories/:id - Get single category
  // ==========================================
  describe('GET /api/categories/:id', () => {
    it('should return category by ID', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.categories.findUnique).mockResolvedValue(mockCategoryWithSubcategories as any);

      const response = await request(app).get('/api/categories/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.id).toBe(1);
      expect(response.body.category.name).toBe('Electronics');
    });

    it('should return category by slug', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.categories.findFirst).mockResolvedValue(mockCategoryWithSubcategories as any);

      const response = await request(app).get('/api/categories/electronics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.slug).toBe('electronics');
    });

    it('should return 404 when category not found', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.categories.findUnique).mockResolvedValue(null);

      const response = await request(app).get('/api/categories/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should include subcategories in response', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.categories.findUnique).mockResolvedValue(mockCategoryWithSubcategories as any);

      const response = await request(app).get('/api/categories/1');

      expect(response.status).toBe(200);
      expect(response.body.category.other_categories).toBeDefined();
      expect(response.body.category.other_categories).toHaveLength(3);
    });
  });

  // ==========================================
  // POST /api/categories - Create category (admin only)
  // ==========================================
  describe('POST /api/categories', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'New Category' });

      expect(response.status).toBe(401);
    });

    // Note: Full admin route testing requires proper auth mock
    it.skip('should create category when admin authenticated', async () => {
      // TODO: Add proper admin auth mock
      expect(true).toBe(true);
    });
  });

  // ==========================================
  // PUT /api/categories/:id - Update category (admin only)
  // ==========================================
  describe('PUT /api/categories/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .send({ name: 'Updated Category' });

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // DELETE /api/categories/:id - Delete category (admin only)
  // ==========================================
  describe('DELETE /api/categories/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).delete('/api/categories/1');

      expect(response.status).toBe(401);
    });
  });
});
