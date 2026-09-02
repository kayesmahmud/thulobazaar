import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/settings/shop_url_screen.dart';
import 'package:provider/provider.dart';

import 'helpers/pump_localized.dart';

const _business = <String, dynamic>{
  'id': 9,
  'fullName': 'Pixel Mobile Shop',
  'businessVerificationStatus': 'approved',
  'customShopSlug': 'pixel-mobile-shop',
};

Future<void> _pump(WidgetTester tester, {Locale locale = localeEn}) =>
    pumpLocalized(
      tester,
      const ShopUrlScreen(),
      locale: locale,
      providers: [
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider.withUser(_business),
        ),
      ],
    );

void main() {
  testWidgets('shows the current address and disables Save until a valid, '
      'different slug is entered', (tester) async {
    await _pump(tester);
    await tester.pump();

    expect(
      find.text('thulobazaar.com.np/en/shop/pixel-mobile-shop'),
      findsOneWidget,
    );
    final save = find.byKey(const ValueKey('shop_slug_save'));
    expect(tester.widget<FilledButton>(save).onPressed, isNull);

    // Too short: inline rule, no network, Save stays off.
    await tester.enterText(find.byKey(const ValueKey('shop_slug_field')), 'ab');
    await tester.pump();
    expect(
      find.text('Use 3 to 50 letters, numbers or hyphens'),
      findsOneWidget,
    );
    expect(tester.widget<FilledButton>(save).onPressed, isNull);
  });

  testWidgets('reads in Nepali', (tester) async {
    await _pump(tester, locale: localeNe);
    await tester.pump();
    expect(find.text('पसल URL'), findsWidgets);
    expect(
      find.text('thulobazaar.com.np/ne/shop/pixel-mobile-shop'),
      findsOneWidget,
    );
  });
}
