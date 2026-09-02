import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:mobile/features/auth/signin_screen.dart';
import 'package:mobile/features/auth/signup_screen.dart';

import 'helpers/pump_localized.dart';

/// Stands in for a gated screen: the gate while signed out, its own content
/// once [signedIn] flips — the way every real host watches AuthProvider.
class _Host extends StatelessWidget {
  final ValueNotifier<bool> signedIn;
  const _Host(this.signedIn);

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: signedIn,
      builder: (_, on, _) => on
          ? const Scaffold(body: Text('HOST CONTENT'))
          : const LoginGateScreen(kind: LoginGateKind.messages),
    );
  }
}

/// A push/pop transition takes ~800ms of pumped time before the Navigator
/// drops the route. Not pumpAndSettle: the sign-in form's blinking cursor
/// never settles.
Future<void> _settleRoute(WidgetTester tester) async {
  for (var i = 0; i < 5; i++) {
    await tester.pump(const Duration(milliseconds: 200));
  }
}

void main() {
  testWidgets('chats gate names the step and the goal', (tester) async {
    await pumpLocalized(
      tester,
      const LoginGateScreen(kind: LoginGateKind.messages),
    );

    expect(find.text('Talk to the seller'), findsOneWidget);
    expect(find.text('Sign in to chat'), findsOneWidget);
    expect(find.text('New here? Create a free account'), findsOneWidget);
    expect(find.text('Chat directly with buyers and sellers'), findsOneWidget);
    // Phone numbers are shown for phone-registered sellers, so never claim this.
    expect(find.text('Your phone stays hidden'), findsNothing);
  });

  testWidgets('post ad gate: no minute count, no-commission promise', (
    tester,
  ) async {
    await pumpLocalized(
      tester,
      const LoginGateScreen(kind: LoginGateKind.postAd),
    );

    expect(find.text('Sell it in minutes'), findsOneWidget);
    expect(find.text('Free to post. No hidden fees.'), findsOneWidget);
    expect(find.text('No fees, no commission'), findsOneWidget);
    expect(find.text('Reach buyers all over Nepal'), findsOneWidget);
    expect(find.text('Sign in to post an ad'), findsOneWidget);
  });

  testWidgets('post ad gate in Nepali', (tester) async {
    await pumpLocalized(
      tester,
      const LoginGateScreen(kind: LoginGateKind.postAd),
      locale: localeNe,
    );

    expect(find.text('मिनेटमै बेच्नुहोस्'), findsOneWidget);
    expect(find.text('विज्ञापन राख्न साइन इन गर्नुहोस्'), findsOneWidget);
    expect(find.text('नयाँ हुनुहुन्छ? निःशुल्क खाता खोल्नुहोस्'), findsOneWidget);
  });

  testWidgets('primary opens sign-in, the link opens sign-up', (tester) async {
    await pumpLocalized(
      tester,
      const LoginGateScreen(kind: LoginGateKind.profile),
    );

    await tester.tap(find.text('Sign in to see your profile'));
    await _settleRoute(tester);
    expect(find.byType(SignInScreen), findsOneWidget);

    Navigator.of(tester.element(find.byType(SignInScreen))).pop();
    await _settleRoute(tester);
    expect(find.byType(SignInScreen), findsNothing);

    await tester.tap(find.text('New here? Create a free account'));
    await _settleRoute(tester);
    expect(find.byType(SignUpScreen), findsOneWidget);
  });

  testWidgets('after sign-in the user is back where they were', (
    tester,
  ) async {
    final signedIn = ValueNotifier(false);
    await pumpLocalized(tester, _Host(signedIn));
    expect(find.text('Sign in to chat'), findsOneWidget);

    await tester.tap(find.text('Sign in to chat'));
    await _settleRoute(tester);
    final signIn = tester.widget<SignInScreen>(find.byType(SignInScreen));

    // The auth screen's order of events: the provider flips (the host
    // rebuilds and drops the gate), then the callback runs.
    signedIn.value = true;
    await tester.pump();
    signIn.onSuccess!();
    await _settleRoute(tester);

    expect(find.byType(SignInScreen), findsNothing);
    expect(find.text('HOST CONTENT'), findsOneWidget);
  });

  testWidgets('an offer pill shows only when the host passes one', (
    tester,
  ) async {
    await pumpLocalized(
      tester,
      const LoginGateScreen(
        kind: LoginGateKind.verification,
        highlight: 'FREE right now',
      ),
    );
    expect(find.byKey(const ValueKey('gate_highlight')), findsOneWidget);
    expect(find.text('FREE right now'), findsOneWidget);
    expect(find.text('Sign in to get verified'), findsOneWidget);
  });

  testWidgets('no offer pill by default', (tester) async {
    await pumpLocalized(
      tester,
      const LoginGateScreen(kind: LoginGateKind.verification),
    );
    expect(find.byKey(const ValueKey('gate_highlight')), findsNothing);
  });
}
