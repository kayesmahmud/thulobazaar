/// Mirrors the API's normalisation (lowercase, `a-z 0-9 -` only) with one
/// kindness on top: spaces become hyphens instead of vanishing, so
/// "Everest Electronics" becomes "everest-electronics", not
/// "everestelectronics".
String normalizeShopSlug(String raw) {
  final hyphenated = raw.trim().toLowerCase().replaceAll(RegExp(r'\s+'), '-');
  final cleaned = hyphenated.replaceAll(RegExp(r'[^a-z0-9-]'), '');
  return cleaned
      .replaceAll(RegExp(r'-{2,}'), '-')
      .replaceAll(RegExp(r'^-|-$'), '');
}

const int shopSlugMinLength = 3;
const int shopSlugMaxLength = 50;

bool isValidShopSlug(String slug) =>
    slug.length >= shopSlugMinLength && slug.length <= shopSlugMaxLength;
