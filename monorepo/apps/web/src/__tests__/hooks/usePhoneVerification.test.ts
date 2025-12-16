import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('usePhoneVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  // ==========================================
  // Initial State Tests
  // ==========================================
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePhoneVerification());

      expect(result.current.step).toBe('idle');
      expect(result.current.phoneToVerify).toBe('');
      expect(result.current.otp).toBe('');
      expect(result.current.error).toBe('');
      expect(result.current.success).toBe('');
      expect(result.current.isSendingOtp).toBe(false);
      expect(result.current.isVerifying).toBe(false);
      expect(result.current.cooldown).toBe(0);
    });
  });

  // ==========================================
  // State Management Tests
  // ==========================================
  describe('State Management', () => {
    it('should update phone number', () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.setPhoneToVerify('9800000001');
      });

      expect(result.current.phoneToVerify).toBe('9800000001');
    });

    it('should update OTP', () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.setOtp('123456');
      });

      expect(result.current.otp).toBe('123456');
    });

    it('should clear messages', () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.clearMessages();
      });

      expect(result.current.error).toBe('');
      expect(result.current.success).toBe('');
    });
  });

  // ==========================================
  // Verification Flow Tests
  // ==========================================
  describe('Verification Flow', () => {
    it('should start verification', () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
      });

      expect(result.current.step).toBe('enter_phone');
      expect(result.current.phoneToVerify).toBe('');
      expect(result.current.otp).toBe('');
      expect(result.current.error).toBe('');
    });

    it('should cancel verification', () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
      });

      act(() => {
        result.current.cancelVerification();
      });

      expect(result.current.step).toBe('idle');
      expect(result.current.error).toBe('');
    });

    it('should allow changing number', () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('9800000001');
        result.current.setOtp('123456');
      });

      act(() => {
        result.current.changeNumber();
      });

      expect(result.current.step).toBe('enter_phone');
      expect(result.current.otp).toBe('');
    });
  });

  // ==========================================
  // Send OTP Tests
  // ==========================================
  describe('Send OTP', () => {
    it('should show error for invalid phone number', async () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('123'); // Too short
      });

      await act(async () => {
        await result.current.sendOtp();
      });

      expect(result.current.error).toBe('Please enter a valid phone number');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show error for empty phone number', async () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
      });

      await act(async () => {
        await result.current.sendOtp();
      });

      expect(result.current.error).toBe('Please enter a valid phone number');
    });

    it('should send OTP successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('9800000001');
      });

      await act(async () => {
        await result.current.sendOtp();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: '9800000001',
          purpose: 'phone_verification',
        }),
      });
      expect(result.current.step).toBe('enter_otp');
      expect(result.current.cooldown).toBe(60);
      expect(result.current.error).toBe('');
    });

    it('should handle OTP send failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, message: 'Rate limited' }),
      });

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('9800000001');
      });

      await act(async () => {
        await result.current.sendOtp();
      });

      expect(result.current.error).toBe('Rate limited');
      expect(result.current.step).toBe('enter_phone'); // Should stay on phone step
    });

    it('should set cooldown from server response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          message: 'Too many attempts',
          cooldownRemaining: 45,
        }),
      });

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('9800000001');
      });

      await act(async () => {
        await result.current.sendOtp();
      });

      expect(result.current.cooldown).toBe(45);
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('9800000001');
      });

      await act(async () => {
        await result.current.sendOtp();
      });

      expect(result.current.error).toBe('Failed to send OTP. Please try again.');
    });

    it('should set isSendingOtp during request', async () => {
      // Create a deferred promise to control timing
      let resolveRequest: (value: unknown) => void;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      mockFetch.mockImplementationOnce(() => requestPromise.then(() => ({
        json: () => Promise.resolve({ success: true }),
      })));

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('9800000001');
      });

      // Start the request (don't await)
      let sendPromise: Promise<void>;
      act(() => {
        sendPromise = result.current.sendOtp();
      });

      // Check loading state
      expect(result.current.isSendingOtp).toBe(true);

      // Complete the request
      await act(async () => {
        resolveRequest!(true);
        await sendPromise!;
      });

      expect(result.current.isSendingOtp).toBe(false);
    });
  });

  // ==========================================
  // Verify OTP Tests
  // ==========================================
  describe('Verify OTP', () => {
    it('should show error for invalid OTP length', async () => {
      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.setOtp('123'); // Too short
      });

      await act(async () => {
        await result.current.verifyOtp();
      });

      expect(result.current.error).toBe('Please enter the 6-digit OTP');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show error for empty OTP', async () => {
      const { result } = renderHook(() => usePhoneVerification());

      await act(async () => {
        await result.current.verifyOtp();
      });

      expect(result.current.error).toBe('Please enter the 6-digit OTP');
    });

    it('should verify OTP and update phone successfully', async () => {
      const onSuccess = vi.fn();

      // First call: verify OTP
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          verificationToken: 'test-token',
        }),
      });

      // Second call: update phone
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => usePhoneVerification({ onSuccess }));

      act(() => {
        result.current.setPhoneToVerify('9800000001');
        result.current.setOtp('123456');
      });

      await act(async () => {
        await result.current.verifyOtp();
      });

      // Verify the OTP verification call
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: '9800000001',
          otp: '123456',
          purpose: 'phone_verification',
        }),
      });

      // Verify the update phone call
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/auth/update-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: '9800000001',
          verificationToken: 'test-token',
        }),
      });

      expect(result.current.success).toBe('Phone number verified successfully!');
      expect(result.current.step).toBe('idle');
      expect(result.current.phoneToVerify).toBe('');
      expect(result.current.otp).toBe('');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle OTP verification failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          message: 'Invalid OTP',
        }),
      });

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.setPhoneToVerify('9800000001');
        result.current.setOtp('000000');
      });

      await act(async () => {
        await result.current.verifyOtp();
      });

      expect(result.current.error).toBe('Invalid OTP');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should not call update-phone
    });

    it('should handle phone update failure', async () => {
      // First call: verify OTP (success)
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          verificationToken: 'test-token',
        }),
      });

      // Second call: update phone (failure)
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          message: 'Phone already in use',
        }),
      });

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.setPhoneToVerify('9800000001');
        result.current.setOtp('123456');
      });

      await act(async () => {
        await result.current.verifyOtp();
      });

      expect(result.current.error).toBe('Phone already in use');
    });

    it('should handle network error during verification', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.setPhoneToVerify('9800000001');
        result.current.setOtp('123456');
      });

      await act(async () => {
        await result.current.verifyOtp();
      });

      expect(result.current.error).toBe('Failed to verify phone. Please try again.');
    });

    it('should set isVerifying during verification', async () => {
      let resolveRequest: (value: unknown) => void;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      mockFetch.mockImplementationOnce(() => requestPromise.then(() => ({
        json: () => Promise.resolve({ success: false, message: 'Invalid' }),
      })));

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.setPhoneToVerify('9800000001');
        result.current.setOtp('123456');
      });

      // Start verifying (don't await)
      let verifyPromise: Promise<void>;
      act(() => {
        verifyPromise = result.current.verifyOtp();
      });

      // Should be loading
      expect(result.current.isVerifying).toBe(true);

      // Complete the request
      await act(async () => {
        resolveRequest!(true);
        await verifyPromise!;
      });

      expect(result.current.isVerifying).toBe(false);
    });
  });

  // ==========================================
  // Cooldown Tests (with fake timers)
  // ==========================================
  describe('Cooldown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should decrement cooldown timer', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('9800000001');
      });

      await act(async () => {
        await result.current.sendOtp();
      });

      expect(result.current.cooldown).toBe(60);

      // Advance timer by 1 second
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.cooldown).toBe(59);

      // Advance by 5 more seconds (one at a time to let each tick process)
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      expect(result.current.cooldown).toBe(54);
    });

    it('should stop at 0', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.startVerification();
        result.current.setPhoneToVerify('9800000001');
      });

      await act(async () => {
        await result.current.sendOtp();
      });

      // Advance timer past cooldown - do it in chunks to avoid issues
      for (let i = 0; i < 70; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      expect(result.current.cooldown).toBe(0);
    });
  });

  // ==========================================
  // Success Message Tests (with fake timers)
  // ==========================================
  describe('Success Message', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-clear success message after 5 seconds', async () => {
      // Mock successful verification
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          verificationToken: 'test-token',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => usePhoneVerification());

      act(() => {
        result.current.setPhoneToVerify('9800000001');
        result.current.setOtp('123456');
      });

      await act(async () => {
        await result.current.verifyOtp();
      });

      expect(result.current.success).toBe('Phone number verified successfully!');

      // Advance timer by 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.success).toBe('');
    });
  });
});
