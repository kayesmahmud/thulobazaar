import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import type { Request, Response } from 'express';
import { optimizeImage } from '../../middleware/optimizeImage.js';

/**
 * Phone cameras store a portrait shot as LANDSCAPE sensor pixels plus an EXIF
 * orientation tag (6 = "rotate 90° clockwise to display"). The Flutter picker
 * preserves that tag on Android. If the server does not bake the tag into the
 * pixels, the AVIF encoder keeps the rotation as an `irot` box that browsers
 * honour but flutter_avif ignores — so portrait ads showed landscape in-app.
 */
const SENSOR_WIDTH = 1200;
const SENSOR_HEIGHT = 900;
const BACKGROUND = { r: 40, g: 90, b: 200 };

async function cameraJpeg(orientation: number): Promise<Buffer> {
  return sharp({
    create: { width: SENSOR_WIDTH, height: SENSOR_HEIGHT, channels: 3, background: BACKGROUND },
  })
    .jpeg()
    .withMetadata({ orientation })
    .toBuffer();
}

async function runAdPipeline(dir: string, input: Buffer, name: string): Promise<Buffer> {
  const filePath = path.join(dir, `${name}.jpg`);
  await fs.promises.writeFile(filePath, input);

  const req = { file: { path: filePath, filename: `${name}.jpg`, mimetype: 'image/jpeg' } } as Request;
  await new Promise<void>((resolve) =>
    optimizeImage('ad')(req, {} as Response, () => resolve())
  );

  expect(req.file?.filename).toBe(`${name}.avif`);
  return fs.promises.readFile(req.file!.path);
}

/** Pixel variation in a patch — ~0 on the solid background, clearly positive where the logo sits. */
async function patchVariation(
  image: Buffer,
  region: { left: number; top: number; width: number; height: number }
): Promise<number> {
  // stats() reads the ORIGINAL input and ignores extract(), so crop to a buffer first
  const crop = await sharp(image).extract(region).png().toBuffer();
  const { channels } = await sharp(crop).stats();
  return Math.max(...channels.slice(0, 3).map((c) => c.stdev));
}

describe('optimizeImage("ad") and EXIF orientation', () => {
  let dir: string;
  beforeAll(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'optimize-image-'));
  });
  afterAll(() => fs.promises.rm(dir, { recursive: true, force: true }));

  it('bakes a portrait (orientation 6) shot into portrait pixels with no irot box', async () => {
    const out = await runAdPipeline(dir, await cameraJpeg(6), 'portrait');

    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('heif');
    expect(meta.width).toBe(SENSOR_HEIGHT);
    expect(meta.height).toBe(SENSOR_WIDTH);
    expect(meta.orientation).toBeUndefined();
    expect(out.includes(Buffer.from('irot'))).toBe(false);
  });

  it('places the watermark bottom-right of the DISPLAYED portrait image', async () => {
    const out = await runAdPipeline(dir, await cameraJpeg(6), 'portrait-wm');
    const width = SENSOR_HEIGHT;
    const height = SENSOR_WIDTH;
    const patch = { width: Math.round(width * 0.2), height: Math.round(height * 0.08) };
    const top = height - patch.height;

    const bottomRight = await patchVariation(out, { left: width - patch.width, top, ...patch });
    const bottomLeft = await patchVariation(out, { left: 0, top, ...patch });

    // Before the fix the overlay was composited on the un-rotated sensor
    // pixels, so after the browser's rotation it landed bottom-LEFT.
    expect(bottomRight).toBeGreaterThan(2);
    expect(bottomLeft).toBeLessThan(1);
  });

  it('keeps a landscape (orientation 1) shot landscape', async () => {
    const out = await runAdPipeline(dir, await cameraJpeg(1), 'landscape');
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(SENSOR_WIDTH);
    expect(meta.height).toBe(SENSOR_HEIGHT);
  });

  it('bakes an upside-down (orientation 3) shot instead of storing an irot box', async () => {
    const out = await runAdPipeline(dir, await cameraJpeg(3), 'upside-down');
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(SENSOR_WIDTH);
    expect(meta.height).toBe(SENSOR_HEIGHT);
    expect(out.includes(Buffer.from('irot'))).toBe(false);
  });
});
