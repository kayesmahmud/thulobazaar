import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Create mock functions at module level
const mockRequireAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockCount = vi.fn();

// Mock auth
vi.mock('@/lib/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    shop_reports: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

// Helper to create mock POST request
function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3333/api/shop-reports', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper to create mock GET request
function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3333/api/shop-reports');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString(), { method: 'GET' });
}

describe('Shop Reports API', () => {
  let POST: typeof import('@/app/api/shop-reports/route').POST;
  let GET: typeof import('@/app/api/shop-reports/route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Default mock behaviors
    mockRequireAuth.mockResolvedValue(1); // User ID 1
    mockFindUnique.mockResolvedValue(null);
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 1, created_at: new Date() });
    mockCount.mockResolvedValue(0);

    // Import fresh module
    const module = await import('@/app/api/shop-reports/route');
    POST = module.POST;
    GET = module.GET;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // POST /api/shop-reports - Create Report
  // ==========================================
  describe('POST /api/shop-reports', () => {
    it('should require authentication', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

      const request = createPostRequest({ shopId: 2, reason: 'fraud' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Authentication');
    });

    it('should require shopId and reason', async () => {
      const request = createPostRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('required');
    });

    it('should require shopId', async () => {
      const request = createPostRequest({ reason: 'fraud' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should require reason', async () => {
      const request = createPostRequest({ shopId: 2 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate reason values', async () => {
      const request = createPostRequest({ shopId: 2, reason: 'invalid_reason' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid reason');
    });

    it('should accept valid reasons', async () => {
      const validReasons = ['fraud', 'harassment', 'fake_products', 'poor_service', 'impersonation', 'other'];

      for (const reason of validReasons) {
        vi.clearAllMocks();
        mockRequireAuth.mockResolvedValue(1);
        mockFindUnique.mockResolvedValue({ id: 2, full_name: 'Test Shop', is_active: true });
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({ id: 1, created_at: new Date() });

        const request = createPostRequest({ shopId: 2, reason });
        const response = await POST(request);

        expect(response.status).toBe(201);
      }
    });

    it('should return 404 if shop not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      const request = createPostRequest({ shopId: 999, reason: 'fraud' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toContain('not found');
    });

    it('should prevent self-reporting', async () => {
      mockRequireAuth.mockResolvedValue(1);
      mockFindUnique.mockResolvedValue({ id: 1, full_name: 'My Shop', is_active: true });

      const request = createPostRequest({ shopId: 1, reason: 'fraud' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('cannot report your own');
    });

    it('should block duplicate pending reports', async () => {
      mockFindUnique.mockResolvedValue({ id: 2, full_name: 'Test Shop', is_active: true });
      mockFindFirst.mockResolvedValue({ id: 1, status: 'pending' }); // Existing pending report

      const request = createPostRequest({ shopId: 2, reason: 'fraud' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('pending report');
    });

    it('should create report successfully', async () => {
      mockFindUnique.mockResolvedValue({ id: 2, full_name: 'Test Shop', business_name: null, is_active: true });
      mockFindFirst.mockResolvedValue(null); // No existing report
      mockCreate.mockResolvedValue({ id: 123, created_at: new Date('2024-01-01') });

      const request = createPostRequest({ shopId: 2, reason: 'fraud', details: 'Scam detected' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(123);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shop_id: 2,
            reporter_id: 1,
            reason: 'fraud',
            details: 'Scam detected',
            status: 'pending',
          }),
        })
      );
    });

    it('should create report without optional details', async () => {
      mockFindUnique.mockResolvedValue({ id: 2, full_name: 'Test Shop', is_active: true });
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: 1, created_at: new Date() });

      const request = createPostRequest({ shopId: 2, reason: 'harassment' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: null,
          }),
        })
      );
    });
  });

  // ==========================================
  // GET /api/shop-reports - Fetch Reports
  // ==========================================
  describe('GET /api/shop-reports', () => {
    it('should require authentication', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return empty list when no reports', async () => {
      mockCount.mockResolvedValue(0);
      mockFindMany.mockResolvedValue([]);

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return user reports with shop details', async () => {
      mockCount.mockResolvedValue(1);
      mockFindMany.mockResolvedValue([
        {
          id: 1,
          shop_id: 2,
          reporter_id: 1,
          reason: 'fraud',
          details: 'Test details',
          status: 'pending',
          admin_notes: null,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          shop: {
            id: 2,
            full_name: 'Shop Owner',
            business_name: 'Test Business',
            avatar: '/avatar.jpg',
            shop_slug: 'shop-owner',
            custom_shop_slug: 'custom-shop',
          },
        },
      ]);

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].shopId).toBe(2);
      expect(data.data[0].reason).toBe('fraud');
      expect(data.data[0].shop.businessName).toBe('Test Business');
      expect(data.data[0].shop.shopSlug).toBe('custom-shop'); // Uses custom slug
    });

    it('should filter by status', async () => {
      mockCount.mockResolvedValue(0);
      mockFindMany.mockResolvedValue([]);

      const request = createGetRequest({ status: 'resolved' });
      await GET(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reporter_id: 1,
            status: 'resolved',
          }),
        })
      );
    });

    it('should respect pagination params', async () => {
      mockCount.mockResolvedValue(100);
      mockFindMany.mockResolvedValue([]);

      const request = createGetRequest({ page: '2', limit: '10' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.totalPages).toBe(10);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );
    });

    it('should cap limit at 100', async () => {
      mockCount.mockResolvedValue(0);
      mockFindMany.mockResolvedValue([]);

      const request = createGetRequest({ limit: '500' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(100);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should use default shop_slug when custom_shop_slug is null', async () => {
      mockCount.mockResolvedValue(1);
      mockFindMany.mockResolvedValue([
        {
          id: 1,
          shop_id: 2,
          reporter_id: 1,
          reason: 'fraud',
          details: null,
          status: 'pending',
          admin_notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          shop: {
            id: 2,
            full_name: 'Shop Owner',
            business_name: null,
            avatar: null,
            shop_slug: 'default-slug',
            custom_shop_slug: null,
          },
        },
      ]);

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0].shop.shopSlug).toBe('default-slug');
    });
  });
});
