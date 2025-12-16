import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/initiate/route';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
    },
    payment_transactions: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

// Mock payment gateways
vi.mock('@/lib/paymentGateways', () => ({
  initiatePayment: vi.fn(),
}));

// Helper to create mock requests
function createMockRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3333/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Sample data
const mockUser = {
  full_name: 'Test User',
  email: 'test@example.com',
  phone: '9800000000',
};

const mockTransaction = {
  id: 1,
  user_id: 1,
  transaction_id: 'TB_ADV_123_abc',
  metadata: '{}',
};

describe('POST /api/payments/initiate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Authentication Tests
  // ==========================================
  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const { requireAuth } = await import('@/lib/auth');
      vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'ad_promotion',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Authentication required');
    });
  });

  // ==========================================
  // Validation Tests
  // ==========================================
  describe('Validation', () => {
    beforeEach(async () => {
      const { requireAuth } = await import('@/lib/auth');
      vi.mocked(requireAuth).mockResolvedValue(1);
    });

    it('should return 400 for invalid gateway', async () => {
      const request = createMockRequest({
        gateway: 'invalid_gateway',
        amount: 100,
        paymentType: 'ad_promotion',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid payment gateway');
    });

    it('should return 400 for amount below minimum', async () => {
      const request = createMockRequest({
        gateway: 'khalti',
        amount: 5,
        paymentType: 'ad_promotion',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Minimum amount is NPR 10');
    });

    it('should return 400 for invalid payment type', async () => {
      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'invalid_type',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid payment type');
    });

    it('should accept ad_promotion payment type', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://khalti.com/pay/123',
        pidx: 'test-pidx',
        expiresAt: new Date(),
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'ad_promotion',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept individual_verification payment type', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://khalti.com/pay/123',
        pidx: 'test-pidx',
        expiresAt: new Date(),
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 500,
        paymentType: 'individual_verification',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept business_verification payment type', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://khalti.com/pay/123',
        pidx: 'test-pidx',
        expiresAt: new Date(),
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 1000,
        paymentType: 'business_verification',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ==========================================
  // Successful Payment Initiation Tests
  // ==========================================
  describe('Successful Payment Initiation', () => {
    beforeEach(async () => {
      const { requireAuth } = await import('@/lib/auth');
      vi.mocked(requireAuth).mockResolvedValue(1);
    });

    it('should initiate Khalti payment successfully', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://khalti.com/pay/abc123',
        pidx: 'test-pidx-123',
        expiresAt: new Date('2024-01-01T12:00:00Z'),
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'ad_promotion',
        relatedId: 123,
        orderName: 'Promote Ad #123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.paymentUrl).toBe('https://khalti.com/pay/abc123');
      expect(data.data.gateway).toBe('khalti');
      expect(data.data.amount).toBe(100);
      expect(data.data.pidx).toBe('test-pidx-123');
    });

    it('should initiate eSewa payment successfully', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://esewa.com.np/epay/main',
        pidx: 'esewa-ref-123',
        expiresAt: new Date('2024-01-01T12:00:00Z'),
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'esewa',
        amount: 200,
        paymentType: 'individual_verification',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.gateway).toBe('esewa');
    });

    it('should create transaction record in database', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://khalti.com/pay/abc123',
        pidx: 'test-pidx',
        expiresAt: new Date(),
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'ad_promotion',
      });
      await POST(request);

      expect(prisma.payment_transactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 1,
            payment_type: 'ad_promotion',
            payment_gateway: 'khalti',
            amount: 100,
            status: 'pending',
          }),
        })
      );
    });

    it('should include user info in payment request', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://khalti.com/pay/abc123',
        pidx: 'test-pidx',
        expiresAt: new Date(),
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'ad_promotion',
      });
      await POST(request);

      expect(initiatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userName: 'Test User',
            userEmail: 'test@example.com',
            userPhone: '9800000000',
          }),
        })
      );
    });
  });

  // ==========================================
  // Payment Gateway Failure Tests
  // ==========================================
  describe('Payment Gateway Failures', () => {
    beforeEach(async () => {
      const { requireAuth } = await import('@/lib/auth');
      vi.mocked(requireAuth).mockResolvedValue(1);
    });

    it('should handle gateway initiation failure', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: false,
        error: 'Gateway timeout',
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'ad_promotion',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Gateway timeout');
    });

    it('should update transaction as failed on gateway error', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { initiatePayment } = await import('@/lib/paymentGateways');

      vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.payment_transactions.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(initiatePayment).mockResolvedValue({
        success: false,
        error: 'Gateway timeout',
      });
      vi.mocked(prisma.payment_transactions.update).mockResolvedValue(mockTransaction as any);

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'ad_promotion',
      });
      await POST(request);

      expect(prisma.payment_transactions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: 'failed',
            failure_reason: 'Gateway timeout',
          }),
        })
      );
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================
  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      const { requireAuth } = await import('@/lib/auth');
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(requireAuth).mockResolvedValue(1);
      vi.mocked(prisma.users.findUnique).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        gateway: 'khalti',
        amount: 100,
        paymentType: 'ad_promotion',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
