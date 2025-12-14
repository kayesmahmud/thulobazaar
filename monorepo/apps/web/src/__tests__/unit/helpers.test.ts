import { describe, it, expect } from 'vitest';
import {
  normalizeCondition,
  parseJsonSafe,
  tryParseJson,
} from '../../app/api/ads/[id]/helpers';

describe('normalizeCondition', () => {
  it('returns undefined for undefined input', () => {
    expect(normalizeCondition(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(normalizeCondition('')).toBeUndefined();
  });

  it('normalizes "brand new" to "new"', () => {
    expect(normalizeCondition('brand new')).toBe('new');
    expect(normalizeCondition('Brand New')).toBe('new');
    expect(normalizeCondition('BRAND NEW')).toBe('new');
  });

  it('normalizes "new" to "new"', () => {
    expect(normalizeCondition('new')).toBe('new');
    expect(normalizeCondition('New')).toBe('new');
  });

  it('normalizes "used" to "used"', () => {
    expect(normalizeCondition('used')).toBe('used');
    expect(normalizeCondition('Used')).toBe('used');
  });

  it('normalizes "reconditioned" to "used"', () => {
    expect(normalizeCondition('reconditioned')).toBe('used');
    expect(normalizeCondition('Reconditioned')).toBe('used');
  });

  it('returns original value for unknown conditions', () => {
    expect(normalizeCondition('like-new')).toBe('like-new');
    expect(normalizeCondition('refurbished')).toBe('refurbished');
  });
});

describe('parseJsonSafe', () => {
  it('returns default value for undefined input', () => {
    expect(parseJsonSafe(undefined, [])).toEqual([]);
    expect(parseJsonSafe(undefined, null)).toBeNull();
    expect(parseJsonSafe(undefined, {})).toEqual({});
  });

  it('returns default value for empty string', () => {
    expect(parseJsonSafe('', [])).toEqual([]);
  });

  it('parses valid JSON', () => {
    expect(parseJsonSafe('{"name": "test"}', {})).toEqual({ name: 'test' });
    expect(parseJsonSafe('[1, 2, 3]', [])).toEqual([1, 2, 3]);
    expect(parseJsonSafe('"hello"', '')).toBe('hello');
  });

  it('returns default value for invalid JSON', () => {
    expect(parseJsonSafe('invalid', [])).toEqual([]);
    expect(parseJsonSafe('{broken', {})).toEqual({});
  });
});

describe('tryParseJson', () => {
  it('returns undefined for undefined input', () => {
    expect(tryParseJson(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(tryParseJson('')).toBeUndefined();
  });

  it('parses valid JSON', () => {
    expect(tryParseJson('{"name": "test"}')).toEqual({ name: 'test' });
    expect(tryParseJson('[1, 2, 3]')).toEqual([1, 2, 3]);
  });

  it('returns undefined for invalid JSON', () => {
    expect(tryParseJson('invalid')).toBeUndefined();
    expect(tryParseJson('{broken')).toBeUndefined();
  });
});
