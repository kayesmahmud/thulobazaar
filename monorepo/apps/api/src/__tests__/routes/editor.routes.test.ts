import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    ads: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    business_verification_requests: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    individual_verification_requests: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

const app = createApp();

// Sample editor user data
const mockEditor = {
  id: 100,
  email: 'editor@thulobazaar.com',
  password_hash: 'hashed_password',
  full_name: 'Test Editor',
  role: 'editor',
  is_active: true,
  last_login: new Date('2024-01-01'),
  avatar: null,
};

const mockAdmin = {
  id: 101,
  email: 'admin@thulobazaar.com',
  password_hash: 'hashed_password',
  full_name: 'Test Admin',
  role: 'admin',
  is_active: true,
  last_login: new Date('2024-01-01'),
  avatar: null,
};

describe('Editor Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // POST /api/editor/auth/login
  // ==========================================
  describe('POST /api/editor/auth/login', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/editor/auth/login')
        .send({ password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/editor/auth/login')
        .send({ email: 'editor@thulobazaar.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for non-editor user', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findUnique).mockResolvedValue({
        ...mockEditor,
        role: 'user', // Regular user, not editor
      } as any);

      const response = await request(app)
        .post('/api/editor/auth/login')
        .send({ email: 'user@test.com', password: 'test123' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for invalid credentials', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcrypt');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockEditor as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never);

      const response = await request(app)
        .post('/api/editor/auth/login')
        .send({ email: 'editor@thulobazaar.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for deactivated editor', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findUnique).mockResolvedValue({
        ...mockEditor,
        is_active: false,
      } as any);

      const response = await request(app)
        .post('/api/editor/auth/login')
        .send({ email: 'editor@thulobazaar.com', password: 'test123' });

      expect(response.status).toBe(401);
    });

    it('should successfully login editor with valid credentials', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcrypt');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockEditor as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);
      vi.mocked(prisma.users.update).mockResolvedValue(mockEditor as any);

      const response = await request(app)
        .post('/api/editor/auth/login')
        .send({ email: 'editor@thulobazaar.com', password: 'editor123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.role).toBe('editor');
    });

    it('should successfully login admin with valid credentials', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcrypt');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockAdmin as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);
      vi.mocked(prisma.users.update).mockResolvedValue(mockAdmin as any);

      const response = await request(app)
        .post('/api/editor/auth/login')
        .send({ email: 'admin@thulobazaar.com', password: 'admin123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should update last_login on successful login', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcrypt');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockEditor as any);
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);
      vi.mocked(prisma.users.update).mockResolvedValue(mockEditor as any);

      await request(app)
        .post('/api/editor/auth/login')
        .send({ email: 'editor@thulobazaar.com', password: 'editor123' });

      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 100 },
          data: { last_login: expect.any(Date) },
        })
      );
    });
  });

  // ==========================================
  // GET /api/editor/profile
  // ==========================================
  describe('GET /api/editor/profile', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/editor/profile');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/editor/stats (Dashboard stats)
  // ==========================================
  describe('GET /api/editor/stats', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/editor/stats');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/editor/ads (Ads management)
  // ==========================================
  describe('GET /api/editor/ads', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/editor/ads');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/editor/verifications
  // ==========================================
  describe('GET /api/editor/verifications', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/editor/verifications');

      expect(response.status).toBe(401);
    });
  });
});
