import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/services/version_check_service.dart';

/// These guard a lockout-class bug: an unreadable app version used to parse as
/// 0.0.0, which sits below every minVersion and dropped the user onto the
/// blocking force-update screen with no way out.
void main() {
  group('parseVersion', () {
    test('parses plain semver', () {
      expect(VersionCheckService.parseVersion('1.3.1'), [1, 3, 1]);
    });

    test('pads short versions', () {
      expect(VersionCheckService.parseVersion('2'), [2, 0, 0]);
      expect(VersionCheckService.parseVersion('1.4'), [1, 4, 0]);
    });

    test('tolerates build and pre-release suffixes', () {
      expect(VersionCheckService.parseVersion('1.3.1+25'), [1, 3, 1]);
      expect(VersionCheckService.parseVersion('1.3.1-beta'), [1, 3, 1]);
    });

    test('returns null when unreadable instead of guessing zero', () {
      expect(VersionCheckService.parseVersion(''), isNull);
      expect(VersionCheckService.parseVersion('   '), isNull);
      expect(VersionCheckService.parseVersion('beta'), isNull);
      expect(VersionCheckService.parseVersion('1.x.0'), isNull);
    });
  });

  group('isVersionBelow', () {
    test('compares numerically, not lexically', () {
      expect(VersionCheckService.isVersionBelow('1.0.6', '1.3.1'), isTrue);
      expect(VersionCheckService.isVersionBelow('1.3.1', '1.0.6'), isFalse);
      expect(VersionCheckService.isVersionBelow('1.10.0', '1.9.0'), isFalse);
    });

    test('equal versions are not below', () {
      expect(VersionCheckService.isVersionBelow('1.3.1', '1.3.1'), isFalse);
    });

    test('an unreadable own version is never treated as behind', () {
      // The TestFlight force-update symptom: empty version vs a real minVersion.
      expect(VersionCheckService.isVersionBelow('', '1.0.6'), isFalse);
      expect(VersionCheckService.isVersionBelow('beta', '1.0.6'), isFalse);
    });

    test('an unreadable server value never forces an update', () {
      expect(VersionCheckService.isVersionBelow('1.3.1', ''), isFalse);
      expect(VersionCheckService.isVersionBelow('1.3.1', 'garbage'), isFalse);
    });
  });
}
