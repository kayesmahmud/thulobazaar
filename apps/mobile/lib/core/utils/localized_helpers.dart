import 'package:intl/intl.dart';

/// Nepal Time offset: UTC+5:45
const _nepalOffset = Duration(hours: 5, minutes: 45);

/// Converts a UTC DateTime to Nepal Time (UTC+5:45).
/// If the DateTime is already local (not UTC), it first converts to UTC.
DateTime toNepalTime(DateTime dt) {
  final utc = dt.isUtc ? dt : dt.toUtc();
  return utc.add(_nepalOffset);
}

/// Formats a DateTime in Nepal Time with the given pattern.
/// Pass [locale] ('ne' or 'en') for localized month/day names.
String formatNepalTime(DateTime dt, String pattern, [String locale = 'en']) {
  return DateFormat(pattern, locale).format(toNepalTime(dt));
}

/// Formats price with commas and localized currency symbol.
/// Returns "रु." for Nepali, "Rs." for English.
String formatLocalizedPrice(double? price, String locale) {
  if (price == null)
    return locale == 'ne'
        ? 'मूल्यको लागि सम्पर्क गर्नुहोस्'
        : 'Contact for price';
  if (price == 0) return locale == 'ne' ? 'निःशुल्क' : 'Free';
  final formatted = price
      .toStringAsFixed(0)
      .replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (Match m) => '${m[1]},',
      );
  return locale == 'ne' ? 'रु. $formatted' : 'Rs. $formatted';
}

/// Returns a localized "time ago" string.
String localizedTimeAgo(DateTime dateTime, String locale) {
  final difference = DateTime.now().difference(dateTime);
  if (difference.inDays > 7) {
    return formatNepalTime(dateTime, 'MMM d, yyyy', locale);
  } else if (difference.inDays > 0) {
    final d = difference.inDays;
    return locale == 'ne' ? '$d दिन अघि' : '${d}d ago';
  } else if (difference.inHours > 0) {
    final h = difference.inHours;
    return locale == 'ne' ? '$h घण्टा अघि' : '${h}h ago';
  } else if (difference.inMinutes > 0) {
    final m = difference.inMinutes;
    return locale == 'ne' ? '$m मिनेट अघि' : '${m}m ago';
  } else {
    return locale == 'ne' ? 'भर्खरै' : 'Just now';
  }
}

/// Ad-card publish time, worded like the web card
/// (`formatDateTime` in @thulobazaar/utils): "Just now", "3h ago • 7:22 PM",
/// "Yesterday • 7:22 PM", "3 days ago • 7:22 PM", then "Aug 21 • 9:02 AM"
/// (year only when it differs). Buckets use whole hours/days, like the web.
String formatPublishedTime(DateTime dateTime, String locale, {DateTime? now}) {
  final ref = now ?? DateTime.now();
  final diff = ref.difference(dateTime).abs();
  final hours = diff.inHours;
  final days = diff.inDays;
  final time = formatNepalTime(dateTime, 'h:mm a', locale);
  final ne = locale == 'ne';

  if (hours < 1) return ne ? 'भर्खरै' : 'Just now';
  if (hours < 24) return ne ? '$hours घण्टा अघि • $time' : '${hours}h ago • $time';
  if (days == 1) return ne ? 'हिजो • $time' : 'Yesterday • $time';
  if (days <= 7) return ne ? '$days दिन अघि • $time' : '$days days ago • $time';

  final sameYear = toNepalTime(dateTime).year == toNepalTime(ref).year;
  final date = formatNepalTime(dateTime, sameYear ? 'MMM d' : 'MMM d, yyyy', locale);
  return '$date • $time';
}

