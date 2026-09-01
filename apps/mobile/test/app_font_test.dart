import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_font.dart';

void main() {
  // google_fonts reads the asset bundle when a style is created.
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'every AppFont style ends its fallback chain with the Nepali family',
    () {
      // Only weights bundled in assets/google_fonts: an unbundled weight makes
      // google_fonts try the network, which the test sandbox refuses.
      final styles = [
        AppFont.inter(fontWeight: FontWeight.w700),
        AppFont.poppins(fontWeight: FontWeight.w600),
        AppFont.robotoMono(),
        AppFont.roboto(fontWeight: FontWeight.w500),
      ];
      for (final style in styles) {
        final fallback = style.fontFamilyFallback;
        expect(
          fallback,
          isNotNull,
          reason: '${style.fontFamily} lost its fallback',
        );
        // The Latin family stays first so Inter keeps every glyph it has;
        // Mukta only serves the Devanagari glyphs Inter lacks.
        expect(fallback?.last, AppFont.nepaliFamily);
        expect(fallback?.length, greaterThan(1));
      }
    },
  );

  test('the theme text styles carry the Nepali fallback too', () {
    final theme = AppFont.interTextTheme();
    expect(
      theme.bodyMedium?.fontFamilyFallback,
      contains(AppFont.nepaliFamily),
    );
    expect(
      theme.titleLarge?.fontFamilyFallback,
      contains(AppFont.nepaliFamily),
    );
  });

  test(
    'no screen calls GoogleFonts directly (the fallback lives in AppFont)',
    () {
      // One direct call silently loses the Devanagari fallback for that widget.
      final offenders = Directory('lib')
          .listSync(recursive: true)
          .whereType<File>()
          .where((f) => f.path.endsWith('.dart'))
          .where((f) => !f.path.endsWith('core/theme/app_font.dart'))
          .where((f) => f.readAsStringSync().contains('GoogleFonts.'))
          .map((f) => f.path)
          .toList();
      expect(offenders, isEmpty);
    },
  );
}
