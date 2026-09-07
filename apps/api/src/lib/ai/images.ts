/**
 * Prepare stored images for AI vision calls.
 *
 * DeepSeek accepts JPEG/PNG/GIF/WebP but NOT AVIF — and optimizeImage stores
 * ads as AVIF (older uploads are jpg/webp/png). So every image is re-encoded
 * to a small JPEG data URL regardless of on-disk format. DeepSeek downscales
 * to ~800px internally, so 768px costs nothing in accuracy and keeps the
 * request payload small.
 */
import fs from 'fs';
import sharp from 'sharp';

const AI_IMAGE_MAX_DIM = 768;
const AI_IMAGE_JPEG_QUALITY = 80;

async function toDataUrl(input: Buffer): Promise<string> {
  const buffer = await sharp(input)
    // Raw uploads carry an EXIF orientation tag; the model should see the photo upright
    .rotate()
    .resize(AI_IMAGE_MAX_DIM, AI_IMAGE_MAX_DIM, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: AI_IMAGE_JPEG_QUALITY })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

/** Absolute disk paths in, JPEG data URLs out. Unreadable files are skipped. */
export async function imagesToDataUrls(absolutePaths: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const filePath of absolutePaths) {
    try {
      results.push(await toDataUrl(await fs.promises.readFile(filePath)));
    } catch (err) {
      console.error(`AI image prep failed for ${filePath}:`, err);
    }
  }
  return results;
}

/** In-memory upload buffers in (multer memoryStorage), JPEG data URLs out. */
export async function imageBuffersToDataUrls(buffers: Buffer[]): Promise<string[]> {
  const results: string[] = [];
  for (const input of buffers) {
    try {
      results.push(await toDataUrl(input));
    } catch (err) {
      console.error('AI image prep failed for uploaded buffer:', err);
    }
  }
  return results;
}
