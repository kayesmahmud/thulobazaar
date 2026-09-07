import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/ad_detail/widgets/ad_detail_banners.dart';
import 'package:mobile/features/safety/scam_prevention_screen.dart';

import 'helpers/pump_localized.dart';

Future<void> _pumpTall(
  WidgetTester tester,
  Widget child, {
  Locale locale = localeEn,
}) {
  // Tall surface so every section is built, not just the first screenful.
  tester.view.physicalSize = const Size(1080, 9000);
  tester.view.devicePixelRatio = 2.5;
  addTearDown(tester.view.reset);
  return pumpLocalized(tester, child, locale: locale);
}

void main() {
  testWidgets('shows the story, the rules and the police complaint button', (
    tester,
  ) async {
    await _pumpTall(tester, const ScamPreventionScreen());

    // The app bar and the hero both carry the title.
    expect(find.text('Scam Prevention'), findsNWidgets(2));
    for (final text in [
      'How the advance-payment scam works',
      'Warning signs',
      'Rules for buyers',
      'Never pay in advance. Not for booking, not for delivery, not for ‘tax’.',
      'Rules for sellers',
      'If you have been scammed',
      'File a complaint with Nepal Police',
      'Kathmandu Valley Crime Investigation Office',
      'Open the police complaint form',
      'cyberbureau@nepalpolice.gov.np',
      '01-5319044',
      '100',
    ]) {
      expect(find.text(text), findsOneWidget, reason: text);
    }
  });

  testWidgets('reads in Nepali', (tester) async {
    await _pumpTall(tester, const ScamPreventionScreen(), locale: localeNe);

    for (final text in [
      'अग्रिम भुक्तानी ठगी कसरी हुन्छ',
      'खतराका संकेतहरू',
      'प्रहरी उजुरी फारम खोल्नुहोस्',
      'नेपाल प्रहरीमा उजुरी दर्ता गर्नुहोस्',
    ]) {
      expect(find.text(text), findsOneWidget, reason: text);
    }
    // The app bar and the hero both carry the title.
    expect(find.text('ठगीबाट बच्ने उपाय'), findsNWidgets(2));
  });

  testWidgets('ad-detail safety card lists four tips and opens the screen', (
    tester,
  ) async {
    await _pumpTall(tester, const Scaffold(body: SafetyTipsCard()));

    for (final tip in [
      'Meet in a safe public place',
      'Check the item before payment',
      'Never pay in advance',
      'Beware of unrealistic offers',
    ]) {
      expect(find.text(tip), findsOneWidget, reason: tip);
    }

    await tester.tap(find.text('How to avoid scams'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byType(ScamPreventionScreen), findsOneWidget);
    expect(find.text('Open the police complaint form'), findsOneWidget);
  });

  testWidgets('safety card reads in Nepali', (tester) async {
    await _pumpTall(
      tester,
      const Scaffold(body: SafetyTipsCard()),
      locale: localeNe,
    );

    expect(find.text('सुरक्षा सुझावहरू'), findsOneWidget);
    expect(find.text('अग्रिम भुक्तानी नगर्नुहोस्'), findsOneWidget);
    expect(find.text('ठगीबाट कसरी बच्ने'), findsOneWidget);
  });

  _romanTests();
}

void _romanTests() {
  testWidgets('English readers can switch the screen to romanized Nepali', (
    tester,
  ) async {
    await _pumpTall(tester, const ScamPreventionScreen());
    expect(find.text('Nepali (Roman)'), findsOneWidget);

    await tester.tap(find.text('Nepali (Roman)'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Thagi bata bachne upaya'), findsNWidgets(2));
    expect(find.text('Khatara ka sanket haru'), findsOneWidget);
    expect(find.text('Prahari ujuri form kholnuhos'), findsOneWidget);
    expect(find.text('Warning signs'), findsNothing);
  });

  testWidgets('safety card switches to romanized Nepali', (tester) async {
    await _pumpTall(tester, const Scaffold(body: SafetyTipsCard()));

    await tester.tap(find.text('Nepali (Roman)'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Suraksha sujhav haru'), findsOneWidget);
    expect(find.text('Agrim bhuktani nagarnuhos'), findsOneWidget);
    expect(find.text('Thagi bata kasari bachne'), findsOneWidget);
  });

  testWidgets('the Nepali locale has no script toggle', (tester) async {
    await _pumpTall(
      tester,
      const Scaffold(body: SafetyTipsCard()),
      locale: localeNe,
    );
    expect(find.text('रोमन नेपाली'), findsNothing);
    expect(find.text('Nepali (Roman)'), findsNothing);
  });
}
