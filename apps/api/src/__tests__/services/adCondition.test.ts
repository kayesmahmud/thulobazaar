import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    categories: { findUnique: vi.fn() },
  },
}));

vi.mock('../../jobs/promotionCleanup.js', () => ({
  clearExpiredPromotionFlags: vi.fn(),
}));

import { prisma } from '@thulobazaar/database';
import { validateAdCondition, AD_CONDITION_REQUIRED_MESSAGE } from '../../services/ad.service.js';

const findUnique = prisma.categories.findUnique as ReturnType<typeof vi.fn>;

// ads.category_id stores the LEAF; `categories` is the parent relation
const laptops = { slug: 'laptops', categories: { slug: 'electronics' } };
const houseRentals = { slug: 'house-rentals', categories: { slug: 'property' } };
const autoServices = { slug: 'auto-services', categories: { slug: 'vehicles' } };

describe('validateAdCondition', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects an Electronics ad with no condition', async () => {
    findUnique.mockResolvedValue(laptops);
    expect(await validateAdCondition(10, undefined)).toBe(AD_CONDITION_REQUIRED_MESSAGE);
    expect(await validateAdCondition(10, null)).toBe(AD_CONDITION_REQUIRED_MESSAGE);
    expect(await validateAdCondition(10, '')).toBe(AD_CONDITION_REQUIRED_MESSAGE);
  });

  it('accepts an Electronics ad once a condition is chosen, without a lookup', async () => {
    expect(await validateAdCondition(10, 'Used')).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('lets Property ads through with no condition (policy: hidden)', async () => {
    findUnique.mockResolvedValue(houseRentals);
    expect(await validateAdCondition(20, undefined)).toBeNull();
  });

  it('honours subcategory overrides: Vehicles > Auto Services hides condition', async () => {
    findUnique.mockResolvedValue(autoServices);
    expect(await validateAdCondition(30, undefined)).toBeNull();
  });

  it('treats a parent-level category as its own policy', async () => {
    findUnique.mockResolvedValue({ slug: 'mobiles', categories: null });
    expect(await validateAdCondition(2, undefined)).toBe(AD_CONDITION_REQUIRED_MESSAGE);
  });

  it('leaves unknown categories to the existing category validation', async () => {
    findUnique.mockResolvedValue(null);
    expect(await validateAdCondition(999, undefined)).toBeNull();
  });
});