/// Common button/action labels
String l(String key, String locale) {
  const ne = {
    'cancel': 'रद्द गर्नुहोस्',
    'retry': 'पुनः प्रयास',
    'done': 'सम्पन्न',
    'save': 'सेभ गर्नुहोस्',
    'proceed': 'अगाडि बढ्नुहोस्',
    'tryAgain': 'पुनः प्रयास गर्नुहोस्',
    'delete': 'हटाउनुहोस्',
    'confirm': 'पुष्टि गर्नुहोस्',
    'close': 'बन्द गर्नुहोस्',
    'search': 'खोज्नुहोस्',
    'apply': 'लागू गर्नुहोस्',
    'reset': 'रिसेट',
    'yes': 'हो',
    'no': 'होइन',
    'back': 'पछाडि',
    'next': 'अर्को',
    'submit': 'पेश गर्नुहोस्',
    'edit': 'सम्पादन',
    'loading': 'लोड हुँदैछ...',
    'noResults': 'कुनै नतिजा भेटिएन',
    'somethingWentWrong': 'केही गलत भयो',
    'description': 'विवरण',
    'location': 'स्थान',
    'category': 'वर्ग',
    'condition': 'अवस्था',
    'price': 'मूल्य',
    'views': 'हेराइहरू',
    'free': 'निःशुल्क',
    'verified': 'प्रमाणित',
    'all': 'सबै',
    'about': 'बारेमा',
    'contactInfo': 'सम्पर्क जानकारी',
  };

  const en = {
    'cancel': 'Cancel',
    'retry': 'Retry',
    'done': 'Done',
    'save': 'Save',
    'proceed': 'Proceed',
    'tryAgain': 'Try Again',
    'delete': 'Delete',
    'confirm': 'Confirm',
    'close': 'Close',
    'search': 'Search',
    'apply': 'Apply',
    'reset': 'Reset',
    'yes': 'Yes',
    'no': 'No',
    'back': 'Back',
    'next': 'Next',
    'submit': 'Submit',
    'edit': 'Edit',
    'loading': 'Loading...',
    'noResults': 'No results found',
    'somethingWentWrong': 'Something went wrong',
    'description': 'Description',
    'location': 'Location',
    'category': 'Category',
    'condition': 'Condition',
    'price': 'Price',
    'views': 'Views',
    'free': 'Free',
    'verified': 'Verified',
    'all': 'All',
    'about': 'About',
    'contactInfo': 'Contact Information',
  };

  if (locale == 'ne') return ne[key] ?? en[key] ?? key;
  return en[key] ?? key;
}

/// Formats a phone number: 9841234567 → 984-123-4567
String formatPhone(String phone) {
  final cleaned = phone.replaceAll(RegExp(r'\D'), '');
  if (cleaned.length == 10) {
    return '${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}';
  }
  return phone;
}

/// Formats a number with commas and abbreviations:
/// 1234567 → "1.2M", 12345 → "12.3K", 999 → "999"
String formatNumber(int number) {
  if (number >= 1000000) return '${(number / 1000000).toStringAsFixed(1)}M';
  if (number >= 1000) return '${(number / 1000).toStringAsFixed(1)}K';
  return number.toString().replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]},',
  );
}

/// Formats distance: < 1km shows meters, >= 1km shows km.
/// Matches web's formatDistance() in @thulobazaar/utils.
String formatDistance(double distanceInKm, [String locale = 'en']) {
  final isNe = locale == 'ne';
  if (distanceInKm < 1) {
    final meters = (distanceInKm * 1000).round();
    return isNe ? '$meters मि. टाढा' : '${meters}m away';
  }
  return isNe
      ? '${distanceInKm.toStringAsFixed(1)} कि.मि. टाढा'
      : '${distanceInKm.toStringAsFixed(1)}km away';
}

/// Formats file size: 1048576 → "1 MB".
/// Matches web's formatFileSize() in @thulobazaar/utils.
String formatFileSize(int bytes) {
  if (bytes == 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  int i = 0;
  double size = bytes.toDouble();
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return '${size.toStringAsFixed(size < 10 && i > 0 ? 1 : 0)} ${units[i]}';
}
