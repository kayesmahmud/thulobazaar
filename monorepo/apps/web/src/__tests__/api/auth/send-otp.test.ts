import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Create mock functions at module level
const mockFindFirst = vi.fn();
const mockCount = vi.fn();
const mockUpdateMany = vi.fn();
const mockCreate = vi.fn();

const mockValidateNepaliPhone = vi.fn();
const mockFormatPhoneNumber = vi.fn();
const mockGenerateOtp = vi.fn();
const mockSendOtpSms = vi.fn();
const mockGetOtpExpiry = vi.fn();

const mockSendOtpEmail = vi.fn();

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    phone_otps: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      count: (...args: unknown[]) => mockCount(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

// Mock SMS functions
vi.mock('@/lib/sms', () => ({
  validateNepaliPhone: (...args: unknown[]) => mockValidateNepaliPhone(...args),
  formatPhoneNumber: (...args: unknown[]) => mockFormatPhoneNumber(...args),
  generateOtp: () => mockGenerateOtp(),
  sendOtpSms: (...args: unknown[]) => mockSendOtpSms(...args),
  getOtpExpiry: () => mockGetOtpExpiry(),
}));

// Mock email notifications
vi.mock('@/lib/notifications/notifications', () => ({
  sendOtpEmail: (...args: unknown[]) => mockSendOtpEmail(...args),
}));

// Helper to create mock requests
function createMockRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3333/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Setup default mock behaviors
function setupDefaultMocks() {
  mockValidateNepaliPhone.mockReturnValue(true);
  mockFormatPhoneNumber.mockImplementation((phone: string) => phone);
  mockGenerateOtp.mockReturnValue('123456');
  mockSendOtpSms.mockResolvedValue({ success: true, message: 'OTP sent' });
  mockGetOtpExpiry.mockReturnValue(new Date(Date.now() + 600000));
  mockSendOtpEmail.mockResolvedValue({ success: true, message: 'Email sent' });

  // Default prisma mocks
  mockFindFirst.mockResolvedValue(null);
  mockCount.mockResolvedValue(0);
  mockUpdateMany.mockResolvedValue({ count: 0 });
  mockCreate.mockResolvedValue({ id: 1, phone: '9800000000', otp_code: '123456' });
}

describe('POST /api/auth/send-otp', () => {
  let POST: typeof import('@/app/api/auth/send-otp/route').POST;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.resetModules();

    // Setup default behaviors
    setupDefaultMocks();

    // Dynamically import to get fresh module with mocks
    const module = await import('@/app/api/auth/send-otp/route');
    POST = module.POST;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Validation Tests
  // ==========================================
  describe('Validation', () => {
    it('should return 400 when neither phone nor email provided', async () => {
      const request = createMockRequest({
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for invalid purpose', async () => {
      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'invalid_purpose',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid Nepali phone number', async () => {
      mockValidateNepaliPhone.mockReturnValue(false);

      const request = createMockRequest({
        phone: '1234567890',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid Nepali phone number');
    });
  });

  // ==========================================
  // Registration Purpose Tests
  // ==========================================
  describe('Registration Purpose', () => {
    it('should return 400 if phone already registered', async () => {
      // First call for user check returns existing user
      mockFindFirst
        .mockResolvedValueOnce({
          id: 1,
          phone: '9800000000',
          phone_verified: true,
        });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already registered');
    });

    it('should return 400 if email already registered', async () => {
      mockFindFirst
        .mockResolvedValueOnce({
          id: 1,
          email: 'existing@example.com',
        });

      const request = createMockRequest({
        email: 'existing@example.com',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already registered');
    });
  });

  // ==========================================
  // Login Purpose Tests
  // ==========================================
  describe('Login Purpose', () => {
    it('should return 404 if phone not registered for login', async () => {
      mockFindFirst.mockResolvedValue(null);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'login',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No account found');
    });

    it('should return 403 if account suspended for login', async () => {
      mockFindFirst
        .mockResolvedValueOnce({
          id: 1,
          phone: '9800000000',
          phone_verified: true,
          is_active: true,
          is_suspended: true,
        });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'login',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toContain('suspended');
    });
  });

  // ==========================================
  // Password Reset Purpose Tests
  // ==========================================
  describe('Password Reset Purpose', () => {
    it('should return 404 if account not found for password reset', async () => {
      mockFindFirst.mockResolvedValue(null);

      const request = createMockRequest({
        email: 'notfound@example.com',
        purpose: 'password_reset',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return 400 for OAuth-only accounts on password reset', async () => {
      mockFindFirst
        .mockResolvedValueOnce({
          id: 1,
          email: 'oauth@example.com',
          password_hash: null, // OAuth user without password
          is_active: true,
          is_suspended: false,
        });

      const request = createMockRequest({
        email: 'oauth@example.com',
        purpose: 'password_reset',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('social login');
    });
  });

  // ==========================================
  // Rate Limiting Tests
  // ==========================================
  describe('Rate Limiting', () => {
    it('should return 429 if OTP requested within cooldown', async () => {
      // First call - no user found (registration check passes)
      // Second call - recent OTP found
      mockFindFirst
        .mockResolvedValueOnce(null) // No existing user
        .mockResolvedValueOnce({
          id: 1,
          phone: '9800000000',
          created_at: new Date(Date.now() - 30000), // 30 seconds ago
        });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Please wait');
      expect(data.cooldownRemaining).toBeDefined();
    });

    it('should return 429 if max attempts exceeded', async () => {
      mockFindFirst.mockResolvedValue(null); // No user, no recent OTP
      mockCount.mockResolvedValue(3); // Max attempts reached

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Too many OTP requests');
    });
  });

  // ==========================================
  // Successful OTP Send Tests
  // ==========================================
  describe('Successful OTP Send', () => {
    it('should send OTP via SMS for phone registration', async () => {
      mockFindFirst.mockResolvedValue(null); // No existing user, no recent OTP
      mockCount.mockResolvedValue(0); // No attempts

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('SMS');
      expect(data.identifier).toBe('9800000000');
      expect(data.expiresIn).toBe(600);
      expect(mockSendOtpSms).toHaveBeenCalledWith('9800000000', '123456', 'registration');
    });

    it('should send OTP via email for email registration', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCount.mockResolvedValue(0);

      const request = createMockRequest({
        email: 'test@example.com',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('email');
      expect(data.identifier).toBe('test@example.com');
      expect(mockSendOtpEmail).toHaveBeenCalledWith('test@example.com', '123456', 'registration');
    });

    it('should invalidate previous unused OTPs', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      await POST(request);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            phone: '9800000000',
            purpose: 'registration',
            is_used: false,
          }),
          data: { is_used: true },
        })
      );
    });

    it('should store new OTP in database', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      await POST(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '9800000000',
            otp_code: '123456',
            purpose: 'registration',
          }),
        })
      );
    });

    it('should send OTP for password reset with phone', async () => {
      // User exists for password reset
      mockFindFirst
        .mockResolvedValueOnce({
          id: 1,
          phone: '9800000000',
          password_hash: 'hashedpassword',
          is_active: true,
          is_suspended: false,
        })
        .mockResolvedValueOnce(null); // No recent OTP
      mockCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'password_reset',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendOtpSms).toHaveBeenCalledWith('9800000000', '123456', 'password_reset');
    });

    it('should send OTP for login with existing user', async () => {
      // User exists and is active
      mockFindFirst
        .mockResolvedValueOnce({
          id: 1,
          phone: '9800000000',
          phone_verified: true,
          is_active: true,
          is_suspended: false,
        })
        .mockResolvedValueOnce(null); // No recent OTP
      mockCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'login',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendOtpSms).toHaveBeenCalledWith('9800000000', '123456', 'login');
    });
  });

  // ==========================================
  // Phone Verification Purpose Tests
  // ==========================================
  describe('Phone Verification Purpose', () => {
    it('should return 400 if phone already verified by another user', async () => {
      mockFindFirst
        .mockResolvedValueOnce({
          id: 2,
          phone: '9800000000',
          phone_verified: true,
        });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'phone_verification',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already verified');
    });

    it('should send OTP for phone verification if not verified', async () => {
      mockFindFirst.mockResolvedValue(null); // No verified user
      mockCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'phone_verification',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendOtpSms).toHaveBeenCalledWith('9800000000', '123456', 'phone_verification');
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================
  describe('Error Handling', () => {
    it('should return 500 if SMS sending fails', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCount.mockResolvedValue(0);
      mockSendOtpSms.mockResolvedValue({
        success: false,
        message: 'Failed',
        error: 'SMS service unavailable',
      });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Failed to send OTP');
    });

    it('should return 500 if email sending fails (not SMTP config error)', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCount.mockResolvedValue(0);
      mockSendOtpEmail.mockResolvedValue({
        success: false,
        message: 'Failed',
        error: 'Email service error',
      });

      const request = createMockRequest({
        email: 'test@example.com',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Failed to send OTP');
    });

    it('should succeed if email fails due to SMTP not configured (dev mode)', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCount.mockResolvedValue(0);
      mockSendOtpEmail.mockResolvedValue({
        success: false,
        message: 'SMTP not configured',
        error: 'SMTP not configured',
      });

      const request = createMockRequest({
        email: 'test@example.com',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      // Should still return 200 because in dev mode, SMTP not configured is acceptable
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle invalid JSON body gracefully', async () => {
      const request = new NextRequest('http://localhost:3333/api/auth/send-otp', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
