import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/widgets/auth_kit.dart';
import 'package:mobile/features/profile/phone_verification_screen.dart';

import 'helpers/pump_localized.dart';

void main() {
  testWidgets('changing a verified number opens on "confirm it\'s you" with '
      'the current number shown and the button right under it', (tester) async {
    await pumpLocalized(
      tester,
      const PhoneVerificationScreen(
        isChanging: true,
        currentPhone: '9706666096',
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text("Confirm it's you"), findsOneWidget);
    expect(find.text('+977 9706666096'), findsOneWidget);
    // The number is shown, never typed, at this step.
    expect(find.byKey(const ValueKey('phone_new_number')), findsNothing);

    final numberBottom = tester.getBottomLeft(find.text('+977 9706666096')).dy;
    final buttonTop = tester.getTopLeft(find.text('Send code')).dy;
    expect(buttonTop - numberBottom, lessThan(80));
  });

  testWidgets('adding a number opens on the new-number field, two steps', (
    tester,
  ) async {
    await pumpLocalized(tester, const PhoneVerificationScreen());
    await tester.pumpAndSettle();

    expect(find.text('Add your phone number'), findsOneWidget);
    expect(find.byKey(const ValueKey('phone_new_number')), findsOneWidget);
    expect(find.text('Send code'), findsOneWidget);
    expect(find.byType(AuthShell), findsOneWidget);
  });

  testWidgets('reads in Nepali', (tester) async {
    await pumpLocalized(
      tester,
      const PhoneVerificationScreen(
        isChanging: true,
        currentPhone: '9706666096',
      ),
      locale: localeNe,
    );
    await tester.pumpAndSettle();
    expect(find.text('यो तपाईं नै हो भनी पुष्टि गर्नुहोस्'), findsOneWidget);
    expect(find.text('कोड पठाउनुहोस्'), findsOneWidget);
  });
}
