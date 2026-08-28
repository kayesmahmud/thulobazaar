import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens for the Thulo Bazaar 2026 redesign.
///
/// This file is the single source of truth for the preview app, and is written
/// so it can be lifted into apps/mobile/lib/core/tokens/ unchanged.
class T {
  // ---- Brand -------------------------------------------------------------
  static const brand = Color(0xFFDC143C); // the logo colour
  static const brandDeep = Color(0xFFDC143C); // CTA fill
  static const brandInk = Color(0xFFB8102F); // links on white

  // ---- Neutrals ----------------------------------------------------------
  static const ink = Color(0xFF111827);
  static const inkMuted = Color(0xFF4B5563);
  static const inkFaint = Color(0xFF6B7280);
  static const hairline = Color(0xFFE5E7EB);
  static const surface = Color(0xFFFFFFFF);

  // ---- Spacing (4dp base) ------------------------------------------------
  static const double gutter = 20;
  static const double cardPad = 18;
  static const double cardPadCompact = 14;

  // ---- Radii (a real scale, replacing 8-on-everything) -------------------
  static const double rChip = 13;
  static const double rTile = 16;
  static const double rMedallion = 26;
  static const double rCard = 22;
  static const double rSheet = 28;

  // ---- Anchor geometry (see GateScaffold) --------------------------------
  static const double toolbar = 56;
  static const double awningTopPad = 8;
  static const double medallion = 84;
  static const double medallionCompact = 68;
  static const double medallionGap = 18;
  static const double medallionGapCompact = 14;
  static const double compactBelow = 700; // device height, NOT viewport

  // ---- Type --------------------------------------------------------------
  // Every style carries an explicit height: Inter has no Devanagari coverage,
  // so Nepali falls back to a font with different ascent/descent metrics.
  static TextStyle headline(bool ne) => GoogleFonts.inter(
        fontSize: ne ? 24 : 26,
        fontWeight: FontWeight.w800,
        letterSpacing: ne ? 0 : -0.4,
        height: ne ? 1.42 : 1.22,
        color: Colors.white,
      );

  static TextStyle subhead(bool ne) => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        height: ne ? 1.60 : 1.45,
        color: Colors.white.withValues(alpha: 0.86),
      );

  static TextStyle benefit(bool ne) => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        height: ne ? 1.52 : 1.35,
        color: ink,
      );

  static TextStyle benefitSub(bool ne) => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        height: ne ? 1.62 : 1.45,
        color: inkFaint,
      );

  static TextStyle tierTitle() => GoogleFonts.inter(
      fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 0.2, height: 1.30);

  static TextStyle tierMeta() => GoogleFonts.inter(
      fontSize: 13, fontWeight: FontWeight.w500, height: 1.45, color: inkFaint);

  static TextStyle tierBullet() => GoogleFonts.inter(
      fontSize: 13, fontWeight: FontWeight.w400, height: 1.45, color: inkMuted);

  static TextStyle ctaLabel() => GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.1,
      height: 1.20,
      color: Colors.white);

  static TextStyle secondary() => GoogleFonts.inter(
      fontSize: 15, fontWeight: FontWeight.w600, height: 1.30, color: brandInk);

  static TextStyle trustChip() => GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      height: 1.30,
      color: inkMuted);
}

/// OFFICIAL palette. Primary is taken from the LOGO ITSELF, not from a CSS
/// variable: apps/web/public/logo.png and the mobile app_icon are #DC143C
/// (313k and 905k pixels respectively). globals.css --color-primary #F43F5E
/// and app_theme.dart both drifted away from the mark; the logo wins.
class Brand {
  // Verified three ways: logo.png (313k px), app_icon.png (905k px), and the
  // LIVE site's compiled CSS where #dc143c is the single most frequent colour
  // and #b8102f is its darker pair. (--color-primary:#f43f5e is declared in
  // globals.css but is not what the site actually paints.)
  static const primary = Color(0xFFDC143C); // the logo / the live site
  static const deep = Color(0xFFB8102F);    // the site's own darker pair
  static const top = Color(0xFFDC143C);     // gradients START at the brand
  static const ink = Color(0xFFB8102F);     // links + labels on white (6.5:1)
  static const tint = Color(0xFFFDECEF);

  static const green = Color(0xFF10B981);     // official "free / success" cue
  static const greenInk = Color(0xFF047857);
  static const verifiedIndividual = Color(0xFF3B82F6);
  static const verifiedBusiness = Color(0xFFB45309);

  // Back-compat aliases so call sites keep reading.
  static const rose = primary;
  static const roseDeep = deep;
  static const roseTop = top;
}

/// Kept as a type so the gate signature does not change, but there is now
/// exactly ONE accent: the brand. Verification tier cards are the only place
/// another colour appears, and only because blue/gold MEAN something there.
class GateAccent {
  final String name;
  final Color deepTop, deep, bright, inkTone;
  const GateAccent(this.name, this.deepTop, this.deep, this.bright, this.inkTone);

  static const brand = GateAccent('brand', Brand.top, Brand.deep,
      Brand.primary, Brand.ink);
}
