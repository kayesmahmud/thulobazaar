/**
 * React Native-specific Upload Utilities
 *
 * Utilities for converting expo-image-picker results to CrossPlatformFile.
 * Only import this in React Native environments.
 */

import type { CrossPlatformFile, CrossPlatformImage, UploadConfig } from '@thulobazaar/types';
import { UPLOAD_CONFIGS } from '@thulobazaar/types';
import { getMimeTypeFromExtension, getFileExtension } from './validation';

/**
 * Type for expo-image-picker result asset
 */
interface ImagePickerAsset {
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  base64?: string;
}

/**
 * Type for expo-image-picker result
 */
interface ImagePickerResult {
  canceled: boolean;
  assets?: ImagePickerAsset[];
}

/**
 * Convert an expo-image-picker asset to CrossPlatformImage
 */
export function imagePickerAssetToUploadFile(asset: ImagePickerAsset): CrossPlatformImage {
  // Generate filename if not provided
  const extension = asset.mimeType?.split('/')[1] || 'jpg';
  const filename = asset.fileName || `image_${Date.now()}.${extension}`;

  // Get MIME type
  const mimeType = asset.mimeType || getMimeTypeFromExtension(getFileExtension(filename));

  return {
    name: filename,
    type: mimeType,
    size: asset.fileSize || 0,
    uri: asset.uri,
    dimensions: {
      width: asset.width,
      height: asset.height,
    },
    base64: asset.base64,
  };
}

/**
 * Convert expo-image-picker result to CrossPlatformImage array
 * Returns empty array if picker was cancelled
 */
export function imagePickerResultToUploadFiles(result: ImagePickerResult): CrossPlatformImage[] {
  if (result.canceled || !result.assets) {
    return [];
  }
  return result.assets.map(imagePickerAssetToUploadFile);
}

/**
 * Get the first image from picker result, or null if cancelled
 */
export function imagePickerResultToSingleFile(
  result: ImagePickerResult
): CrossPlatformImage | null {
  const files = imagePickerResultToUploadFiles(result);
  return files.length > 0 ? files[0] : null;
}

/**
 * Image picker options builder
 */
export interface PickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
  mediaTypes?: 'images' | 'videos' | 'all';
  base64?: boolean;
}

/**
 * Get picker options for avatar selection
 */
export function getAvatarPickerOptions(): PickerOptions {
  return {
    allowsEditing: true,
    aspect: [1, 1],
    quality: UPLOAD_CONFIGS.avatar.compressionQuality || 0.8,
    allowsMultipleSelection: false,
    mediaTypes: 'images',
  };
}

/**
 * Get picker options for cover photo selection
 */
export function getCoverPickerOptions(): PickerOptions {
  return {
    allowsEditing: true,
    aspect: [16, 9],
    quality: UPLOAD_CONFIGS.cover.compressionQuality || 0.85,
    allowsMultipleSelection: false,
    mediaTypes: 'images',
  };
}

/**
 * Get picker options for ad images selection
 */
export function getAdImagesPickerOptions(remainingSlots: number = 10): PickerOptions {
  return {
    allowsEditing: false,
    quality: UPLOAD_CONFIGS.adImage.compressionQuality || 0.85,
    allowsMultipleSelection: true,
    selectionLimit: Math.min(remainingSlots, UPLOAD_CONFIGS.adImage.maxFiles || 10),
    mediaTypes: 'images',
  };
}

/**
 * Get picker options for message image selection
 */
export function getMessageImagePickerOptions(): PickerOptions {
  return {
    allowsEditing: false,
    quality: UPLOAD_CONFIGS.messageImage.compressionQuality || 0.8,
    allowsMultipleSelection: false,
    mediaTypes: 'images',
  };
}

/**
 * Get picker options for verification document selection
 */
export function getVerificationDocPickerOptions(): PickerOptions {
  return {
    allowsEditing: false,
    quality: 1.0, // Don't compress verification docs
    allowsMultipleSelection: false,
    mediaTypes: 'images',
  };
}

/**
 * Compress image using expo-image-manipulator
 * This is a factory function - you need to pass the manipulateAsync function
 */
export async function compressImageNative(
  uri: string,
  manipulateAsync: (
    uri: string,
    actions: Array<{ resize?: { width?: number; height?: number } }>,
    options: { compress?: number; format?: 'jpeg' | 'png' }
  ) => Promise<{ uri: string; width: number; height: number }>,
  options: {
    quality?: number;
    maxDimension?: number;
    width?: number;
    height?: number;
  } = {}
): Promise<{ uri: string; width: number; height: number }> {
  const { quality = 0.8, maxDimension, width, height } = options;

  const actions: Array<{ resize?: { width?: number; height?: number } }> = [];

  // Add resize action if dimensions are specified
  if (maxDimension || width || height) {
    actions.push({
      resize: {
        width: width || maxDimension,
        height: height || maxDimension,
      },
    });
  }

  return manipulateAsync(uri, actions, {
    compress: quality,
    format: 'jpeg',
  });
}

/**
 * Estimate file size from image dimensions (rough estimate)
 * Useful when fileSize is not available from picker
 */
export function estimateImageSize(
  width: number,
  height: number,
  quality: number = 0.8
): number {
  // Rough estimation: compressed JPEG is about 0.5-1.5 bytes per pixel
  const pixelCount = width * height;
  const bytesPerPixel = quality * 1.5;
  return Math.round(pixelCount * bytesPerPixel);
}

/**
 * Generate a unique filename for uploads
 */
export function generateUploadFilename(
  prefix: string,
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

// Re-export common utilities
export * from './validation';
export * from './formData';
