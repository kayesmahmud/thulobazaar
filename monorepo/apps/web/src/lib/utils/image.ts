import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

export interface ProcessedImage {
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  format: 'jpeg',
};

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Validate image file type
 */
export function isValidImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

/**
 * Process and save an uploaded image
 * @param file - The uploaded file
 * @param uploadDir - Directory to save the processed image
 * @param options - Image processing options
 * @returns Processed image information
 */
export async function processAndSaveImage(
  file: File,
  uploadDir: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Read file buffer first
  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate using sharp metadata (more reliable than MIME type)
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch (error) {
    throw new Error('Invalid image file. Unable to process.');
  }

  // Check if format is supported
  const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
  if (!metadata.format || !supportedFormats.includes(metadata.format)) {
    throw new Error(
      `Unsupported image format: ${metadata.format}. Only JPEG, PNG, WEBP, and GIF are allowed.`
    );
  }

  // Generate unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = opts.format === 'jpeg' ? 'jpg' : opts.format;
  const filename = `ad-${uniqueSuffix}.${ext}`;

  // Ensure upload directory exists
  const fullUploadPath = path.join(process.cwd(), 'public', uploadDir);
  await fs.mkdir(fullUploadPath, { recursive: true });

  const outputPath = path.join(fullUploadPath, filename);

  // Process image with sharp
  let sharpInstance = sharp(buffer);

  // Resize if needed
  if (opts.maxWidth || opts.maxHeight) {
    sharpInstance = sharpInstance.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert format and optimize
  switch (opts.format) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({ quality: opts.quality });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality: opts.quality });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality: opts.quality });
      break;
  }

  // Save the processed image
  await sharpInstance.toFile(outputPath);

  // Get file stats
  const stats = await fs.stat(outputPath);

  return {
    filename,
    filePath: path.join(uploadDir, filename).replace(/\\/g, '/'),
    fileSize: stats.size,
    mimeType: `image/${opts.format}`,
  };
}

/**
 * Process multiple images
 * @param files - Array of uploaded files
 * @param uploadDir - Directory to save the processed images
 * @param options - Image processing options
 * @returns Array of processed image information
 */
export async function processMultipleImages(
  files: File[],
  uploadDir: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage[]> {
  const MAX_FILES = 10;

  if (files.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} images allowed`);
  }

  const processedImages: ProcessedImage[] = [];

  for (const file of files) {
    try {
      const processed = await processAndSaveImage(file, uploadDir, options);
      processedImages.push(processed);
    } catch (error) {
      console.error(`Error processing image ${file.name}:`, error);
      // Clean up any successfully processed images
      for (const img of processedImages) {
        try {
          await fs.unlink(path.join(process.cwd(), 'public', img.filePath));
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }

  return processedImages;
}

/**
 * Delete an image file
 * @param filePath - Relative path to the image (from public folder)
 */
export async function deleteImage(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
    console.log(`Deleted image: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting image ${filePath}:`, error);
    // Don't throw - image might not exist
  }
}

/**
 * Delete multiple images
 * @param filePaths - Array of relative paths to images
 */
export async function deleteMultipleImages(filePaths: string[]): Promise<void> {
  await Promise.all(filePaths.map(deleteImage));
}
