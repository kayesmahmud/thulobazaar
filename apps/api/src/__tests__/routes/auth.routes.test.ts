import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

const app = createApp();

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'test123', fullName: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', fullName: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when fullName is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects email registration: sign-up is phone OTP or OAuth only now', async () => {
      const { prisma } = await import('@thulobazaar/database');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@test.com',
          password: 'test123',
          fullName: 'New User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('no longer supported');
      expect(prisma.users.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 when email/phone is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error when user not found', async () => {
      const { prisma } = await import('@thulobazaar/database');
      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@test.com', password: 'test123' });

      // API returns 401 for invalid credentials
      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should return error when password is incorrect', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcrypt');

      vi.mocked(prisma.users.findFirst).mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password_hash: 'hashed_password',
        is_active: true,
        is_suspended: false,
      } as any);

      vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      // API returns 401 for invalid credentials
      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    // Note: Login success test requires proper mock setup with full user object
    // This is a template - expand based on actual auth.routes.ts implementation
    it.skip('should successfully login with valid credentials', async () => {
      // TODO: Add proper mock for full login flow
      expect(true).toBe(true);
    });

    // Note: Suspended user test requires proper mock setup
    it.skip('should reject suspended users', async () => {
      // TODO: Add proper mock for suspended user check
      expect(true).toBe(true);
    });
  });
});
