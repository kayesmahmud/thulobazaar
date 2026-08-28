// Category Policy
//
// Dart mirror of `packages/types/src/categoryPolicy.ts` — that module is the
// source of truth for the three per-category flags (negotiable / COD /
// condition) plus the core Price label. Every row below is transcribed from
// it; the two must agree exactly.
//
// Server wins: when `GET /api/categories` carries a policy for a node, use
// that and ignore this table. This is the cold-start / offline fallback only.

/// Condition field mode. Authoritative: it controls the post-ad field, whether
/// `ads.condition` is written at all, and the badge on the ad.
enum ConditionMode { required, optional, hidden }

/// Core price input. [hidden] means the ad is stored with price = null.
class PriceMode {
  final bool hidden;
  final String? label;
  final String? labelNe;
  final bool required;

  const PriceMode({
    this.hidden = false,
    this.label,
    this.labelNe,
    this.required = false,
  });
}

class CategoryPolicy {
  final bool negotiable;
  final bool cod;
  final ConditionMode condition;
  final PriceMode price;

  const CategoryPolicy({
    required this.negotiable,
    required this.cod,
    required this.condition,
    required this.price,
  });
}

const _standardPrice = PriceMode(
  label: 'Price (NPR)',
  labelNe: 'मूल्य (रु.)',
  required: true,
);

const _salary = PriceMode(
  label: 'Salary (NPR)',
  labelNe: 'तलब (रु.)',
  required: false,
);

const _monthlyRent = PriceMode(
  label: 'Monthly Rent (NPR)',
  labelNe: 'मासिक भाडा (रु.)',
  required: true,
);

const _startingPrice = PriceMode(
  label: 'Starting Price (NPR)',
  labelNe: 'सुरु मूल्य (रु.)',
  required: true,
);

const _fee = PriceMode(
  label: 'Fee (NPR)',
  labelNe: 'शुल्क (रु.)',
  required: true,
);

const _noPrice = PriceMode(hidden: true);

/// Any slug not in the tables below resolves here, so a category added to the
/// database tomorrow cannot break the post-ad form.
const _safeDefault = CategoryPolicy(
  negotiable: true,
  cod: false,
  condition: ConditionMode.hidden,
  price: _standardPrice,
);

const _parentPolicies = <String, CategoryPolicy>{
  'electronics': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.required,
    price: _standardPrice,
  ),
  'mobiles': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.required,
    price: _standardPrice,
  ),
  'vehicles': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.required,
    price: _standardPrice,
  ),
  'mens-fashion-grooming': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'womens-fashion-beauty': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'hobbies-sports-kids': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'home-living': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'business-industry': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'essentials': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'agriculture': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'pets-animals': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'property': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'services': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _startingPrice,
  ),
  'education': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _fee,
  ),
  'jobs': CategoryPolicy(
    negotiable: false,
    cod: false,
    condition: ConditionMode.hidden,
    price: _salary,
  ),
  'overseas-jobs': CategoryPolicy(
    negotiable: false,
    cod: false,
    condition: ConditionMode.hidden,
    price: _salary,
  ),
};

/// Subcategory slugs are globally unique in the database, so this map is flat
/// rather than nested per parent. Rows are fully resolved (parent merged in),
/// exactly as the TypeScript module resolves them.
const _subcategoryOverrides = <String, CategoryPolicy>{
  // Flag exceptions
  'sim-cards': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'mobile-phone-services': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'auto-parts-accessories': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.required,
    price: _standardPrice,
  ),
  'rentals': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'auto-services': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'maintenance-repair': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'textbooks': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.optional,
    price: _fee,
  ),
  'industry-machinery-tools': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'raw-materials-industrial-supplies': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'licences-titles-tenders': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'grooming-bodycare': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'wholesale-bulk': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'beauty-personal-care': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'lingerie-sleepwear': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'wholesale-bulk-women': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'baby-products': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'farming-tools-machinery': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'pet-animal-food': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.hidden,
    price: _standardPrice,
  ),
  'pet-animal-accessories': CategoryPolicy(
    negotiable: true,
    cod: true,
    condition: ConditionMode.optional,
    price: _standardPrice,
  ),
  'matrimonials': CategoryPolicy(
    negotiable: false,
    cod: false,
    condition: ConditionMode.hidden,
    price: _noPrice,
  ),

  // Price exceptions — property rentals, replacing the deleted monthlyRent field
  'apartment-rentals': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _monthlyRent,
  ),
  'house-rentals': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _monthlyRent,
  ),
  'room-rentals': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _monthlyRent,
  ),
  'land-rentals': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _monthlyRent,
  ),
  'commercial-property-rentals': CategoryPolicy(
    negotiable: true,
    cod: false,
    condition: ConditionMode.hidden,
    price: _monthlyRent,
  ),
};

/// Resolve the policy for a category: parent default <- subcategory exception.
/// Unknown slugs fall back to the parent value, then to the safe default, so a
/// category added to the database tomorrow cannot break the post-ad form.
CategoryPolicy getCategoryPolicy(String parentSlug, [String? subcategorySlug]) {
  final resolved =
      _subcategoryOverrides[subcategorySlug] ??
      _parentPolicies[parentSlug] ??
      _safeDefault;

  // R1 — price implies the flags. With no price there is nothing to haggle
  // over and nothing for a courier to collect.
  if (!resolved.price.hidden) return resolved;
  return CategoryPolicy(
    negotiable: false,
    cod: false,
    condition: resolved.condition,
    price: resolved.price,
  );
}
