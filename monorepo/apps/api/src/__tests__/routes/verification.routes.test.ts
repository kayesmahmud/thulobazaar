import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    business_verification_requests: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    individual_verification_requests: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const app = createApp();

describe('Verification Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // GET /api/verification/status
  // ==========================================
  describe('GET /api/verification/status', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/verification/status');

      expect(response.status).toBe(401);
    });

    // Note: Authenticated routes require proper JWT mock
    it.skip('should return verification status when authenticated', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findUnique).mockResolvedValue({
        account_type: 'individual',
        business_verification_status: null,
        individual_verified: false,
        business_name: null,
        business_license_document: null,
      } as any);

      // TODO: Add proper auth mock
      expect(true).toBe(true);
    });
  });

  // ==========================================
  // POST /api/verification/business
  // ==========================================
  describe('POST /api/verification/business', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/verification/business')
        .send({ businessName: 'Test Business', licenseDocument: 'license.pdf' });

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // POST /api/verification/individual
  // ==========================================
  describe('POST /api/verification/individual', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/verification/individual')
        .send({ documentUrls: ['doc1.pdf'] });

      expect(response.status).toBe(401);
    });
  });
});
