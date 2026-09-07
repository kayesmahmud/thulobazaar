// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { processAndSaveImage } from '@/lib/utils/image';

/**
 * Phone cameras store a portrait shot as LANDSCAPE sensor pixels plus an EXIF
 * orientation tag (6 = "rotate 90° clockwise to display"). Re-encoding with
 * sharp drops the tag, so without rotate() the saved JPEG came out sideways.
 * Twin of apps/api/src/__tests__/middleware/optimizeImage.test.ts.
 */
const SENSOR_WIDTH = 1200;
const SENSOR_HEIGHT = 900;

async function cameraJpegFile(orientation: number): Promise<File> {
  const buffer = await sharp({
    create: { width: SENSOR_WIDTH, height: SENSOR_HEIGHT, channels: 3, background: '#285ac8' },
  })
    .jpeg()
    .withMetadata({ orientation })
    .toBuffer();
  return new File([new Uint8Array(buffer)], 'camera.jpg', { type: 'image/jpeg' });
}

describe('processAndSaveImage and EXIF orientation', () => {
  let dir: string;
  // processAndSaveImage resolves uploadDir under <cwd>/public, so point it at a temp dir
  let uploadDir: string;

  beforeAll(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'web-image-'));
    uploadDir = path.relative(path.join(process.cwd(), 'public'), dir);
  });
  afterAll(() => fs.promises.rm(dir, { recursive: true, force: true }));

  it('bakes a portrait (orientation 6) shot into portrait pixels', async () => {
    const result = await processAndSaveImage(await cameraJpegFile(6), uploadDir, { watermark: true });

    const meta = await sharp(path.join(dir, result.filename)).metadata();
    expect(meta.width).toBe(SENSOR_HEIGHT);
    expect(meta.height).toBe(SENSOR_WIDTH);
    expect(meta.orientation).toBeUndefined();
  });

  it('keeps a landscape (orientation 1) shot landscape', async () => {
    const result = await processAndSaveImage(await cameraJpegFile(1), uploadDir);

    const meta = await sharp(path.join(dir, result.filename)).metadata();
    expect(meta.width).toBe(SENSOR_WIDTH);
    expect(meta.height).toBe(SENSOR_HEIGHT);
  });
});
