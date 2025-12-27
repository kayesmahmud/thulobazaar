/**
 * useImagePicker Hook
 *
 * Cross-platform image picker hook that wraps expo-image-picker
 * and returns CrossPlatformFile objects ready for upload.
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import type { CrossPlatformImage } from '@thulobazaar/types';
import {
  imagePickerResultToUploadFiles,
  imagePickerResultToSingleFile,
  getAvatarPickerOptions,
  getCoverPickerOptions,
  getAdImagesPickerOptions,
  getMessageImagePickerOptions,
  getVerificationDocPickerOptions,
} from '@thulobazaar/upload-utils/native';

export interface UseImagePickerResult {
  /** Currently selected images */
  images: CrossPlatformImage[];
  /** Pick single image from library */
  pickImage: () => Promise<CrossPlatformImage | null>;
  /** Pick multiple images from library */
  pickImages: (limit?: number) => Promise<CrossPlatformImage[]>;
  /** Take photo with camera */
  takePhoto: () => Promise<CrossPlatformImage | null>;
  /** Pick avatar (square crop) */
  pickAvatar: () => Promise<CrossPlatformImage | null>;
  /** Pick cover photo (16:9 crop) */
  pickCover: () => Promise<CrossPlatformImage | null>;
  /** Pick verification document */
  pickDocument: () => Promise<CrossPlatformImage | null>;
  /** Clear selected images */
  clearImages: () => void;
  /** Remove image at index */
  removeImage: (index: number) => void;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Request camera/library permissions
 */
async function requestPermissions(type: 'camera' | 'library'): Promise<boolean> {
  if (type === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library permission is required to select images.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }
  return true;
}

/**
 * Image picker hook for selecting and managing images
 */
export function useImagePicker(): UseImagePickerResult {
  const [images, setImages] = useState<CrossPlatformImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = useCallback(async (): Promise<CrossPlatformImage | null> => {
    try {
      setLoading(true);
      setError(null);

      const hasPermission = await requestPermissions('library');
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      const file = imagePickerResultToSingleFile(result);
      if (file) {
        setImages((prev) => [...prev, file]);
      }
      return file;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick image';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const pickImages = useCallback(
    async (limit: number = 10): Promise<CrossPlatformImage[]> => {
      try {
        setLoading(true);
        setError(null);

        const hasPermission = await requestPermissions('library');
        if (!hasPermission) return [];

        const options = getAdImagesPickerOptions(limit);
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          ...options,
        });

        const files = imagePickerResultToUploadFiles(result);
        if (files.length > 0) {
          setImages((prev) => [...prev, ...files]);
        }
        return files;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to pick images';
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const takePhoto = useCallback(async (): Promise<CrossPlatformImage | null> => {
    try {
      setLoading(true);
      setError(null);

      const hasPermission = await requestPermissions('camera');
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });

      const file = imagePickerResultToSingleFile(result);
      if (file) {
        setImages((prev) => [...prev, file]);
      }
      return file;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to take photo';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const pickAvatar = useCallback(async (): Promise<CrossPlatformImage | null> => {
    try {
      setLoading(true);
      setError(null);

      const hasPermission = await requestPermissions('library');
      if (!hasPermission) return null;

      const options = getAvatarPickerOptions();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        ...options,
      });

      return imagePickerResultToSingleFile(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick avatar';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const pickCover = useCallback(async (): Promise<CrossPlatformImage | null> => {
    try {
      setLoading(true);
      setError(null);

      const hasPermission = await requestPermissions('library');
      if (!hasPermission) return null;

      const options = getCoverPickerOptions();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        ...options,
      });

      return imagePickerResultToSingleFile(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick cover';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const pickDocument = useCallback(async (): Promise<CrossPlatformImage | null> => {
    try {
      setLoading(true);
      setError(null);

      const hasPermission = await requestPermissions('library');
      if (!hasPermission) return null;

      const options = getVerificationDocPickerOptions();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        ...options,
      });

      return imagePickerResultToSingleFile(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick document';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    images,
    pickImage,
    pickImages,
    takePhoto,
    pickAvatar,
    pickCover,
    pickDocument,
    clearImages,
    removeImage,
    loading,
    error,
  };
}

export default useImagePicker;
