import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpandableDescription from '@/app/[lang]/ad/[slug]/ExpandableDescription';

// jsdom does no layout, so overflow is simulated through the two heights the
// component compares.
function fakeHeights(scroll: number, client: number) {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => scroll });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => client });
}

describe('ExpandableDescription', () => {
  beforeEach(() => {
    // @ts-expect-error jsdom has no ResizeObserver
    global.ResizeObserver = class { observe() {} disconnect() {} };
  });
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollHeight;
    delete (HTMLElement.prototype as any).clientHeight;
  });

  it('shows no button when the text fits', () => {
    fakeHeights(100, 100);
    render(<ExpandableDescription text="Short." moreLabel="View more" lessLabel="View less" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers View more when clamped, then View less when open', () => {
    fakeHeights(900, 200);
    render(<ExpandableDescription text="A very long description." moreLabel="View more" lessLabel="View less" />);
    const button = screen.getByRole('button', { name: 'View more' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(screen.getByRole('button', { name: 'View less' }).getAttribute('aria-expanded')).toBe('true');
    // Open: the clamp is gone from the paragraph.
    expect(screen.getByText('A very long description.').style.overflow).toBe('');
  });
});
