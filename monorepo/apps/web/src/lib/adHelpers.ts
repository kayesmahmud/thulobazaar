import { prisma } from '@thulobazaar/database';

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 100); // Limit length
}

/**
 * Generate a unique slug by checking database and appending numbers if needed
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlugFromTitle(title);

  // Check if base slug is available
  const existing = await prisma.ads.findFirst({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existing) {
    return baseSlug;
  }

  // Find next available number suffix
  let counter = 1;
  while (counter < 1000) {
    const testSlug = `${baseSlug}-${counter}`;
    const exists = await prisma.ads.findFirst({
      where: { slug: testSlug },
      select: { id: true },
    });

    if (!exists) {
      return testSlug;
    }
    counter++;
  }

  // Fallback: append timestamp
  return `${baseSlug}-${Date.now()}`;
}

/**
 * Save uploaded images to database
 */
export async function saveAdImages(
  adId: number,
  files: Array<{ filename: string; originalname: string; path: string; size: number; mimetype: string }>
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    await prisma.ad_images.create({
      data: {
        ad_id: adId,
        filename: file.filename,
        original_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        is_primary: i === 0, // First image is primary
      },
    });
  }
}

/**
 * Delete image files and database records
 */
export async function deleteAdImages(imageIds: number[]): Promise<void> {
  if (imageIds.length === 0) return;

  // Get file paths before deleting from DB
  const images = await prisma.ad_images.findMany({
    where: { id: { in: imageIds } },
    select: { file_path: true },
  });

  // Delete from database
  await prisma.ad_images.deleteMany({
    where: { id: { in: imageIds } },
  });

  // Delete physical files
  const { unlink } = await import('fs/promises');
  const path = await import('path');

  for (const image of images) {
    try {
      const filePath = path.join(process.cwd(), 'public', image.file_path);
      await unlink(filePath);
    } catch (err) {
      console.log(`Could not delete file: ${image.file_path}`);
    }
  }
}

/**
 * Validate ad ownership
 */
export async function validateAdOwnership(adId: number, userId: number): Promise<boolean> {
  const ad = await prisma.ads.findUnique({
    where: { id: adId },
    select: { user_id: true },
  });

  return ad?.user_id === userId;
}
