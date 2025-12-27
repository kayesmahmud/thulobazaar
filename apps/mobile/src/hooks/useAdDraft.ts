import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

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
  drafts: AdDraft[];
  currentDraftId: string | null;
  saveDraft: (formData: AdDraftFormData, customFields?: Record<string, unknown>) => void;
  loadDraft: (draftId: string) => AdDraft | null;
  deleteDraft: (draftId: string) => void;
  clearCurrentDraft: () => void;
  startNewDraft: () => string;
  isSaving: boolean;
  lastSaved: Date | null;
  getDraftDisplayName: (draft: AdDraft) => string;
  formatDraftDate: (dateString: string) => string;
}

/**
 * Hook for managing ad drafts in AsyncStorage (React Native)
 * Same API as web version but uses AsyncStorage instead of localStorage
 */
export function useAdDraft(): UseAdDraftReturn {
  const [drafts, setDrafts] = useState<AdDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load drafts from AsyncStorage on mount
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AD_DRAFTS);
      if (stored) {
        const parsedDrafts = JSON.parse(stored) as AdDraft[];
        parsedDrafts.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  // Save drafts to AsyncStorage
  const persistDrafts = useCallback(async (updatedDrafts: AdDraft[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AD_DRAFTS, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Error saving drafts:', error);
      // If storage is full, try removing oldest drafts
      if (updatedDrafts.length > 5) {
        const trimmedDrafts = updatedDrafts.slice(0, 5);
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.AD_DRAFTS, JSON.stringify(trimmedDrafts));
          setDrafts(trimmedDrafts);
        } catch (e) {
          console.error('Error saving trimmed drafts:', e);
        }
      }
    }
  }, []);

  const generateDraftId = (): string => {
    return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const startNewDraft = useCallback((): string => {
    const newId = generateDraftId();
    setCurrentDraftId(newId);
    return newId;
  }, []);

  const saveDraft = useCallback((
    formData: AdDraftFormData,
    customFields: Record<string, unknown> = {}
  ) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const hasContent = formData.title.trim() ||
                       formData.description.trim() ||
                       formData.price.trim() ||
                       formData.categoryId;

    if (!hasContent) {
      return;
    }

    setLastSaved(null);

    debounceTimer.current = setTimeout(() => {
      setIsSaving(true);

      setTimeout(async () => {
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
            updatedDrafts = [...prevDrafts];
            updatedDrafts[existingIndex] = draft;
          } else {
            updatedDrafts = [draft, ...prevDrafts];
          }

          if (updatedDrafts.length > 10) {
            updatedDrafts = updatedDrafts.slice(0, 10);
          }

          persistDrafts(updatedDrafts);
          return updatedDrafts;
        });

        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 500);
      }, 50);
    }, DEBOUNCE_MS);
  }, [currentDraftId, drafts, persistDrafts]);

  const loadDraft = useCallback((draftId: string): AdDraft | null => {
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      setCurrentDraftId(draftId);
      return draft;
    }
    return null;
  }, [drafts]);

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

  const clearCurrentDraft = useCallback(() => {
    if (currentDraftId) {
      deleteDraft(currentDraftId);
    }
    setCurrentDraftId(null);
    setLastSaved(null);
  }, [currentDraftId, deleteDraft]);

  const getDraftDisplayName = useCallback((draft: AdDraft): string => {
    if (draft.title.trim()) {
      return draft.title.trim();
    }

    const date = new Date(draft.updatedAt);
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

  const formatDraftDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
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
