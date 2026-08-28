import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app.dart';
import 'tokens.dart';

void main() => runApp(const DesignPreviewApp());

/// Thulo Bazaar — DESIGN PREVIEW.
///
/// A clickable prototype. No API, no database, no real auth. Everything is
/// in-memory mock data (see mock.dart) so any screen can be reached in one tap.
/// Separate applicationId (com.thulobazaar.designpreview) so it installs
/// alongside the real app and can never touch live data.
class DesignPreviewApp extends StatelessWidget {
  const DesignPreviewApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TB Design Preview',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        colorScheme: ColorScheme.fromSeed(
          seedColor: T.brand,
          primary: T.brand,
        ),
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: const RootShell(),
    );
  }
}
