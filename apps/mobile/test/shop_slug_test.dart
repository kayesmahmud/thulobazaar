import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/utils/shop_slug.dart';

void main() {
  test('normalises the way the API does, with spaces as hyphens', () {
    expect(normalizeShopSlug('  Everest Electronics! '), 'everest-electronics');
    expect(normalizeShopSlug('Ram--Shop'), 'ram-shop');
    expect(normalizeShopSlug('-nepal-'), 'nepal');
    expect(normalizeShopSlug('काठमाडौं shop'), 'shop');
  });

  test('length rule matches the server (3 to 50)', () {
    expect(isValidShopSlug('ab'), isFalse);
    expect(isValidShopSlug('abc'), isTrue);
    expect(isValidShopSlug('a' * 50), isTrue);
    expect(isValidShopSlug('a' * 51), isFalse);
  });
}
