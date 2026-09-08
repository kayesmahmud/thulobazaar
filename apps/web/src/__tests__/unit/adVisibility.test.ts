import { describe, it, expect } from 'vitest';
import { canViewNonPublicAd } from '@/app/[lang]/ad/[slug]/adVisibility';

const ad = { user_id: 42 };

describe('canViewNonPublicAd', () => {
  it('hides a non-approved ad from signed-out visitors', () => {
    expect(canViewNonPublicAd(undefined, ad)).toBe(false);
    expect(canViewNonPublicAd(null, ad)).toBe(false);
  });

  it('hides it from another logged-in user', () => {
    expect(canViewNonPublicAd({ id: 7, role: 'user' }, ad)).toBe(false);
  });

  it('shows it to the seller who owns it (session id is a string)', () => {
    expect(canViewNonPublicAd({ id: '42', role: 'user' }, ad)).toBe(true);
  });

  it('shows it to editors and super admins reviewing from the editor panel', () => {
    expect(canViewNonPublicAd({ id: 7, role: 'editor' }, ad)).toBe(true);
    expect(canViewNonPublicAd({ id: 7, role: 'super_admin' }, ad)).toBe(true);
  });

  it('does not treat a missing or unknown role as staff', () => {
    expect(canViewNonPublicAd({ id: 7 }, ad)).toBe(false);
    expect(canViewNonPublicAd({ id: 7, role: 'editor_wannabe' }, ad)).toBe(false);
  });

  it('does not let a null session id match an ad with no owner', () => {
    expect(canViewNonPublicAd({ id: null, role: 'user' }, { user_id: null })).toBe(false);
  });
});
