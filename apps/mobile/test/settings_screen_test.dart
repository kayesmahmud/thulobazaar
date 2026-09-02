import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:mobile/features/settings/settings_screen.dart';
import 'package:provider/provider.dart';

import 'helpers/pump_localized.dart';

const _seller = <String, dynamic>{
  'id': 42,
  'fullName': 'Bikash Thapa',
  'phone': '+9779841023118',
  'phoneVerified': true,
  'email': 'bikash.thapa@example.com',
  'twoFactorEnabled': false,
  'individualVerified': true,
  'businessVerificationStatus': '',
};

Future<void> _pumpSettings(
  WidgetTester tester, {
  Locale locale = localeEn,
  Map<String, dynamic> user = _seller,
}) {
  // Tall surface so every group is built, not just the first screenful.
  tester.view.physicalSize = const Size(1080, 6000);
  tester.view.devicePixelRatio = 2.5;
  addTearDown(tester.view.reset);
  return pumpLocalized(
    tester,
    const SettingsScreen(),
    locale: locale,
    providers: [
      ChangeNotifierProvider<AuthProvider>(
        create: (_) => AuthProvider.withUser(user),
      ),
    ],
  );
}

void main() {
  testWidgets('lists every group with the account state filled in', (
    tester,
  ) async {
    await _pumpSettings(tester);
    await tester.pump();

    for (final text in [
      'Settings',
      'Account',
      'Sign-in & security',
      'Preferences',
      'Help & about',
      'Phone number',
      '+9779841023118',
      'Individual verified',
      'Two-Factor Authentication',
      'Off',
      'Active Sessions',
      'Clear search history',
      'Delete account',
      'About Thulo Bazaar',
    ]) {
      expect(find.text(text), findsOneWidget, reason: text);
    }
    // Verified phone shows its chip; the email row is information only.
    expect(find.text('Verified'), findsOneWidget);
    expect(find.text('Contact support to change'), findsOneWidget);
  });

  testWidgets('reads in Nepali', (tester) async {
    await _pumpSettings(tester, locale: localeNe);
    await tester.pump();

    for (final text in [
      'सेटिङहरू',
      'खाता',
      'साइन इन र सुरक्षा',
      'खोज इतिहास मेटाउनुहोस्',
      'खाता मेटाउनुहोस्',
    ]) {
      expect(find.text(text), findsOneWidget, reason: text);
    }
  });

  testWidgets('shows the sign-in gate when signed out', (tester) async {
    await pumpLocalized(
      tester,
      const SettingsScreen(),
      providers: [ChangeNotifierProvider(create: (_) => AuthProvider())],
    );
    expect(find.byType(LoginGateScreen), findsOneWidget);
  });

  testWidgets('no Shop URL row for an unverified account', (tester) async {
    await _pumpSettings(tester);
    await tester.pump();
    expect(find.text('Shop URL'), findsNothing);
  });

  testWidgets('Shop URL row and address for a verified business', (
    tester,
  ) async {
    await _pumpSettings(
      tester,
      user: {
        ..._seller,
        'businessVerificationStatus': 'approved',
        'customShopSlug': 'pixel-mobile-shop',
      },
    );
    await tester.pump();
    expect(find.text('Shop URL'), findsOneWidget);
    expect(
      find.text('thulobazaar.com.np/en/shop/pixel-mobile-shop'),
      findsOneWidget,
    );
  });
}
