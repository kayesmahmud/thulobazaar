import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/features/post_ad/submit_failure.dart';
import 'package:mobile/features/verification/verification_screen.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:provider/provider.dart';

import 'helpers/pump_localized.dart';

/// A screen whose one button reports [result] the way the post-ad screen does.
class _Host extends StatelessWidget {
  final AdSubmitResult result;
  const _Host(this.result);
  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: ElevatedButton(
        key: const ValueKey('fail'),
        onPressed: () => showAdSubmitFailure(context, result),
        child: const Text('fail'),
      ),
    ),
  );
}

final atCapUnverified = AdSubmitResult.failure(
  'You have reached the limit of 50 ads for unverified accounts',
  code: adLimitReachedCode,
  details: {'limit': 50, 'verifiedLimit': 1000, 'verified': false},
);

void main() {
  testWidgets(
    'unverified seller at the cap: localized copy + Get verified action (EN)',
    (tester) async {
      await pumpLocalized(tester, _Host(atCapUnverified));
      await tester.tap(find.byKey(const ValueKey('fail')));
      await tester.pump();

      expect(
        find.textContaining('50-ad limit for unverified accounts'),
        findsOneWidget,
      );
      expect(find.textContaining('up to 1000 ads'), findsOneWidget);
      expect(find.text('Get verified'), findsOneWidget);
      expect(find.textContaining('status code'), findsNothing);
    },
  );

  testWidgets('same refusal in Nepali', (tester) async {
    await pumpLocalized(tester, _Host(atCapUnverified), locale: localeNe);
    await tester.tap(find.byKey(const ValueKey('fail')));
    await tester.pump();

    expect(find.textContaining('50 विज्ञापनको सीमा'), findsOneWidget);
    expect(find.text('प्रमाणित हुनुहोस्'), findsOneWidget);
  });

  testWidgets('Get verified opens the verification screen', (tester) async {
    await pumpLocalized(
      tester,
      _Host(atCapUnverified),
      providers: [
        ChangeNotifierProvider<AuthProvider>(create: (_) => AuthProvider()),
      ],
    );
    await tester.tap(find.byKey(const ValueKey('fail')));
    // Let the snackbar finish sliding in before tapping its action.
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.tap(find.text('Get verified'));
    await tester.pump();
    await tester.pump();

    expect(find.byType(VerificationScreen), findsOneWidget);

    // The screen's pricing fetch arms a timeout timer; let it fire before the
    // tree is torn down or the harness reports a pending timer.
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(minutes: 2));
  });

  testWidgets('verified seller at the cap gets copy but no action', (
    tester,
  ) async {
    await pumpLocalized(
      tester,
      _Host(
        AdSubmitResult.failure(
          'You have reached the maximum limit of 1000 ads',
          code: adLimitReachedCode,
          details: {'limit': 1000, 'verifiedLimit': 1000, 'verified': true},
        ),
      ),
    );
    await tester.tap(find.byKey(const ValueKey('fail')));
    await tester.pump();

    expect(find.textContaining('limit of 1000 active ads'), findsOneWidget);
    expect(find.text('Get verified'), findsNothing);
  });

  testWidgets('any other failure shows the server text unchanged', (
    tester,
  ) async {
    await pumpLocalized(
      tester,
      _Host(AdSubmitResult.failure('Title is required')),
    );
    await tester.tap(find.byKey(const ValueKey('fail')));
    await tester.pump();

    expect(find.text('Title is required'), findsOneWidget);
    expect(find.text('Get verified'), findsNothing);
  });
}
