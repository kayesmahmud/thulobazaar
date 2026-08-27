import 'dart:developer' as developer;
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_config.dart';

enum UpdateType { none, softPrompt, forceUpdate }

class UpdateCheckResult {
  final UpdateType type;
  final String storeUrl;
  final String latestVersion;

  const UpdateCheckResult({
    required this.type,
    this.storeUrl = '',
    this.latestVersion = '',
  });

  static const none = UpdateCheckResult(type: UpdateType.none);
}

class VersionCheckService {
  static const _firstSeenPrefix = 'version_first_seen_';
  static const _lastPromptPrefix = 'version_last_prompt_';

  /// Minimum gap between dismissible nudges. Without this the sheet appears on
  /// every single launch, which reads as nagging rather than reminding.
  static const _promptIntervalDays = 2;

  /// Check if an app update is needed.
  /// Returns [UpdateCheckResult] with the update type and store URL.
  static Future<UpdateCheckResult> checkForUpdate() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version; // e.g. "1.0.0"

      // If we cannot read our OWN version we must not conclude anything: an
      // empty or malformed string used to parse as 0.0.0, which is below any
      // minVersion and locked the user behind the blocking force screen with
      // no way out. A missed nudge is a far cheaper failure than that.
      if (parseVersion(currentVersion) == null) {
        developer.log(
          'Version check skipped: unreadable version "$currentVersion"',
        );
        return UpdateCheckResult.none;
      }

      // Fetch version config from backend (public, no auth)
      final baseUrl = ApiConfig.baseUrl.replaceFirst(RegExp(r'/api$'), '');
      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );
      final response = await dio.get('$baseUrl/api/app/version');

      if (response.statusCode != 200 || response.data?['success'] != true) {
        return UpdateCheckResult.none;
      }

      final data = response.data;
      final latestVersion = data['latestVersion'] as String? ?? '1.0.0';
      final minVersion = data['minVersion'] as String? ?? '1.0.0';
      final gracePeriodDays = data['gracePeriodDays'] as int? ?? 7;
      final storeUrls = data['storeUrls'] as Map<String, dynamic>? ?? {};
      final storeUrl = Platform.isIOS
          ? (storeUrls['ios'] as String? ?? '')
          : (storeUrls['android'] as String? ?? '');

      // Critical update: below minVersion → immediate force
      if (isVersionBelow(currentVersion, minVersion)) {
        developer.log('Force update: $currentVersion < minVersion $minVersion');
        return UpdateCheckResult(
          type: UpdateType.forceUpdate,
          storeUrl: storeUrl,
          latestVersion: latestVersion,
        );
      }

      // Up to date
      if (!isVersionBelow(currentVersion, latestVersion)) {
        // Clean up old firstSeen entries
        _cleanUpPrefs(latestVersion);
        return UpdateCheckResult.none;
      }

      // New version available — check grace period
      final prefs = await SharedPreferences.getInstance();
      final key = '$_firstSeenPrefix$latestVersion';
      final firstSeenStr = prefs.getString(key);

      if (firstSeenStr == null) {
        // First time seeing this version — record today
        await prefs.setString(key, DateTime.now().toIso8601String());
        developer.log('Soft update: first seen $latestVersion today');
        return _throttledSoftPrompt(
          prefs,
          latestVersion: latestVersion,
          storeUrl: storeUrl,
        );
      }

      final firstSeen = DateTime.tryParse(firstSeenStr);
      if (firstSeen == null) {
        return _throttledSoftPrompt(
          prefs,
          latestVersion: latestVersion,
          storeUrl: storeUrl,
        );
      }

      final daysSinceFirstSeen = DateTime.now().difference(firstSeen).inDays;

      if (daysSinceFirstSeen >= gracePeriodDays) {
        developer.log(
          'Force update: grace period expired ($daysSinceFirstSeen days)',
        );
        return UpdateCheckResult(
          type: UpdateType.forceUpdate,
          storeUrl: storeUrl,
          latestVersion: latestVersion,
        );
      }

      final daysLeft = gracePeriodDays - daysSinceFirstSeen;
      developer.log('Soft update: $daysLeft days left in grace period');
      return _throttledSoftPrompt(
        prefs,
        latestVersion: latestVersion,
        storeUrl: storeUrl,
      );
    } catch (e) {
      // Fail silently — don't block app if API is unreachable
      developer.log('Version check failed: $e');
      return UpdateCheckResult.none;
    }
  }

  /// Show the dismissible sheet at most once every [_promptIntervalDays].
  static Future<UpdateCheckResult> _throttledSoftPrompt(
    SharedPreferences prefs, {
    required String latestVersion,
    required String storeUrl,
  }) async {
    final key = '$_lastPromptPrefix$latestVersion';
    final lastShown = DateTime.tryParse(prefs.getString(key) ?? '');

    if (lastShown != null) {
      final daysSince = DateTime.now().difference(lastShown).inDays;
      if (daysSince < _promptIntervalDays) {
        developer.log(
          'Soft update: nudge suppressed (shown ${daysSince}d ago)',
        );
        return UpdateCheckResult.none;
      }
    }

    await prefs.setString(key, DateTime.now().toIso8601String());
    return UpdateCheckResult(
      type: UpdateType.softPrompt,
      storeUrl: storeUrl,
      latestVersion: latestVersion,
    );
  }

  /// Public for unit tests.
  /// Parse a version string into exactly 3 segments, or null when unreadable.
  /// Never substitutes 0 for a segment it cannot read — that is what turned a
  /// missing version into a forced update.
  static List<int>? parseVersion(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return null;

    final parsed = <int>[];
    for (final segment in trimmed.split('.').take(3)) {
      // Tolerate suffixes like "1.3.1+25" or "1.3.1-beta"
      final digits = segment.split(RegExp(r'[^0-9]')).first;
      final value = int.tryParse(digits);
      if (value == null) return null;
      parsed.add(value);
    }
    while (parsed.length < 3) {
      parsed.add(0);
    }
    return parsed;
  }

  /// Public for unit tests.
  /// Compare semver: returns true if [current] < [target].
  /// Either side being unreadable means "not behind" — we never escalate on
  /// data we could not parse.
  static bool isVersionBelow(String current, String target) {
    final c = parseVersion(current);
    final t = parseVersion(target);
    if (c == null || t == null) return false;

    for (var i = 0; i < 3; i++) {
      if (c[i] < t[i]) return true;
      if (c[i] > t[i]) return false;
    }
    return false; // equal
  }

  /// Remove firstSeen/lastPrompt entries left behind by previous versions.
  static Future<void> _cleanUpPrefs(String currentLatest) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keep = {
        '$_firstSeenPrefix$currentLatest',
        '$_lastPromptPrefix$currentLatest',
      };
      // Materialised with toList(): removing while iterating the live key set
      // throws ConcurrentModificationError.
      final keys = prefs
          .getKeys()
          .where(
            (k) =>
                k.startsWith(_firstSeenPrefix) ||
                k.startsWith(_lastPromptPrefix),
          )
          .toList();
      for (final key in keys) {
        if (!keep.contains(key)) {
          await prefs.remove(key);
        }
      }
    } catch (_) {}
  }
}
