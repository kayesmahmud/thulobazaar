import { describe, it, expect } from 'vitest';
import { findProhibitedAccountSale, isLimitedDigitalService } from '@thulobazaar/types';

describe('findProhibitedAccountSale', () => {
  it('blocks game account and ID sales', () => {
    expect(findProhibitedAccountSale('Free Fire ID sell')).toBe('free fire');
    expect(findProhibitedAccountSale('PUBG account for sale cheap')).toBe('pubg');
    expect(findProhibitedAccountSale('Mobile Legends acc')).toBe('mobile legends');
  });

  it('blocks social account and channel sales', () => {
    expect(findProhibitedAccountSale('Tiktok id sell')).toBe('tiktok');
    expect(findProhibitedAccountSale('YouTube channel sale 10k subs')).toBe('youtube');
    expect(findProhibitedAccountSale('Instagram page selling')).toBe('instagram');
  });

  it('blocks in-game currency only for games', () => {
    expect(findProhibitedAccountSale('Free Fire diamonds top up')).toBe('free fire');
    // "diamond" alone is a real product category (jewellery)
    expect(findProhibitedAccountSale('Diamond ring 2 carat')).toBeNull();
  });

  it('does not block genuine listings that mention a platform', () => {
    expect(findProhibitedAccountSale('Samsung Smart TV with YouTube and Netflix')).toBeNull();
    expect(findProhibitedAccountSale('Gaming PC for PUBG and Valorant')).toBeNull();
    expect(findProhibitedAccountSale('Ring light for TikTok videos')).toBeNull();
  });

  it('does not fire on words that merely contain a term', () => {
    // "id" inside android / paid / video was the obvious false-positive risk
    expect(findProhibitedAccountSale('Android phone 128GB')).toBeNull();
    expect(findProhibitedAccountSale('Video camera, paid delivery')).toBeNull();
  });

  it('ignores empty input', () => {
    expect(findProhibitedAccountSale('')).toBeNull();
  });
});

describe('isLimitedDigitalService', () => {
  it('flags follower and subscriber services', () => {
    expect(isLimitedDigitalService('1000 Instagram followers Rs 500')).toBe(true);
    expect(isLimitedDigitalService('YouTube subscribers cheap')).toBe(true);
    expect(isLimitedDigitalService('SMM panel reseller')).toBe(true);
  });

  it('flags shared subscription logins', () => {
    expect(isLimitedDigitalService('Netflix account 1 month')).toBe(true);
    expect(isLimitedDigitalService('ChatGPT premium shared')).toBe(true);
    expect(isLimitedDigitalService('Spotify subscription')).toBe(true);
  });

  it('needs a platform for vague engagement words', () => {
    expect(isLimitedDigitalService('TikTok likes and views')).toBe(true);
    // property listings legitimately advertise views
    expect(isLimitedDigitalService('House with mountain views in Pokhara')).toBe(false);
  });

  it('leaves genuine hardware listings alone', () => {
    expect(isLimitedDigitalService('Smart TV with Netflix and Prime Video')).toBe(false);
    expect(isLimitedDigitalService('iPhone 13 Pro 256GB')).toBe(false);
  });

  it('does not overlap with the outright ban', () => {
    // "Free Fire ID sell" is prohibited, not merely rate-limited
    expect(findProhibitedAccountSale('Free Fire ID sell')).not.toBeNull();
    expect(isLimitedDigitalService('1000 Instagram followers Rs 500')).toBe(true);
    expect(findProhibitedAccountSale('1000 Instagram followers Rs 500')).toBeNull();
  });
});
