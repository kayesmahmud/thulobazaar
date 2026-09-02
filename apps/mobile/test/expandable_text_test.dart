import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/widgets/expandable_text.dart';

Widget _host(String text) => MaterialApp(
  home: Scaffold(
    // The ad page hosts this inside a scroll view; mirror that so the
    // expanded text has room to grow.
    body: SingleChildScrollView(
      child: SizedBox(
        width: 320,
        child: ExpandableText(
          text: text,
          style: const TextStyle(fontSize: 14, height: 1.5),
          linkStyle: const TextStyle(fontWeight: FontWeight.w700),
          moreLabel: 'View more',
          lessLabel: 'View less',
        ),
      ),
    ),
  ),
);

void main() {
  final long = List.filled(60, 'custom sublimation football jersey').join(' ');

  testWidgets('short text shows no toggle', (tester) async {
    await tester.pumpWidget(_host('Two lines at most.'));
    expect(find.text('View more'), findsNothing);
  });

  testWidgets('long text clamps to 8 lines and expands in place', (
    tester,
  ) async {
    await tester.pumpWidget(_host(long));
    final text = tester.widget<Text>(find.text(long));
    expect(text.maxLines, 8);
    expect(find.text('View more'), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('expandable_text_toggle')));
    await tester.pumpAndSettle();
    expect(tester.widget<Text>(find.text(long)).maxLines, isNull);
    expect(find.text('View less'), findsOneWidget);
  });
}
