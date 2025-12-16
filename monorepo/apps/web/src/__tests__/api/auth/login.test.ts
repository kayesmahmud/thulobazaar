import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

// Mock auth lib
vi.mock('@/lib/auth', () => ({
  createToken: vi.fn().mockResolvedValue('mock-jwt-token'),
}));

// Helper to create mock requests
function createMockRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3333/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Sample user data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  password_hash: 'hashed_password',
  full_name: 'Test User',
  phone: '9800000000',
  role: 'user',
  is_active: true,
  is_suspended: false,
  avatar: null,
  account_type: 'individual',
  business_name: null,
  business_verification_status: null,
  individual_verified: false,
  shop_slug: 'test-user-1',
};

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Validation Tests
  // ==========================================
  describe('Validation', () => {
    it('should return 400 when email is missing', async () => {
      const request = createMockRequest({ password: 'test123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
      expect(data.errors.email).toBeDefined();
    });

    it('should return 400 when password is missing', async () => {
      const request = createMockRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors.password).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest({
        email: 'invalid-email',
        password: 'test123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors.email).toBeDefined();
    });

    it('should return 400 for empty password', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: '',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================
  // Authentication Tests
  // ==========================================
  describe('Authentication', () => {
    it('should return 401 when user not found', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(null);

      const request = createMockRequest({
        email: 'notfound@example.com',
        password: 'test123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid email or password');
    });

    it('should return 401 when password is incorrect', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcryptjs');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid email or password');
    });

    it('should return 403 when account is inactive', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findUnique).mockResolvedValue({
        ...mockUser,
        is_active: false,
      } as any);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'test123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toContain('inactive');
    });

    it('should return 403 when account is suspended', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findUnique).mockResolvedValue({
        ...mockUser,
        is_suspended: true,
      } as any);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'test123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toContain('suspended');
    });
  });

  // ==========================================
  // Success Tests
  // ==========================================
  describe('Successful Login', () => {
    it('should return 200 with token and user data on successful login', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcryptjs');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'correctpassword',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Login successful');
      expect(data.token).toBe('mock-jwt-token');
    });

    it('should return user data in camelCase format', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcryptjs');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'correctpassword',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.fullName).toBe('Test User');
      expect(data.user.accountType).toBe('individual');
      expect(data.user.shopSlug).toBe('test-user-1');
      // Ensure snake_case fields are NOT present
      expect(data.user.full_name).toBeUndefined();
      expect(data.user.account_type).toBeUndefined();
      expect(data.user.shop_slug).toBeUndefined();
    });

    it('should not expose password hash in response', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcryptjs');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'correctpassword',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.password_hash).toBeUndefined();
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should handle verified business user correctly', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcryptjs');

      const businessUser = {
        ...mockUser,
        account_type: 'business',
        business_name: 'Test Business',
        business_verification_status: 'approved',
        shop_slug: 'test-business',
      };

      vi.mocked(prisma.users.findUnique).mockResolvedValue(businessUser as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'correctpassword',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.accountType).toBe('business');
      expect(data.user.businessName).toBe('Test Business');
      expect(data.user.businessVerificationStatus).toBe('approved');
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================
  describe('Error Handling', () => {
    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3333/api/auth/login', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should return 500 on database error', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findUnique).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'test123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
    });
  });
});
