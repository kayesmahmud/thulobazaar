import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/shop/check-slug/route';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  optionalAuth: vi.fn(),
}));

// Helper to create mock requests
function createMockRequest(slug: string | null) {
  const url = slug
    ? `http://localhost:3333/api/shop/check-slug?slug=${slug}`
    : 'http://localhost:3333/api/shop/check-slug';
  return new NextRequest(url, { method: 'GET' });
}

describe('GET /api/shop/check-slug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Validation Tests
  // ==========================================
  describe('Validation', () => {
    it('should return 400 when slug is missing', async () => {
      const request = createMockRequest(null);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Slug is required');
    });

    it('should return 400 when slug is empty', async () => {
      const request = createMockRequest('');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Slug is required');
    });

    it('should return 400 when slug is only whitespace', async () => {
      const request = createMockRequest('   ');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================
  // Slug Availability Tests (Unauthenticated)
  // ==========================================
  describe('Slug Availability - Unauthenticated', () => {
    beforeEach(async () => {
      const { optionalAuth } = await import('@/lib/auth');
      vi.mocked(optionalAuth).mockResolvedValue(null);
    });

    it('should return available=true when slug is not taken', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);

      const request = createMockRequest('new-unique-slug');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.available).toBe(true);
    });

    it('should return available=false when slug is taken', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findFirst).mockResolvedValue({ id: 1 } as any);

      const request = createMockRequest('taken-slug');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.available).toBe(false);
    });

    it('should normalize slug to lowercase', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);

      const request = createMockRequest('MyShop-Name');
      await GET(request);

      expect(prisma.users.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { custom_shop_slug: 'myshop-name' },
              { shop_slug: 'myshop-name' },
            ],
          }),
        })
      );
    });

    it('should remove special characters from slug', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);

      // Test slug with special characters - they get removed
      // my@shop!name becomes myshopname (only a-z0-9- kept)
      const request = createMockRequest('my@shop!name');
      await GET(request);

      expect(prisma.users.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { custom_shop_slug: 'myshopname' },
              { shop_slug: 'myshopname' },
            ],
          }),
        })
      );
    });
  });

  // ==========================================
  // Slug Availability Tests (Authenticated)
  // ==========================================
  describe('Slug Availability - Authenticated User', () => {
    it('should exclude current user from check when authenticated', async () => {
      const { optionalAuth } = await import('@/lib/auth');
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(optionalAuth).mockResolvedValue(32); // User ID 32
      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);

      const request = createMockRequest('my-shop-slug');
      await GET(request);

      // Verify the query includes the user exclusion
      expect(prisma.users.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 32 },
          }),
        })
      );
    });

    it('should return available=true when slug is own slug', async () => {
      const { optionalAuth } = await import('@/lib/auth');
      const { prisma } = await import('@thulobazaar/database');

      // User 32 is authenticated
      vi.mocked(optionalAuth).mockResolvedValue(32);
      // No other user has this slug (excluding user 32)
      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);

      const request = createMockRequest('alina-gurung-mobile-shop');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.available).toBe(true);
    });

    it('should return available=false when slug is taken by another user', async () => {
      const { optionalAuth } = await import('@/lib/auth');
      const { prisma } = await import('@thulobazaar/database');

      // User 32 is authenticated
      vi.mocked(optionalAuth).mockResolvedValue(32);
      // Another user (user 50) has this slug
      vi.mocked(prisma.users.findFirst).mockResolvedValue({ id: 50 } as any);

      const request = createMockRequest('other-user-shop');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.available).toBe(false);
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================
  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      const { optionalAuth } = await import('@/lib/auth');
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(optionalAuth).mockResolvedValue(null);
      vi.mocked(prisma.users.findFirst).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest('test-slug');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Failed to check slug availability');
    });

    it('should handle auth errors gracefully', async () => {
      const { optionalAuth } = await import('@/lib/auth');
      const { prisma } = await import('@thulobazaar/database');

      // Auth throws but should be handled gracefully
      vi.mocked(optionalAuth).mockRejectedValue(new Error('Auth error'));
      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);

      const request = createMockRequest('test-slug');
      const response = await GET(request);

      // Should either succeed (ignoring auth error) or return 500
      expect([200, 500]).toContain(response.status);
    });
  });
});
