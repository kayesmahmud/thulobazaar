/**
 * Support photo rules for the Next.js ticket route — the twin of
 * apps/api/src/services/supportAttachments.ts. The Next route writes messages
 * with Prisma directly (staff replies land here when the socket is down), so
 * it has to apply the same cap and the same URL rule as Express. Keep the two
 * in sync.
 */
import { prisma } from '@thulobazaar/database';

export const SUPPORT_IMAGE_LIMIT = 5;
export const SUPPORT_IMAGE_WINDOW_MINUTES = 10;
const SUPPORT_IMAGE_WINDOW_MS = SUPPORT_IMAGE_WINDOW_MINUTES * 60 * 1000;

export const SUPPORT_IMAGE_LIMIT_CODE = 'SUPPORT_IMAGE_LIMIT';
export const SUPPORT_IMAGE_LIMIT_MESSAGE =
  `You can send up to ${SUPPORT_IMAGE_LIMIT} photos every ${SUPPORT_IMAGE_WINDOW_MINUTES} minutes. Please wait a few minutes.`;

const SUPPORT_ATTACHMENT_URL = /^\/uploads\/messages\/[\w.-]+\.(avif|jpe?g|png|webp|gif)$/i;

export function isSupportAttachmentUrl(url: unknown): url is string {
  return typeof url === 'string' && SUPPORT_ATTACHMENT_URL.test(url);
}

export async function supportImageQuotaExceeded(userId: number): Promise<boolean> {
  const recent = await prisma.support_messages.count({
    where: {
      sender_id: userId,
      attachment_url: { not: null },
      created_at: { gte: new Date(Date.now() - SUPPORT_IMAGE_WINDOW_MS) },
    },
  });
  return recent >= SUPPORT_IMAGE_LIMIT;
}
