import { describe, it, expect, vi, beforeEach } from 'vitest';
import { browserRequest } from '../helpers/browserRequest.js';
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
    verification_pricing: {
      findMany: vi.fn(),
    },
    verification_campaigns: {
      findMany: vi.fn(),
    },
    site_settings: {
      findMany: vi.fn(),
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
      const response = await browserRequest(app).get('/api/verification/status');

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
      const response = await browserRequest(app)
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
      const response = await browserRequest(app)
        .post('/api/verification/individual')
        .send({ documentUrls: ['doc1.pdf'] });

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/verification/pricing
  // ==========================================
  describe('GET /api/verification/pricing', () => {
    async function mockPricing(freeEnabled: 'true' | 'false') {
      const { prisma } = await import('@thulobazaar/database');
      vi.mocked(prisma.verification_pricing.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.verification_campaigns.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.site_settings.findMany).mockResolvedValue([
        { setting_key: 'free_verification_enabled', setting_value: freeEnabled },
      ] as any);
      return prisma;
    }

    it('answers guests, who are eligible while the free offer is on', async () => {
      const prisma = await mockPricing('true');

      const response = await browserRequest(app).get('/api/verification/pricing');

      expect(response.status).toBe(200);
      expect(response.body.data.freeVerification).toMatchObject({ enabled: true, isEligible: true });
      // No token, no user lookup: a guest's eligibility comes from the setting alone.
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
    });

    it('tells guests the offer is off when the setting is off', async () => {
      await mockPricing('false');

      const response = await browserRequest(app).get('/api/verification/pricing');

      expect(response.status).toBe(200);
      expect(response.body.data.freeVerification).toMatchObject({ enabled: false, isEligible: false });
    });
  });
});
