import { describe, it, expect } from 'vitest';
import { isImageAttachment } from '../../lib/supportAttachmentDisplay';

describe('isImageAttachment', () => {
  it('treats the .avif the upload pipeline produces as an image', () => {
    expect(
      isImageAttachment({ type: 'text', attachmentUrl: '/uploads/messages/msg_1_2_3.avif' })
    ).toBe(true);
  });

  it('trusts type === "image" regardless of the extension', () => {
    expect(isImageAttachment({ type: 'image', attachmentUrl: '/uploads/messages/blob' })).toBe(true);
  });

  it('matches the classic image extensions case-insensitively', () => {
    expect(isImageAttachment({ attachmentUrl: '/uploads/messages/a.JPG' })).toBe(true);
    expect(isImageAttachment({ attachmentUrl: '/uploads/messages/a.webp?v=2' })).toBe(true);
  });

  it('is false for non-image files and for messages without an attachment', () => {
    expect(isImageAttachment({ type: 'text', attachmentUrl: '/uploads/messages/doc.pdf' })).toBe(false);
    expect(isImageAttachment({ type: 'image', attachmentUrl: null })).toBe(false);
    expect(isImageAttachment({ type: 'text' })).toBe(false);
  });
});
