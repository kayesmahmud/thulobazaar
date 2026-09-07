import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mobile/core/utils/localized_helpers.dart';

/// Card publish time must read like the web card: relative within a week,
/// date afterwards, always with the Nepal-time clock.
void main() {
  setUpAll(() async {
    await initializeDateFormatting('ne');
  });

  // Nepal is UTC+5:45, so 13:29 UTC is 7:14 PM in Nepal.
  final now = DateTime.utc(2026, 9, 7, 16, 49);

  String en(DateTime dt) => formatPublishedTime(dt, 'en', now: now);
  String ne(DateTime dt) => formatPublishedTime(dt, 'ne', now: now);
  // Nepali locale renders the clock in Devanagari digits ("७:१४ अपराह्न"),
  // exactly as the old absolute-date card did.
  String neClock(DateTime dt) => formatNepalTime(dt, 'h:mm a', 'ne');

  test('under an hour is Just now', () {
    expect(en(now.subtract(const Duration(minutes: 59))), 'Just now');
    expect(ne(now.subtract(const Duration(minutes: 5))), 'भर्खरै');
  });

  test('same day shows whole hours plus the clock', () {
    final dt = now.subtract(const Duration(hours: 3, minutes: 20));
    expect(en(dt), '3h ago • 7:14 PM');
    expect(ne(dt), '3 घण्टा अघि • ${neClock(dt)}');
  });

  test('one day ago is Yesterday', () {
    final dt = now.subtract(const Duration(hours: 30));
    expect(en(dt), 'Yesterday • 4:34 PM');
    expect(ne(dt), 'हिजो • ${neClock(dt)}');
  });

  test('up to a week counts days', () {
    final dt = now.subtract(const Duration(days: 7));
    expect(en(dt), '7 days ago • 10:34 PM');
    expect(ne(dt), '7 दिन अघि • ${neClock(dt)}');
  });

  test('older than a week shows the date, year only when it differs', () {
    expect(en(DateTime.utc(2026, 8, 21, 3, 17)), 'Aug 21 • 9:02 AM');
    expect(en(DateTime.utc(2025, 12, 27, 18, 21)), 'Dec 28, 2025 • 12:06 AM');
  });
}
