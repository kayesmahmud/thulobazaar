import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/verification/verification_screen.dart';
import 'package:provider/provider.dart';

import 'helpers/fake_pricing.dart';
import 'helpers/pump_localized.dart';

Future<void> _pumpGuest(WidgetTester tester, {required bool eligible}) async {
  await pumpLocalized(
    tester,
    VerificationScreen(
      verificationClient: fakePricingClient(eligible: eligible),
    ),
    providers: [
      ChangeNotifierProvider<AuthProvider>(create: (_) => AuthProvider()),
    ],
  );
  // The fake answers on a real Future; settle until it lands. The gate has no
  // running animations, so this terminates.
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('signed-out verification gate shows FREE while the offer is on', (
    tester,
  ) async {
    await _pumpGuest(tester, eligible: true);

    expect(find.text('Get your verified badge'), findsOneWidget);
    expect(find.text('Sign in to get verified'), findsOneWidget);
    expect(find.byKey(const ValueKey('gate_highlight')), findsOneWidget);
    expect(find.text('FREE right now'), findsOneWidget);
    await tester.pump(const Duration(seconds: 3));
  });

  testWidgets('no FREE pill when the offer is off', (tester) async {
    await _pumpGuest(tester, eligible: false);

    expect(find.text('Sign in to get verified'), findsOneWidget);
    expect(find.byKey(const ValueKey('gate_highlight')), findsNothing);
    await tester.pump(const Duration(seconds: 3));
  });
}
