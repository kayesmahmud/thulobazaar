/**
 * useUpload Hook
 *
 * Generic upload hook for React Native that handles file uploads
 * with progress tracking and validation.
 */

import { useState, useCallback } from 'react';
import type {
  CrossPlatformFile,
  UploadProgress,
  UploadResult,
  MultiUploadResult,
  UploadConfig,
} from '@thulobazaar/types';
import {
  validateFile,
  validateFiles,
  appendFileToFormData,
  appendFilesToFormData,
  UPLOAD_CONFIGS,
} from '@thulobazaar/upload-utils';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';
import * as SecureStore from 'expo-secure-store';

export interface UseUploadOptions {
  /** Upload endpoint (relative to API_BASE_URL) */
  endpoint: string;
  /** Upload configuration for validation */
  config?: UploadConfig;
  /** Field name for the file in FormData */
  fieldName?: string;
  /** Additional form data to include */
  additionalData?: Record<string, string>;
  /** Callback for upload progress */
  onProgress?: (progress: UploadProgress) => void;
}

export interface UseUploadResult {
  /** Upload a single file */
  upload: (file: CrossPlatformFile) => Promise<UploadResult>;
  /** Upload multiple files */
  uploadMultiple: (files: CrossPlatformFile[]) => Promise<MultiUploadResult>;
  /** Current upload progress */
  progress: UploadProgress | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Get auth token from secure storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Upload hook with progress tracking
 */
export function useUpload(options: UseUploadOptions): UseUploadResult {
  const {
    endpoint,
    config = UPLOAD_CONFIGS.adImage,
    fieldName = 'file',
    additionalData,
    onProgress,
  } = options;

  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: CrossPlatformFile): Promise<UploadResult> => {
      try {
        setLoading(true);
        setError(null);
        setProgress({ loaded: 0, total: file.size, percentage: 0 });

        // Validate file
        const validation = validateFile(file, config);
        if (!validation.valid) {
          const errorMsg = validation.errors.join(', ');
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        // Get auth token
        const token = await getAuthToken();

        // Create FormData
        const formData = new FormData();
        appendFileToFormData(formData, fieldName, file);

        // Add additional data
        if (additionalData) {
          Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }

        // Upload with XMLHttpRequest for progress tracking
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const uploadProgress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              };
              setProgress(uploadProgress);
              onProgress?.(uploadProgress);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve({
                  success: true,
                  url: response.data?.url || response.url,
                  filename: response.data?.filename || response.filename,
                });
              } catch {
                resolve({ success: true });
              }
            } else {
              let errorMsg = 'Upload failed';
              try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || response.error || errorMsg;
              } catch {
                // Use default error message
              }
              setError(errorMsg);
              resolve({ success: false, error: errorMsg });
            }
          };

          xhr.onerror = () => {
            const errorMsg = 'Network error during upload';
            setError(errorMsg);
            resolve({ success: false, error: errorMsg });
          };

          xhr.open('POST', `${API_BASE_URL}${endpoint}`);
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          xhr.send(formData);
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [endpoint, config, fieldName, additionalData, onProgress]
  );

  const uploadMultiple = useCallback(
    async (files: CrossPlatformFile[]): Promise<MultiUploadResult> => {
      try {
        setLoading(true);
        setError(null);

        // Validate all files
        const validation = validateFiles(files, config);
        if (!validation.valid) {
          const errorMsg = validation.errors.join(', ');
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        // Get auth token
        const token = await getAuthToken();

        // Create FormData with all files
        const formData = new FormData();
        appendFilesToFormData(formData, fieldName, files);

        // Add additional data
        if (additionalData) {
          Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }

        // Calculate total size for progress
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        setProgress({ loaded: 0, total: totalSize, percentage: 0 });

        // Upload
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const uploadProgress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              };
              setProgress(uploadProgress);
              onProgress?.(uploadProgress);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve({
                  success: true,
                  urls: response.data?.urls || response.urls || [],
                  filenames: response.data?.filenames || response.filenames || [],
                });
              } catch {
                resolve({ success: true, urls: [], filenames: [] });
              }
            } else {
              let errorMsg = 'Upload failed';
              try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || response.error || errorMsg;
              } catch {
                // Use default error message
              }
              setError(errorMsg);
              resolve({ success: false, error: errorMsg });
            }
          };

          xhr.onerror = () => {
            const errorMsg = 'Network error during upload';
            setError(errorMsg);
            resolve({ success: false, error: errorMsg });
          };

          xhr.open('POST', `${API_BASE_URL}${endpoint}`);
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          xhr.send(formData);
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [endpoint, config, fieldName, additionalData, onProgress]
  );

  const reset = useCallback(() => {
    setProgress(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    upload,
    uploadMultiple,
    progress,
    loading,
    error,
    reset,
  };
}

/**
 * Specialized hook for avatar uploads
 */
export function useAvatarUpload() {
  return useUpload({
    endpoint: '/api/profile/avatar',
    config: UPLOAD_CONFIGS.avatar,
    fieldName: 'avatar',
  });
}

/**
 * Specialized hook for cover uploads
 */
export function useCoverUpload() {
  return useUpload({
    endpoint: '/api/profile/cover',
    config: UPLOAD_CONFIGS.cover,
    fieldName: 'cover',
  });
}

/**
 * Specialized hook for ad image uploads
 */
export function useAdImageUpload() {
  return useUpload({
    endpoint: '/api/ads',
    config: UPLOAD_CONFIGS.adImage,
    fieldName: 'images',
  });
}

/**
 * Specialized hook for message image uploads
 */
export function useMessageImageUpload(conversationId: number) {
  return useUpload({
    endpoint: '/api/messages/upload',
    config: UPLOAD_CONFIGS.messageImage,
    fieldName: 'image',
    additionalData: { conversationId: conversationId.toString() },
  });
}

export default useUpload;
