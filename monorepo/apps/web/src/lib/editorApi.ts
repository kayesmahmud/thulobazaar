/**
 * Editor API Service
 *
 * @deprecated Import from '@/lib/editorApi' (the directory) instead.
 * This file re-exports from the new modular structure for backward compatibility.
 *
 * @example
 * // Old way (still works)
 * import { getAds, approveAd } from '@/lib/editorApi';
 *
 * // New recommended way
 * import { getAds, approveAd } from '@/lib/editorApi';
 * import type { Ad, ApiResponse } from '@/lib/editorApi';
 */

// Re-export everything from the new modular structure
export * from './editorApi/index';
