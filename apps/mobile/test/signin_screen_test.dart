import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/signin_screen.dart';

import 'helpers/pump_localized.dart';

void main() {
  testWidgets('sign in shows the +977 prefix, phone and password fields', (
    tester,
  ) async {
    await pumpLocalized(tester, const SignInScreen());

    expect(find.text('+977'), findsOneWidget);
    expect(find.byType(TextField), findsAtLeastNWidgets(2));
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Welcome back'), findsOneWidget);
  });

  testWidgets('sign in renders in Nepali with the same prefix', (tester) async {
    await pumpLocalized(tester, const SignInScreen(), locale: localeNe);

    // The dialling prefix stays in Latin digits on purpose: it must match
    // what the numeric keypad produces.
    expect(find.text('+977'), findsOneWidget);
    expect(find.text('पासवर्ड'), findsOneWidget);
    expect(find.text('फेरि स्वागत छ'), findsOneWidget);
  });
}
