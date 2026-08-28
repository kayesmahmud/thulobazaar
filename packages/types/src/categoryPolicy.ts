/**
 * @thulobazaar/types - Category Policy
 *
 * Single source of truth for the three per-category flags (Negotiable,
 * Cash on Delivery, Condition) plus the core Price input label.
 *
 * Keyed on category SLUG, never on name: slugs are @unique in the DB, names are
 * not (four subcategory names exist under both fashion parents).
 *
 * Imported by apps/web AND apps/api - plain data only, no React / Next / Node.
 */

// ============================================
// TYPES
// ============================================

/**
 * Condition field mode. Authoritative: it controls the post-ad field, whether
 * ads.condition is written at all, the badge, the JSON-LD itemCondition and
 * whether the condition search facet is offered.
 */
export type ConditionMode = 'required' | 'optional' | 'hidden';

/** Core price input. `hidden` means the ad is stored with price = null. */
export type PriceMode =
  | { hidden: true }
  | { hidden: false; label: string; labelNe: string; required: boolean };

export interface CategoryPolicy {
  negotiable: boolean;
  cod: boolean;
  condition: ConditionMode;
  price: PriceMode;
}

// ============================================
// PRICE MODES
// ============================================

const STANDARD_PRICE: PriceMode = {
  hidden: false,
  label: 'Price (NPR)',
  labelNe: 'मूल्य (रु.)',
  required: true,
};

const SALARY: PriceMode = {
  hidden: false,
  label: 'Salary (NPR)',
  labelNe: 'तलब (रु.)',
  required: false,
};

const MONTHLY_RENT: PriceMode = {
  hidden: false,
  label: 'Monthly Rent (NPR)',
  labelNe: 'मासिक भाडा (रु.)',
  required: true,
};

const STARTING_PRICE: PriceMode = {
  hidden: false,
  label: 'Starting Price (NPR)',
  labelNe: 'सुरु मूल्य (रु.)',
  required: true,
};

const FEE: PriceMode = {
  hidden: false,
  label: 'Fee (NPR)',
  labelNe: 'शुल्क (रु.)',
  required: true,
};

const NO_PRICE: PriceMode = { hidden: true };

// ============================================
// POLICY TABLE
// ============================================

/** Conservative fallback for any slug not in the tables below. */
const SAFE_DEFAULT: CategoryPolicy = {
  negotiable: true,
  cod: false,
  condition: 'hidden',
  price: STANDARD_PRICE,
};

/** Parent defaults - one row per parent category. */
const PARENT_POLICIES: Record<string, CategoryPolicy> = {
  electronics: { negotiable: true, cod: true, condition: 'required', price: STANDARD_PRICE },
  mobiles: { negotiable: true, cod: true, condition: 'required', price: STANDARD_PRICE },
  vehicles: { negotiable: true, cod: false, condition: 'required', price: STANDARD_PRICE },
  'mens-fashion-grooming': { negotiable: true, cod: true, condition: 'optional', price: STANDARD_PRICE },
  'womens-fashion-beauty': { negotiable: true, cod: true, condition: 'optional', price: STANDARD_PRICE },
  'hobbies-sports-kids': { negotiable: true, cod: true, condition: 'optional', price: STANDARD_PRICE },
  'home-living': { negotiable: true, cod: true, condition: 'optional', price: STANDARD_PRICE },
  'business-industry': { negotiable: true, cod: true, condition: 'optional', price: STANDARD_PRICE },
  essentials: { negotiable: true, cod: true, condition: 'hidden', price: STANDARD_PRICE },
  agriculture: { negotiable: true, cod: true, condition: 'hidden', price: STANDARD_PRICE },
  'pets-animals': { negotiable: true, cod: false, condition: 'hidden', price: STANDARD_PRICE },
  property: { negotiable: true, cod: false, condition: 'hidden', price: STANDARD_PRICE },
  services: { negotiable: true, cod: false, condition: 'hidden', price: STARTING_PRICE },
  education: { negotiable: true, cod: false, condition: 'hidden', price: FEE },
  jobs: { negotiable: false, cod: false, condition: 'hidden', price: SALARY },
  'overseas-jobs': { negotiable: false, cod: false, condition: 'hidden', price: SALARY },
};

/**
 * Subcategory exceptions, merged over the parent row. Slugs are unique across
 * the whole table, so this stays flat.
 */
const SUBCATEGORY_OVERRIDES: Record<string, Partial<CategoryPolicy>> = {
  // mobiles - a phone number is not shippable; a repair shop is a service
  'sim-cards': { cod: false, condition: 'hidden' },
  'mobile-phone-services': { cod: false, condition: 'hidden' },

  // vehicles - parts are couriered; rentals and workshops transfer no ownership
  'auto-parts-accessories': { cod: true },
  rentals: { condition: 'hidden' },
  'auto-services': { condition: 'hidden' },
  'maintenance-repair': { condition: 'hidden' },

  // education - the one physical resold good
  textbooks: { cod: true, condition: 'optional' },

  // business & industry - value, installation, intangibles
  'industry-machinery-tools': { cod: false },
  'raw-materials-industrial-supplies': { cod: false, condition: 'hidden' },
  'licences-titles-tenders': { cod: false, condition: 'hidden' },

  // fashion - hygiene, and consignment is not a parcel
  'grooming-bodycare': { condition: 'hidden' },
  'wholesale-bulk': { cod: false },
  'beauty-personal-care': { condition: 'hidden' },
  'lingerie-sleepwear': { condition: 'hidden' },
  'wholesale-bulk-women': { cod: false },

  // essentials / agriculture
  'baby-products': { condition: 'optional' },
  'farming-tools-machinery': { cod: false, condition: 'optional' },

  // pets - packaged feed is a parcel, cages and aquariums are resold
  'pet-animal-food': { cod: true },
  'pet-animal-accessories': { cod: true, condition: 'optional' },

  // services - no price exists, so R1 hides both flags
  matrimonials: { price: NO_PRICE },

  // property rentals - the core price input IS the rent (replaces monthlyRent)
  'apartment-rentals': { price: MONTHLY_RENT },
  'house-rentals': { price: MONTHLY_RENT },
  'room-rentals': { price: MONTHLY_RENT },
  'land-rentals': { price: MONTHLY_RENT },
  'commercial-property-rentals': { price: MONTHLY_RENT },
};

// ============================================
// LOOKUP
// ============================================

/**
 * Resolve the policy for a category: parent default <- subcategory exception.
 * Unknown slugs fall back to SAFE_DEFAULT so a category added to the DB
 * tomorrow cannot break the post-ad form.
 */
export function getCategoryPolicy(parentSlug: string, subcategorySlug?: string): CategoryPolicy {
  const parent = PARENT_POLICIES[parentSlug] ?? SAFE_DEFAULT;
  const override = subcategorySlug ? SUBCATEGORY_OVERRIDES[subcategorySlug] : undefined;
  const policy: CategoryPolicy = { ...parent, ...override };

  // R1 - price implies the flags: no price means nothing to haggle over and
  // nothing for a courier to collect.
  if (policy.price.hidden) {
    return { ...policy, negotiable: false, cod: false };
  }

  return policy;
}
