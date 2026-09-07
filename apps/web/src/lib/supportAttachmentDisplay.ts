/**
 * Client-side helpers for showing support photos. Kept separate from
 * supportAttachments.ts, which imports Prisma and must stay server-only.
 */

/** The upload pipeline re-encodes every photo to .avif, so the list must include it. */
const IMAGE_URL = /\.(avif|jpe?g|png|gif|webp)(\?.*)?$/i;

export const SUPPORT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SUPPORT_IMAGE_LIMIT_CODE = 'SUPPORT_IMAGE_LIMIT';

export function isImageAttachment(message: {
  type?: string | null;
  attachmentUrl?: string | null;
}): boolean {
  if (!message.attachmentUrl) return false;
  if (message.type === 'image') return true;
  return IMAGE_URL.test(message.attachmentUrl);
}
