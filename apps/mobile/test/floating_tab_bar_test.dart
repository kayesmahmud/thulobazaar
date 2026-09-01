import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/widgets/floating_tab_bar.dart';

Widget _host({
  bool compact = false,
  ValueChanged<int>? onTap,
  VoidCallback? onPost,
}) {
  return MaterialApp(
    home: Scaffold(
      extendBody: true,
      body: const SizedBox.expand(),
      bottomNavigationBar: FloatingTabBar(
        compact: compact,
        currentIndex: 0,
        onTap: onTap ?? (_) {},
        onPost: onPost ?? () {},
        postLabel: 'Post free ad',
        items: const [
          FloatingTabItem(icon: Icon(Icons.home), label: 'Home'),
          FloatingTabItem(icon: Icon(Icons.search), label: 'Search'),
          FloatingTabItem(icon: Icon(Icons.chat), label: 'Chats'),
          FloatingTabItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    ),
  );
}

void main() {
  testWidgets('expanded bar shows every label and routes taps', (tester) async {
    int? tapped;
    var posted = false;
    await tester.pumpWidget(
      _host(onTap: (i) => tapped = i, onPost: () => posted = true),
    );
    await tester.pumpAndSettle();

    for (final label in ['Home', 'Search', 'Chats', 'Profile']) {
      expect(find.text(label), findsOneWidget);
    }
    await tester.tap(find.text('Search'));
    expect(tapped, 1);
    await tester.tap(find.bySemanticsLabel('Post free ad'));
    expect(posted, isTrue);
  });

  testWidgets('compact bar hides labels but keeps tabs tappable', (
    tester,
  ) async {
    int? tapped;
    await tester.pumpWidget(_host(compact: true, onTap: (i) => tapped = i));
    await tester.pumpAndSettle();

    expect(find.text('Search'), findsNothing);
    await tester.tap(find.byIcon(Icons.search));
    expect(tapped, 1);
  });

  testWidgets('reserves the same height compact or not', (tester) async {
    await tester.pumpWidget(_host());
    await tester.pumpAndSettle();
    final expanded = tester.getSize(find.byType(FloatingTabBar));
    await tester.pumpWidget(_host(compact: true));
    await tester.pumpAndSettle();
    expect(tester.getSize(find.byType(FloatingTabBar)), expanded);
  });

  testWidgets('blurs on iOS only', (tester) async {
    try {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      await tester.pumpWidget(_host());
      await tester.pumpAndSettle();
      expect(find.byType(BackdropFilter), findsOneWidget);

      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      await tester.pumpWidget(_host());
      await tester.pumpAndSettle();
      expect(find.byType(BackdropFilter), findsNothing);
    } finally {
      debugDefaultTargetPlatformOverride = null;
    }
  });
}
