import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the api module
const mockCheckShopSlugAvailability = vi.fn();
const mockUpdateShopSlug = vi.fn();

vi.mock('@/lib/api', () => ({
  apiClient: {
    checkShopSlugAvailability: (...args: unknown[]) => mockCheckShopSlugAvailability(...args),
    updateShopSlug: (...args: unknown[]) => mockUpdateShopSlug(...args),
  },
}));

// Import after mocking
import { useShopSlug } from '@/hooks/useShopSlug';

describe('useShopSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckShopSlugAvailability.mockReset();
    mockUpdateShopSlug.mockReset();
  });

  // ==========================================
  // Initial State Tests
  // ==========================================
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useShopSlug());

      expect(result.current.customSlug).toBe('');
      expect(result.current.isEditing).toBe(false);
      expect(result.current.availability).toBe('idle');
      expect(result.current.suggestedSlugs).toEqual([]);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBe('');
    });

    it('should use initialSlug when provided', () => {
      const { result } = renderHook(() =>
        useShopSlug({ initialSlug: 'my-shop' })
      );

      expect(result.current.customSlug).toBe('my-shop');
    });
  });

  // ==========================================
  // Slug Sanitization Tests
  // ==========================================
  describe('Slug Sanitization', () => {
    it('should convert to lowercase', () => {
      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('MyShop');
      });

      expect(result.current.customSlug).toBe('myshop');
    });

    it('should remove special characters', () => {
      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('my@shop!name');
      });

      expect(result.current.customSlug).toBe('myshopname');
    });

    it('should allow hyphens', () => {
      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('my-shop-name');
      });

      expect(result.current.customSlug).toBe('my-shop-name');
    });

    it('should allow numbers', () => {
      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('shop123');
      });

      expect(result.current.customSlug).toBe('shop123');
    });

    it('should remove spaces', () => {
      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('my shop name');
      });

      expect(result.current.customSlug).toBe('myshopname');
    });

    it('should remove underscores', () => {
      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('my_shop_name');
      });

      expect(result.current.customSlug).toBe('myshopname');
    });
  });

  // ==========================================
  // Editing State Tests
  // ==========================================
  describe('Editing State', () => {
    it('should start editing with current slug', () => {
      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.startEditing('current-slug');
      });

      expect(result.current.isEditing).toBe(true);
      expect(result.current.customSlug).toBe('current-slug');
      expect(result.current.availability).toBe('idle');
      expect(result.current.suggestedSlugs).toEqual([]);
      expect(result.current.error).toBe('');
    });

    it('should cancel editing and restore fallback slug', () => {
      const { result } = renderHook(() =>
        useShopSlug({ initialSlug: 'initial-slug' })
      );

      act(() => {
        result.current.startEditing('current-slug');
        result.current.setCustomSlug('new-slug');
      });

      expect(result.current.customSlug).toBe('new-slug');

      act(() => {
        result.current.cancelEditing('fallback-slug');
      });

      expect(result.current.isEditing).toBe(false);
      expect(result.current.customSlug).toBe('fallback-slug');
      expect(result.current.availability).toBe('idle');
      expect(result.current.suggestedSlugs).toEqual([]);
      expect(result.current.error).toBe('');
    });
  });

  // ==========================================
  // Availability Check Tests
  // ==========================================
  describe('Check Availability', () => {
    it('should not check empty slug', async () => {
      const { result } = renderHook(() => useShopSlug());

      await act(async () => {
        await result.current.checkAvailability('');
      });

      expect(mockCheckShopSlugAvailability).not.toHaveBeenCalled();
      expect(result.current.availability).toBe('idle');
    });

    it('should not check whitespace-only slug', async () => {
      const { result } = renderHook(() => useShopSlug());

      await act(async () => {
        await result.current.checkAvailability('   ');
      });

      expect(mockCheckShopSlugAvailability).not.toHaveBeenCalled();
      expect(result.current.availability).toBe('idle');
    });

    it('should set available when slug is available', async () => {
      mockCheckShopSlugAvailability.mockResolvedValueOnce({
        success: true,
        data: { available: true },
      });

      const { result } = renderHook(() => useShopSlug());

      await act(async () => {
        await result.current.checkAvailability('available-slug');
      });

      expect(mockCheckShopSlugAvailability).toHaveBeenCalledWith('available-slug');
      expect(result.current.availability).toBe('available');
      expect(result.current.suggestedSlugs).toEqual([]);
    });

    it('should set taken and generate suggestions when slug is taken', async () => {
      mockCheckShopSlugAvailability.mockResolvedValueOnce({
        success: true,
        data: { available: false },
      });

      const { result } = renderHook(() => useShopSlug());

      await act(async () => {
        await result.current.checkAvailability('taken-slug');
      });

      expect(result.current.availability).toBe('taken');
      expect(result.current.suggestedSlugs).toEqual([
        'taken-slug-1',
        'taken-slug-2',
        'taken-slug-3',
        'taken-slug-4',
        'taken-slug-5',
      ]);
    });

    it('should generate suggestions without duplicating numbers', async () => {
      mockCheckShopSlugAvailability.mockResolvedValueOnce({
        success: true,
        data: { available: false },
      });

      const { result } = renderHook(() => useShopSlug());

      // Try a slug that already ends in a number
      await act(async () => {
        await result.current.checkAvailability('my-shop-3');
      });

      // Should strip the trailing number and add new ones
      expect(result.current.suggestedSlugs).toEqual([
        'my-shop-1',
        'my-shop-2',
        'my-shop-3',
        'my-shop-4',
        'my-shop-5',
      ]);
    });

    it('should handle API error gracefully', async () => {
      mockCheckShopSlugAvailability.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useShopSlug());

      await act(async () => {
        await result.current.checkAvailability('test-slug');
      });

      expect(result.current.availability).toBe('idle');
    });
  });

  // ==========================================
  // Save Slug Tests
  // ==========================================
  describe('Save Slug', () => {
    it('should not save if slug is not available', async () => {
      const { result } = renderHook(() => useShopSlug());

      // Set slug but don't check availability (stays 'idle')
      act(() => {
        result.current.setCustomSlug('test-slug');
      });

      let saved: boolean = false;
      await act(async () => {
        saved = await result.current.saveSlug();
      });

      expect(saved).toBe(false);
      expect(mockUpdateShopSlug).not.toHaveBeenCalled();
    });

    it('should not save if slug is taken', async () => {
      mockCheckShopSlugAvailability.mockResolvedValueOnce({
        success: true,
        data: { available: false },
      });

      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('taken-slug');
      });

      await act(async () => {
        await result.current.checkAvailability('taken-slug');
      });

      let saved: boolean = false;
      await act(async () => {
        saved = await result.current.saveSlug();
      });

      expect(saved).toBe(false);
      expect(mockUpdateShopSlug).not.toHaveBeenCalled();
    });

    it('should save when slug is available', async () => {
      const onSuccess = vi.fn();

      mockCheckShopSlugAvailability.mockResolvedValueOnce({
        success: true,
        data: { available: true },
      });

      mockUpdateShopSlug.mockResolvedValueOnce({
        success: true,
      });

      const { result } = renderHook(() => useShopSlug({ onSuccess }));

      act(() => {
        result.current.startEditing('old-slug');
        result.current.setCustomSlug('new-slug');
      });

      await act(async () => {
        await result.current.checkAvailability('new-slug');
      });

      expect(result.current.availability).toBe('available');

      let saved: boolean = false;
      await act(async () => {
        saved = await result.current.saveSlug();
      });

      expect(saved).toBe(true);
      expect(mockUpdateShopSlug).toHaveBeenCalledWith('new-slug');
      expect(result.current.isEditing).toBe(false);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle save failure', async () => {
      mockCheckShopSlugAvailability.mockResolvedValueOnce({
        success: true,
        data: { available: true },
      });

      mockUpdateShopSlug.mockResolvedValueOnce({
        success: false,
        message: 'Slug already taken',
      });

      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('test-slug');
      });

      await act(async () => {
        await result.current.checkAvailability('test-slug');
      });

      let saved: boolean = false;
      await act(async () => {
        saved = await result.current.saveSlug();
      });

      expect(saved).toBe(false);
      expect(result.current.error).toBe('Slug already taken');
    });

    it('should handle network error during save', async () => {
      mockCheckShopSlugAvailability.mockResolvedValueOnce({
        success: true,
        data: { available: true },
      });

      mockUpdateShopSlug.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useShopSlug());

      act(() => {
        result.current.setCustomSlug('test-slug');
      });

      await act(async () => {
        await result.current.checkAvailability('test-slug');
      });

      let saved: boolean = false;
      await act(async () => {
        saved = await result.current.saveSlug();
      });

      expect(saved).toBe(false);
      expect(result.current.error).toBe('Failed to update shop URL');
    });
  });

  // ==========================================
  // Suggestion Selection Tests
  // ==========================================
  describe('Select Suggestion', () => {
    it('should update slug and check availability when selecting suggestion', async () => {
      mockCheckShopSlugAvailability
        .mockResolvedValueOnce({
          success: true,
          data: { available: false },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { available: true },
        });

      const { result } = renderHook(() => useShopSlug());

      // First check - taken
      await act(async () => {
        await result.current.checkAvailability('my-shop');
      });

      expect(result.current.availability).toBe('taken');
      expect(result.current.suggestedSlugs).toContain('my-shop-1');

      // Select suggestion
      await act(async () => {
        result.current.selectSuggestion('my-shop-1');
        // Wait for the internal checkAvailability to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.customSlug).toBe('my-shop-1');
      expect(mockCheckShopSlugAvailability).toHaveBeenCalledWith('my-shop-1');
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================
  describe('Full Workflow', () => {
    it('should complete full edit workflow', async () => {
      const onSuccess = vi.fn();

      mockCheckShopSlugAvailability.mockResolvedValue({
        success: true,
        data: { available: true },
      });

      mockUpdateShopSlug.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() =>
        useShopSlug({ initialSlug: 'initial', onSuccess })
      );

      // 1. Start editing
      act(() => {
        result.current.startEditing('current-slug');
      });
      expect(result.current.isEditing).toBe(true);
      expect(result.current.customSlug).toBe('current-slug');

      // 2. Change slug
      act(() => {
        result.current.setCustomSlug('new-slug');
      });
      expect(result.current.customSlug).toBe('new-slug');

      // 3. Check availability
      await act(async () => {
        await result.current.checkAvailability('new-slug');
      });
      expect(result.current.availability).toBe('available');

      // 4. Save
      let saved: boolean = false;
      await act(async () => {
        saved = await result.current.saveSlug();
      });
      expect(saved).toBe(true);
      expect(result.current.isEditing).toBe(false);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle cancel during edit', () => {
      const { result } = renderHook(() =>
        useShopSlug({ initialSlug: 'initial-slug' })
      );

      // Start editing
      act(() => {
        result.current.startEditing('current-slug');
      });

      // Make changes
      act(() => {
        result.current.setCustomSlug('changed-slug');
      });

      // Cancel
      act(() => {
        result.current.cancelEditing('fallback-slug');
      });

      expect(result.current.isEditing).toBe(false);
      expect(result.current.customSlug).toBe('fallback-slug');
    });
  });
});
