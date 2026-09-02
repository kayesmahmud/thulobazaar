import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/verification_client.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/widgets/main_drawer.dart';
import 'package:provider/provider.dart';

import 'helpers/pump_localized.dart';

const _seller = <String, dynamic>{
  'id': 7,
  'fullName': 'Everest Electronics',
  'shopSlug': 'everest-electronics',
};

Future<void> _openDrawer(
  WidgetTester tester, {
  AuthProvider? auth,
  Widget drawer = const MainDrawer(),
}) async {
  await pumpLocalized(
    tester,
    Scaffold(
      drawer: drawer,
      body: Builder(
        builder: (context) => TextButton(
          onPressed: () => Scaffold.of(context).openDrawer(),
          child: const Text('open'),
        ),
      ),
    ),
    providers: [
      ChangeNotifierProvider<AuthProvider>(
        create: (_) => auth ?? AuthProvider.withUser(_seller),
      ),
    ],
  );
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
}

/// Answers GET /verification/pricing the way the API does for a guest.
class _PricingAdapter implements HttpClientAdapter {
  final bool eligible;
  _PricingAdapter({required this.eligible});

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    expect(options.path, contains('/verification/pricing'));
    return ResponseBody.fromString(
      jsonEncode({
        'success': true,
        'data': {
          'individual': <Object>[],
          'business': <Object>[],
          'freeVerification': {
            'enabled': eligible,
            'durationDays': 180,
            'types': ['individual', 'business'],
            'isEligible': eligible,
          },
          'campaign': null,
        },
      }),
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

MainDrawer _drawerWithPricing({required bool eligible}) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test.local/api'))
    ..httpClientAdapter = _PricingAdapter(eligible: eligible);
  return MainDrawer(verificationClient: VerificationClient(dio: dio));
}

void main() {
  testWidgets('signed in: account rows in order, Settings last', (
    tester,
  ) async {
    await _openDrawer(tester);

    final order = ['My Profile', 'Dashboard', 'My Shop', 'Settings'];
    final ys = [
      for (final label in order) tester.getTopLeft(find.text(label)).dy,
    ];
    for (var i = 1; i < ys.length; i++) {
      expect(
        ys[i],
        greaterThan(ys[i - 1]),
        reason: '${order[i]} below ${order[i - 1]}',
      );
    }
    expect(find.text('Live Chat'), findsOneWidget);
    expect(find.text('Support Tickets'), findsOneWidget);
    // Help and Contact moved into Settings for members; FAQ was a duplicate.
    expect(find.text('Help Center'), findsNothing);
    expect(find.text('Contact Us'), findsNothing);
    expect(find.text('FAQ'), findsNothing);
  });

  testWidgets('signed out: sign-in buttons and the help rows stay', (
    tester,
  ) async {
    await _openDrawer(tester, auth: AuthProvider());

    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Sign Up'), findsOneWidget);
    expect(find.text('Help Center'), findsOneWidget);
    expect(find.text('Contact Us'), findsOneWidget);
    expect(find.text('Settings'), findsNothing);
  });

  testWidgets('glass: Android blurs only after the slide, iOS at once', (
    tester,
  ) async {
    await _openDrawer(tester);
    // pumpAndSettle above already ran past the settle delay on Android.
    expect(find.byType(BackdropFilter), findsOneWidget);

    try {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      await _openDrawer(tester);
      expect(find.byType(BackdropFilter), findsOneWidget);
    } finally {
      debugDefaultTargetPlatformOverride = null;
    }
  });

  testWidgets('signed out: the FREE badge shows while the offer is on', (
    tester,
  ) async {
    await _openDrawer(
      tester,
      auth: AuthProvider(),
      drawer: _drawerWithPricing(eligible: true),
    );

    expect(find.text('Get Verified'), findsOneWidget);
    expect(find.text('FREE'), findsOneWidget);
  });

  testWidgets('signed out: no FREE badge when the offer is off', (
    tester,
  ) async {
    await _openDrawer(
      tester,
      auth: AuthProvider(),
      drawer: _drawerWithPricing(eligible: false),
    );

    expect(find.text('FREE'), findsNothing);
  });
}
