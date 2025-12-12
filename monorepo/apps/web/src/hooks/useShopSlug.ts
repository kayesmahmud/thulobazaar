'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

type SlugAvailability = 'idle' | 'checking' | 'available' | 'taken';

interface UseShopSlugOptions {
  initialSlug?: string;
  onSuccess?: () => void;
}

interface UseShopSlugReturn {
  // State
  customSlug: string;
  isEditing: boolean;
  availability: SlugAvailability;
  suggestedSlugs: string[];
  isSaving: boolean;
  error: string;

  // Actions
  setCustomSlug: (slug: string) => void;
  startEditing: (currentSlug: string) => void;
  cancelEditing: (fallbackSlug: string) => void;
  checkAvailability: (slug: string) => Promise<void>;
  saveSlug: () => Promise<boolean>;
  selectSuggestion: (suggestion: string) => void;
}

export function useShopSlug(options: UseShopSlugOptions = {}): UseShopSlugReturn {
  const { initialSlug = '', onSuccess } = options;

  const [customSlug, setCustomSlugState] = useState(initialSlug);
  const [isEditing, setIsEditing] = useState(false);
  const [availability, setAvailability] = useState<SlugAvailability>('idle');
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const setCustomSlug = useCallback((slug: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setCustomSlugState(sanitized);
  }, []);

  const checkAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.trim() === '') {
      setAvailability('idle');
      setSuggestedSlugs([]);
      return;
    }

    setAvailability('checking');

    try {
      const response = await apiClient.checkShopSlugAvailability(slug);

      if (response.success) {
        if (response.data.available) {
          setAvailability('available');
          setSuggestedSlugs([]);
        } else {
          setAvailability('taken');
          // Generate suggestions
          const suggestions: string[] = [];
          const baseSlug = slug.replace(/-\d+$/, '');
          for (let i = 1; i <= 5; i++) {
            suggestions.push(`${baseSlug}-${i}`);
          }
          setSuggestedSlugs(suggestions);
        }
      }
    } catch (err) {
      console.error('Error checking slug availability:', err);
      setAvailability('idle');
    }
  }, []);

  const startEditing = useCallback((currentSlug: string) => {
    setIsEditing(true);
    setCustomSlugState(currentSlug);
    setAvailability('idle');
    setSuggestedSlugs([]);
    setError('');
  }, []);

  const cancelEditing = useCallback((fallbackSlug: string) => {
    setIsEditing(false);
    setAvailability('idle');
    setSuggestedSlugs([]);
    setCustomSlugState(fallbackSlug);
    setError('');
  }, []);

  const saveSlug = useCallback(async (): Promise<boolean> => {
    if (availability !== 'available') {
      return false;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await apiClient.updateShopSlug(customSlug);

      if (response.success) {
        setIsEditing(false);
        onSuccess?.();
        return true;
      } else {
        setError(response.message || 'Failed to update shop URL');
        return false;
      }
    } catch (err) {
      console.error('Error saving shop slug:', err);
      setError('Failed to update shop URL');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [availability, customSlug, onSuccess]);

  const selectSuggestion = useCallback((suggestion: string) => {
    setCustomSlugState(suggestion);
    checkAvailability(suggestion);
  }, [checkAvailability]);

  return {
    customSlug,
    isEditing,
    availability,
    suggestedSlugs,
    isSaving,
    error,
    setCustomSlug,
    startEditing,
    cancelEditing,
    checkAvailability,
    saveSlug,
    selectSuggestion,
  };
}
