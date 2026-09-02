import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/signup_screen.dart';

import 'helpers/pump_localized.dart';

void main() {
  testWidgets('sign up opens on the phone step only', (tester) async {
    await pumpLocalized(tester, const SignUpScreen());
    await tester.pumpAndSettle();

    expect(find.text('+977'), findsOneWidget);
    expect(find.text('Phone Number *'), findsOneWidget);
    expect(find.text('Send OTP'), findsOneWidget);

    // Later steps must not leak into the first one.
    expect(find.text('Enter OTP *'), findsNothing);
    expect(find.text('Confirm Password *'), findsNothing);
    expect(find.text('Terms & Conditions'), findsNothing);
  });

  testWidgets('sign up phone step reads in Nepali', (tester) async {
    await pumpLocalized(tester, const SignUpScreen(), locale: localeNe);
    await tester.pumpAndSettle();

    expect(find.text('+977'), findsOneWidget);
    expect(find.text('फोन नम्बर *'), findsOneWidget);
    expect(find.text('OTP पठाउनुहोस्'), findsOneWidget);
  });
}
