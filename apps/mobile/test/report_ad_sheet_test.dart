import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/ad_detail/widgets/report_ad_sheet.dart';
import 'package:provider/provider.dart';

import 'helpers/pump_localized.dart';

/// Stands in for the ad-detail screen: one button that opens the sheet.
class _Host extends StatelessWidget {
  const _Host();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: TextButton(
          key: const ValueKey('open'),
          onPressed: () =>
              showReportAdSheet(context, adId: 1, adTitle: 'Silk Dress'),
          child: const Text('open'),
        ),
      ),
    );
  }
}

// iPhone-sized logical viewport (393x852 @3x) so the sheet lays out the way
// it does on a real phone rather than the 800x600 test default.
const _phonePhysical = Size(1179, 2556);
const _keyboardPhysical = 1020.0; // 340 logical

Future<void> _openSheet(WidgetTester tester, {Locale locale = localeEn}) async {
  tester.view.physicalSize = _phonePhysical;
  tester.view.devicePixelRatio = 3.0;
  addTearDown(tester.view.reset);

  await pumpLocalized(
    tester,
    const _Host(),
    locale: locale,
    providers: [
      ChangeNotifierProvider<AuthProvider>(
        create: (_) => AuthProvider.withUser({'id': 99}),
      ),
    ],
  );
  await tester.tap(find.byKey(const ValueKey('open')));
  // Sheet slide-in.
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 400));
}

ElevatedButton _submit(WidgetTester tester) =>
    tester.widget<ElevatedButton>(find.byType(ElevatedButton));

void main() {
  testWidgets('every reason explains itself, in English', (tester) async {
    await _openSheet(tester);

    expect(find.text('Spam or scam'), findsOneWidget);
    expect(find.text('Repetitive, unwanted or scam ads'), findsOneWidget);
    expect(find.text('Other reason'), findsOneWidget);
    expect(find.text('Other reason not listed above'), findsOneWidget);
  });

  testWidgets('every reason explains itself, in Nepali', (tester) async {
    await _openSheet(tester, locale: localeNe);

    expect(find.text('स्प्याम वा ठगी'), findsOneWidget);
    expect(find.text('दोहोरिने, अनावश्यक वा ठगी विज्ञापन'), findsOneWidget);
    expect(find.text('माथि सूचीमा नभएको अन्य कारण'), findsOneWidget);
  });

  testWidgets('"Other" needs details before it can be submitted', (
    tester,
  ) async {
    await _openSheet(tester);

    expect(_submit(tester).onPressed, isNull, reason: 'no reason picked yet');
    expect(find.text('Additional details (optional)'), findsOneWidget);

    await tester.tap(find.text('Spam or scam'));
    await tester.pump();
    expect(_submit(tester).onPressed, isNotNull);

    await tester.ensureVisible(find.text('Other reason'));
    await tester.tap(find.text('Other reason'));
    await tester.pump();
    expect(find.text('Additional details (required)'), findsOneWidget);
    expect(
      find.text('Please describe the issue when choosing "Other reason".'),
      findsOneWidget,
    );
    expect(_submit(tester).onPressed, isNull, reason: 'Other without details');

    await tester.enterText(
      find.byType(TextFormField),
      'Seller asked for advance',
    );
    await tester.pump();
    expect(_submit(tester).onPressed, isNotNull);
    // Focusing the field arms the keyboard-reveal timer; let it run out.
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pump(const Duration(milliseconds: 250));
  });

  testWidgets(
    'with the keyboard open, the details box and submit stay visible',
    (tester) async {
      await _openSheet(tester);
      await tester.ensureVisible(find.text('Other reason'));
      await tester.tap(find.text('Other reason'));
      await tester.pump();

      // Focus the details box, then the keyboard slides in.
      await tester.ensureVisible(find.byType(TextFormField));
      await tester.tap(find.byType(TextFormField));
      tester.view.viewInsets = const FakeViewPadding(bottom: _keyboardPhysical);
      await tester.pump();
      // Keyboard animation (350ms wait) + the sheet's own scroll (200ms).
      await tester.pump(const Duration(milliseconds: 400));
      await tester.pump(const Duration(milliseconds: 250));

      final screenHeight = _phonePhysical.height / 3;
      final keyboardTop = screenHeight - _keyboardPhysical / 3;
      final field = tester.getRect(find.byType(TextFormField));
      final submit = tester.getRect(find.byType(ElevatedButton));
      final header = tester.getRect(find.text('Report Ad'));

      expect(
        field.bottom,
        lessThanOrEqualTo(keyboardTop),
        reason: 'details box hidden behind the keyboard',
      );
      expect(
        submit.bottom,
        lessThanOrEqualTo(keyboardTop),
        reason: 'submit button hidden behind the keyboard',
      );
      // The field is not clipped by the sheet's header either.
      expect(header.top, greaterThanOrEqualTo(0));
      expect(
        field.top,
        greaterThanOrEqualTo(header.bottom),
        reason: 'details box scrolled under the sheet header',
      );
    },
  );
}
