import 'package:flutter/material.dart';

/// Brand tokens for the redesigned surfaces (floating bar, drawer, settings,
/// profile). The red is the logo's #DC143C, which the live site also paints;
/// app_theme.dart's rose drifted from the mark and is being retired screen by
/// screen. Add here, never hard-code a hex at a call site.
abstract final class AppTokens {
  static const Color brand = Color(0xFFDC143C);
  static const Color brandDeep = Color(0xFFB8102F);
  static const Color brandTint = Color(0xFFFDECEF);

  static const Color ink = Color(0xFF111827);
  static const Color inkMuted = Color(0xFF4B5563);
  static const Color inkFaint = Color(0xFF6B7280);
  static const Color hairline = Color(0xFFE5E7EB);
  static const Color canvas = Color(0xFFF9FAFB);
  static const Color surface = Color(0xFFFFFFFF);

  static const Color success = Color(0xFF10B981);
  static const Color successInk = Color(0xFF047857);
  static const Color warningInk = Color(0xFFB45309);
  static const Color danger = Color(0xFFBE123C);

  static const double gutter = 16;
  static const double radiusCard = 18;
  static const double radiusBadge = 12;
}
