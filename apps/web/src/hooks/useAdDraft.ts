'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFTS_STORAGE_KEY = 'thulobazaar_ad_drafts';
const DEBOUNCE_MS = 3000; // Save after 3 seconds of no changes

export interface AdDraft {
  id: string;
  title: string;
  description: string;
  price: string;
  categoryId: string;
  subcategoryId: string;
  locationSlug: string;
  locationName: string;
  condition: string;
  isNegotiable: boolean;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AdDraftFormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  subcategoryId: string;
  locationSlug: string;
  locationName: string;
  condition: string;
  isNegotiable: boolean;
}

interface UseAdDraftReturn {
  // Draft list
  drafts: AdDraft[];

  // Current draft being edited
  currentDraftId: string | null;

  // Actions
  saveDraft: (formData: AdDraftFormData, customFields?: Record<string, unknown>) => void;
  loadDraft: (draftId: string) => AdDraft | null;
  deleteDraft: (draftId: string) => void;
  clearCurrentDraft: () => void;
  startNewDraft: () => string;

  // Status
  isSaving: boolean;
  lastSaved: Date | null;

  // Helpers
  getDraftDisplayName: (draft: AdDraft) => string;
  formatDraftDate: (dateString: string) => string;
}

/**
 * Hook for managing ad drafts in localStorage
 * Works with both Next.js (web) and can be adapted for React Native (AsyncStorage)
 */
export function useAdDraft(): UseAdDraftReturn {
  const [drafts, setDrafts] = useState<AdDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load drafts from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
        if (stored) {
          const parsedDrafts = JSON.parse(stored) as AdDraft[];
          // Sort by updatedAt descending (most recent first)
          parsedDrafts.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setDrafts(parsedDrafts);
        }
      } catch (error) {
        console.error('Error loading drafts:', error);
      }
    }
  }, []);

  // Save drafts to localStorage whenever they change
  const persistDrafts = useCallback((updatedDrafts: AdDraft[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
      } catch (error) {
        if ((error as Error).name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded. Removing oldest drafts...');
          // Remove oldest drafts if storage is full
          const trimmedDrafts = updatedDrafts.slice(0, 5);
          localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(trimmedDrafts));
          setDrafts(trimmedDrafts);
        } else {
          console.error('Error saving drafts:', error);
        }
      }
    }
  }, []);

  // Generate a unique draft ID
  const generateDraftId = (): string => {
    return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Start a new draft
  const startNewDraft = useCallback((): string => {
    const newId = generateDraftId();
    setCurrentDraftId(newId);
    return newId;
  }, []);

  // Save draft with debouncing
  const saveDraft = useCallback((
    formData: AdDraftFormData,
    customFields: Record<string, unknown> = {}
  ) => {
    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Check if there's any data worth saving
    const hasContent = formData.title.trim() ||
                       formData.description.trim() ||
                       formData.price.trim() ||
                       formData.categoryId;

    if (!hasContent) {
      return; // Don't save empty drafts
    }

    // Clear lastSaved to indicate changes are pending (but don't show "Saving..." yet)
    setLastSaved(null);

    // Debounce the actual save - show "Saving..." only when actually saving
    debounceTimer.current = setTimeout(() => {
      // Show "Saving..." indicator
      setIsSaving(true);

      // Use setTimeout to ensure React renders "Saving..." before we continue
      setTimeout(() => {
        const now = new Date().toISOString();
        const draftId = currentDraftId || generateDraftId();

        if (!currentDraftId) {
          setCurrentDraftId(draftId);
        }

        const draft: AdDraft = {
          id: draftId,
          ...formData,
          customFields,
          createdAt: drafts.find(d => d.id === draftId)?.createdAt || now,
          updatedAt: now,
        };

        setDrafts(prevDrafts => {
          const existingIndex = prevDrafts.findIndex(d => d.id === draftId);
          let updatedDrafts: AdDraft[];

          if (existingIndex >= 0) {
            // Update existing draft
            updatedDrafts = [...prevDrafts];
            updatedDrafts[existingIndex] = draft;
          } else {
            // Add new draft at the beginning
            updatedDrafts = [draft, ...prevDrafts];
          }

          // Keep only last 10 drafts
          if (updatedDrafts.length > 10) {
            updatedDrafts = updatedDrafts.slice(0, 10);
          }

          persistDrafts(updatedDrafts);
          return updatedDrafts;
        });

        // Show "Saving..." for at least 500ms so user can see it
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 500);
      }, 50); // Small delay to let React render "Saving..."
    }, DEBOUNCE_MS);
  }, [currentDraftId, drafts, persistDrafts]);

  // Load a specific draft
  const loadDraft = useCallback((draftId: string): AdDraft | null => {
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      setCurrentDraftId(draftId);
      return draft;
    }
    return null;
  }, [drafts]);

  // Delete a draft
  const deleteDraft = useCallback((draftId: string) => {
    setDrafts(prevDrafts => {
      const updatedDrafts = prevDrafts.filter(d => d.id !== draftId);
      persistDrafts(updatedDrafts);
      return updatedDrafts;
    });

    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
    }
  }, [currentDraftId, persistDrafts]);

  // Clear current draft (after successful post)
  const clearCurrentDraft = useCallback(() => {
    if (currentDraftId) {
      deleteDraft(currentDraftId);
    }
    setCurrentDraftId(null);
    setLastSaved(null);
  }, [currentDraftId, deleteDraft]);

  // Get display name for a draft
  const getDraftDisplayName = useCallback((draft: AdDraft): string => {
    if (draft.title.trim()) {
      return draft.title.trim();
    }

    // Format: "Untitled - 12:45 PM, Dec 9"
    const date = new Date(draft.updatedAt);

    // Handle invalid dates
    if (isNaN(date.getTime())) {
      return 'Untitled Draft';
    }

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `Untitled - ${time}, ${dateStr}`;
  }, []);

  // Format draft date for display
  const formatDraftDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);

    // Handle invalid dates
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    drafts,
    currentDraftId,
    saveDraft,
    loadDraft,
    deleteDraft,
    clearCurrentDraft,
    startNewDraft,
    isSaving,
    lastSaved,
    getDraftDisplayName,
    formatDraftDate,
  };
}
