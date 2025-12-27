/**
 * Web-specific Upload Utilities
 *
 * Utilities for converting Web File API objects to CrossPlatformFile.
 * Only import this in web environments.
 */

import type { CrossPlatformFile, CrossPlatformImage } from '@thulobazaar/types';

/**
 * Convert a Web File object to CrossPlatformFile
 */
export function fileToUploadFile(file: File): CrossPlatformFile {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    uri: URL.createObjectURL(file),
    file: file,
  };
}

/**
 * Convert multiple Web File objects to CrossPlatformFile array
 */
export function filesToUploadFiles(files: File[]): CrossPlatformFile[] {
  return files.map(fileToUploadFile);
}

/**
 * Convert FileList to CrossPlatformFile array
 */
export function fileListToUploadFiles(fileList: FileList): CrossPlatformFile[] {
  return Array.from(fileList).map(fileToUploadFile);
}

/**
 * Convert a Web File to CrossPlatformImage with dimensions
 */
export async function fileToUploadImage(file: File): Promise<CrossPlatformImage> {
  const baseFile = fileToUploadFile(file);

  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(baseFile);
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({
        ...baseFile,
        dimensions: {
          width: img.naturalWidth,
          height: img.naturalHeight,
        },
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve(baseFile);
    };
    img.src = baseFile.uri;
  });
}

/**
 * Convert multiple Web Files to CrossPlatformImage array
 */
export async function filesToUploadImages(files: File[]): Promise<CrossPlatformImage[]> {
  return Promise.all(files.map(fileToUploadImage));
}

/**
 * Cleanup object URLs to prevent memory leaks
 */
export function revokeUploadFileUrl(file: CrossPlatformFile): void {
  if (file.uri.startsWith('blob:')) {
    URL.revokeObjectURL(file.uri);
  }
}

/**
 * Cleanup multiple object URLs
 */
export function revokeUploadFileUrls(files: CrossPlatformFile[]): void {
  files.forEach(revokeUploadFileUrl);
}

/**
 * Create a File object from a Blob with a filename
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Compress an image file on the web using canvas
 * @param file - The image file to compress
 * @param quality - Compression quality (0-1)
 * @param maxDimension - Maximum width or height
 */
export async function compressImage(
  file: File,
  quality: number = 0.8,
  maxDimension?: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions if maxDimension is set
      if (maxDimension && (width > maxDimension || height > maxDimension)) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Create new file with same name
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get image dimensions from a File
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Create a data URL from a File
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Create a File from a data URL
 */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

// Re-export common utilities
export * from './validation';
export * from './formData';
