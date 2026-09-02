import 'package:flutter/widgets.dart';

/// For screens that show a sign-in gate while signed out and load their data
/// per account.
///
/// Since sign-in returns the user to the screen they were on (instead of
/// rebuilding the app on Home), a screen that only loaded in `initState`
/// would sit there empty after the gate. Call [loadOnceFor] from `build`,
/// after the gate check, and the loader runs once per signed-in user id —
/// on first build and again right after a sign-in or account switch.
mixin PerUserLoad<T extends StatefulWidget> on State<T> {
  int? _loadedForUser;

  void loadOnceFor(int? userId, VoidCallback load) {
    if (userId == null || userId == _loadedForUser) return;
    _loadedForUser = userId;
    // Post-frame: loaders call setState, which build may not do directly.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) load();
    });
  }
}
