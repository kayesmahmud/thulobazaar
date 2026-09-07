/**
 * Photos in support conversations (Live Chat + tickets), shared by the REST
 * routes, the socket handler and the upload endpoint.
 *
 * The cap is counted from stored messages, not from an in-memory limiter, so
 * it survives restarts and is the same number whichever entry point the
 * client used. Uploads are pre-checked against the same count so the user is
 * refused before picking a file, not after the upload finished.
 */
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';

export const SUPPORT_IMAGE_LIMIT = 5;
export const SUPPORT_IMAGE_WINDOW_MINUTES = 10;
const SUPPORT_IMAGE_WINDOW_MS = SUPPORT_IMAGE_WINDOW_MINUTES * 60 * 1000;

/** Clients map this code to their own localized copy. */
export const SUPPORT_IMAGE_LIMIT_CODE = 'SUPPORT_IMAGE_LIMIT';
export const SUPPORT_IMAGE_LIMIT_MESSAGE =
  `You can send up to ${SUPPORT_IMAGE_LIMIT} photos every ${SUPPORT_IMAGE_WINDOW_MINUTES} minutes. Please wait a few minutes.`;

/** Preview text for lists/notifications when a message is only a photo. */
export const SUPPORT_PHOTO_PREVIEW = '📷 Photo';

// Only files the message upload pipeline produced — never an arbitrary URL.
const SUPPORT_ATTACHMENT_URL = /^\/uploads\/messages\/[\w.-]+\.(avif|jpe?g|png|webp|gif)$/i;

export interface SupportMessageInput {
  content: string;
  type: 'text' | 'image';
  attachmentUrl: string | null;
}

/**
 * Validate the body of any "send a support message" entry point. A photo may
 * carry an optional caption; a text message must have content.
 */
export function parseSupportMessageInput(
  body: { content?: unknown; attachmentUrl?: unknown } | null | undefined
): { ok: true; value: SupportMessageInput } | { ok: false; message: string } {
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const attachmentUrl = body?.attachmentUrl;

  if (attachmentUrl !== undefined && attachmentUrl !== null && attachmentUrl !== '') {
    if (typeof attachmentUrl !== 'string' || !SUPPORT_ATTACHMENT_URL.test(attachmentUrl)) {
      return { ok: false, message: 'Invalid attachment' };
    }
    return { ok: true, value: { content, type: 'image', attachmentUrl } };
  }

  if (!content) {
    return { ok: false, message: 'Message content is required' };
  }
  return { ok: true, value: { content, type: 'text', attachmentUrl: null } };
}

export async function countRecentSupportImages(userId: number): Promise<number> {
  return prisma.support_messages.count({
    where: {
      sender_id: userId,
      attachment_url: { not: null },
      created_at: { gte: new Date(Date.now() - SUPPORT_IMAGE_WINDOW_MS) },
    },
  });
}

export async function supportImageQuotaExceeded(userId: number): Promise<boolean> {
  return (await countRecentSupportImages(userId)) >= SUPPORT_IMAGE_LIMIT;
}

/** Refuse the upload up front when the sender has no photo budget left. */
export async function requireSupportImageQuota(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  if (await supportImageQuotaExceeded(userId)) {
    res.status(429).json({
      success: false,
      code: SUPPORT_IMAGE_LIMIT_CODE,
      message: SUPPORT_IMAGE_LIMIT_MESSAGE,
    });
    return;
  }
  next();
}

export function supportMessagePreview(content: string, attachmentUrl: string | null): string {
  if (content) return content;
  return attachmentUrl ? SUPPORT_PHOTO_PREVIEW : '';
}
