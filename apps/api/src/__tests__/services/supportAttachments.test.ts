import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    support_messages: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@thulobazaar/database';
import {
  parseSupportMessageInput,
  requireSupportImageQuota,
  supportImageQuotaExceeded,
  supportMessagePreview,
  SUPPORT_IMAGE_LIMIT,
  SUPPORT_IMAGE_LIMIT_CODE,
  SUPPORT_PHOTO_PREVIEW,
} from '../../services/supportAttachments.js';

const UPLOADED = '/uploads/messages/msg_7_1725700000000_ab12cd.avif';

describe('parseSupportMessageInput', () => {
  it('accepts a plain text message', () => {
    const parsed = parseSupportMessageInput({ content: '  hello  ' });
    expect(parsed).toEqual({
      ok: true,
      value: { content: 'hello', type: 'text', attachmentUrl: null },
    });
  });

  it('rejects an empty text message', () => {
    expect(parseSupportMessageInput({ content: '   ' }).ok).toBe(false);
    expect(parseSupportMessageInput({}).ok).toBe(false);
    expect(parseSupportMessageInput(null).ok).toBe(false);
  });

  it('accepts a photo with no caption and a photo with a caption', () => {
    expect(parseSupportMessageInput({ attachmentUrl: UPLOADED })).toEqual({
      ok: true,
      value: { content: '', type: 'image', attachmentUrl: UPLOADED },
    });
    expect(parseSupportMessageInput({ content: 'see this', attachmentUrl: UPLOADED })).toEqual({
      ok: true,
      value: { content: 'see this', type: 'image', attachmentUrl: UPLOADED },
    });
  });

  it('only accepts URLs the upload pipeline produces', () => {
    for (const bad of [
      'https://evil.example/x.avif',
      '/uploads/ads/photo.avif',
      '/uploads/messages/../../etc/passwd',
      '/uploads/messages/file.pdf',
      42,
    ]) {
      const parsed = parseSupportMessageInput({ attachmentUrl: bad });
      expect(parsed.ok, String(bad)).toBe(false);
    }
  });
});

describe('support photo cap', () => {
  beforeEach(() => {
    vi.mocked(prisma.support_messages.count).mockReset();
  });

  it('counts only this sender’s photos inside the window', async () => {
    vi.mocked(prisma.support_messages.count).mockResolvedValue(0 as any);
    await supportImageQuotaExceeded(7);
    const args = vi.mocked(prisma.support_messages.count).mock.calls[0][0] as any;
    expect(args.where.sender_id).toBe(7);
    expect(args.where.attachment_url).toEqual({ not: null });
    const since = args.where.created_at.gte as Date;
    expect(Date.now() - since.getTime()).toBeGreaterThan(9 * 60 * 1000);
    expect(Date.now() - since.getTime()).toBeLessThan(11 * 60 * 1000);
  });

  it(`allows the ${SUPPORT_IMAGE_LIMIT}th photo and refuses the next one`, async () => {
    vi.mocked(prisma.support_messages.count).mockResolvedValue((SUPPORT_IMAGE_LIMIT - 1) as any);
    expect(await supportImageQuotaExceeded(7)).toBe(false);
    vi.mocked(prisma.support_messages.count).mockResolvedValue(SUPPORT_IMAGE_LIMIT as any);
    expect(await supportImageQuotaExceeded(7)).toBe(true);
  });

  it('refuses the upload with 429 and the client code when the cap is hit', async () => {
    vi.mocked(prisma.support_messages.count).mockResolvedValue(SUPPORT_IMAGE_LIMIT as any);
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();
    await requireSupportImageQuota(
      { user: { userId: 7 } } as any,
      { status, json } as any,
      next
    );
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);
    expect(json.mock.calls[0][0]).toMatchObject({ success: false, code: SUPPORT_IMAGE_LIMIT_CODE });
  });

  it('lets the upload through while there is budget left', async () => {
    vi.mocked(prisma.support_messages.count).mockResolvedValue(0 as any);
    const next = vi.fn();
    await requireSupportImageQuota({ user: { userId: 7 } } as any, {} as any, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('supportMessagePreview', () => {
  it('falls back to a photo marker only for photo-only messages', () => {
    expect(supportMessagePreview('hi', UPLOADED)).toBe('hi');
    expect(supportMessagePreview('', UPLOADED)).toBe(SUPPORT_PHOTO_PREVIEW);
    expect(supportMessagePreview('', null)).toBe('');
  });
});
