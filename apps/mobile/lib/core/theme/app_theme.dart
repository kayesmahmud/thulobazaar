import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';

class AppTheme {
  // Brand Colors from globals.css
  static const Color primary = Color(0xFFF43F5E); // --color-primary
  static const Color secondary = Color(0xFF3B82F6); // --color-secondary
  static const Color background = Color(0xFFFFFFFF); // body background
  static const Color textDark = Color(0xFF111827); // body color
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFDC2626);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        secondary: secondary,
        error: error,
        surface: background,
      ),

      // Typography
      textTheme: AppFont.interTextTheme().apply(
        bodyColor: textDark,
        displayColor: textDark,
      ),

      // App Bar Theme
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: textDark),
        titleTextStyle: AppFont.inter(
          color: textDark,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),

      // Button Styling
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: AppFont.inter(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),

      // Text Button (for links)
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary, // Or secondary depending on exact usage
          textStyle: AppFont.inter(fontWeight: FontWeight.w500, fontSize: 14),
        ),
      ),

      // Input Fields
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF9FAFB), // gray-50
        // Default border
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(
            12,
          ), // Slightly more rounded based on screenshots
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)), // gray-200
        ),
        // Enabled state
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        // Focused state
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        labelStyle: AppFont.inter(color: Colors.grey[600]),
        hintStyle: AppFont.inter(color: Colors.grey[400]),
      ),
    );
  }
}
