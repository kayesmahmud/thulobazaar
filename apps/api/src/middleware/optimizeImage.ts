import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { adWatermarkOverlay } from '../lib/watermark.js';

type OutputFormat = 'jpeg' | 'avif';

interface OptimizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  effort?: number;
  format: OutputFormat;
  // Ad photos only — avatars, chat images and verification docs must stay clean
  watermark?: boolean;
}

const PRESETS: Record<string, OptimizeOptions> = {
  avatar: { maxWidth: 500, maxHeight: 500, quality: 85, format: 'jpeg' },
  cover: { maxWidth: 1920, maxHeight: 1080, quality: 85, format: 'jpeg' },
  // effort 2 (not 4): encoding runs inline before the response, and on the
  // shared t3.small effort 4 costs tens of seconds per image for ~5% size gain.
  ad: { maxWidth: 1920, maxHeight: 1920, quality: 65, effort: 2, format: 'avif', watermark: true },
  message: { maxWidth: 1200, maxHeight: 1200, quality: 45, effort: 2, format: 'avif' },
  document: { maxWidth: 1920, maxHeight: 1920, quality: 70, effort: 2, format: 'avif' },
};

/**
 * Optimize a single image file in-place using sharp.
 * Resizes and compresses to JPEG.
 */
async function optimizeFile(filePath: string, opts: OptimizeOptions): Promise<void> {
  const buffer = await fs.promises.readFile(filePath);

  const metadata = await sharp(buffer).metadata();

  // Skip non-image formats (like PDFs)
  if (!metadata.format || !['jpeg', 'png', 'webp', 'gif', 'tiff', 'heif'].includes(metadata.format)) {
    return;
  }

  // Phone cameras store portrait shots as landscape pixels plus an EXIF
  // orientation tag. rotate() bakes that tag into the pixels; without it the
  // AVIF encoder keeps the rotation as an `irot` box that browsers honour but
  // the Flutter AVIF decoder ignores, so portrait ads showed landscape in-app.
  let instance = sharp(buffer).rotate();

  // Dimensions as displayed (after orientation), not as stored
  const { width, height } = metadata.autoOrient;

  // Only resize if image is larger than max dimensions
  const needsResize = width > opts.maxWidth || height > opts.maxHeight;

  if (needsResize) {
    instance = instance.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  if (opts.watermark && width && height) {
    // sharp applies composite after resize, so size the overlay for the
    // final dimensions (fit: 'inside' preserves aspect ratio)
    const scale = needsResize
      ? Math.min(opts.maxWidth / width, opts.maxHeight / height)
      : 1;
    const overlay = await adWatermarkOverlay(
      Math.round(width * scale),
      Math.round(height * scale)
    );
    if (overlay.length > 0) {
      instance = instance.composite(overlay);
    }
  }

  // Compress with the preset's format
  const optimized = opts.format === 'avif'
    ? await instance.avif({ quality: opts.quality, effort: opts.effort, chromaSubsampling: '4:2:0' }).toBuffer()
    : await instance.jpeg({ quality: opts.quality }).toBuffer();

  // Overwrite the original file with optimized version
  const ext = opts.format === 'avif' ? '.avif' : '.jpg';
  const parsed = path.parse(filePath);
  const newPath = path.join(parsed.dir, `${parsed.name}${ext}`);
  await fs.promises.writeFile(newPath, optimized);

  // Remove original if extension changed
  if (newPath !== filePath) {
    await fs.promises.unlink(filePath);
  }
}

/**
 * Express middleware that optimizes uploaded images after multer saves them.
 * Usage: router.post('/upload', multerUpload.single('image'), optimizeImage('avatar'), handler)
 */
export function optimizeImage(preset: keyof typeof PRESETS = 'ad') {
  const opts = PRESETS[preset];

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const ext = opts.format === 'avif' ? '.avif' : '.jpg';
      const mime = opts.format === 'avif' ? 'image/avif' : 'image/jpeg';

      // Handle single file upload
      if (req.file) {
        await optimizeFile(req.file.path, opts);
        const parsed = path.parse(req.file.filename);
        req.file.filename = `${parsed.name}${ext}`;
        req.file.path = path.join(path.dirname(req.file.path), req.file.filename);
        req.file.mimetype = mime;
      }

      // Handle multiple file uploads
      if (req.files) {
        const files = Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat();

        for (const file of files) {
          await optimizeFile(file.path, opts);
          const parsed = path.parse(file.filename);
          file.filename = `${parsed.name}${ext}`;
          file.path = path.join(path.dirname(file.path), file.filename);
          file.mimetype = mime;
        }
      }

      next();
    } catch (error) {
      console.error('Image optimization error:', error);
      // Don't block upload if optimization fails — continue with original
      next();
    }
  };
}
