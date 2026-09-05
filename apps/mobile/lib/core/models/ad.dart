import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

/// Ad models - mirrors @thulobazaar/types Ad interfaces

enum AdStatus { pending, active, sold, rejected, expired }

enum PromotionType { featured, urgent, spotlight, homepage }

/// Main Ad model
class Ad {
  final int id;
  final int userId;
  final String title;
  final String description;
  final double price;
  final int categoryId;
  final int? subcategoryId;
  final int locationId;
  final int? areaId;
  final String slug;
  final AdStatus status;
  final List<String> images;
  final String? thumbnail;
  final double? latitude;
  final double? longitude;
  final String? googleMapsLink;
  final int viewCount;
  final bool isNegotiable;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? reviewedAt;

  // Promotion fields
  final bool isFeatured;
  final bool isUrgent;
  final bool isSticky;
  final DateTime? featuredUntil;
  final DateTime? urgentUntil;
  final DateTime? stickyUntil;

  // Category-specific attributes
  final Map<String, dynamic>? attributes;

  // Condition field (new/used)
  final String? condition;

  // Favorites count
  final int favoritesCount;

  // Location type (district, municipality, area, etc.)
  final String? locationType;

  // AI moderation surface (owner-only; populated by my-ads responses).
  // aiReasonCode maps to a bilingual message; raw AI text stays editor-only.
  final bool aiHeld;
  final String? aiReasonCode;

  /// Real category the AI thinks this ad belongs in (validated server-side).
  final String? aiSuggestedCategory;

  Ad({
    required this.id,
    required this.userId,
    required this.title,
    required this.description,
    required this.price,
    required this.categoryId,
    this.subcategoryId,
    required this.locationId,
    this.areaId,
    required this.slug,
    required this.status,
    required this.images,
    this.thumbnail,
    this.latitude,
    this.longitude,
    this.googleMapsLink,
    required this.viewCount,
    required this.isNegotiable,
    required this.createdAt,
    required this.updatedAt,
    this.reviewedAt,
    this.isFeatured = false,
    this.isUrgent = false,
    this.isSticky = false,
    this.featuredUntil,
    this.urgentUntil,
    this.stickyUntil,
    this.attributes,
    this.condition,
    this.favoritesCount = 0,
    this.locationType,
    this.aiHeld = false,
    this.aiReasonCode,
    this.aiSuggestedCategory,
  });

  factory Ad.fromJson(Map<String, dynamic> json) {
    try {
      return Ad(
        id: json['id'] as int,
        userId: json['userId'] as int? ?? json['user_id'] as int? ?? 0,
        title: json['title'] as String? ?? '',
        description: json['description'] as String? ?? '',
        price: _parseDouble(json['price']),
        categoryId:
            json['categoryId'] as int? ?? json['category_id'] as int? ?? 0,
        subcategoryId:
            json['subcategoryId'] as int? ?? json['subcategory_id'] as int?,
        locationId:
            json['locationId'] as int? ?? json['location_id'] as int? ?? 0,
        areaId: json['areaId'] as int? ?? json['area_id'] as int?,
        slug: json['slug'] as String? ?? '',
        status: _parseAdStatus(json['status']),
        images: _parseImages(json['images']),
        thumbnail: json['thumbnail'] as String?,
        latitude: _parseDoubleNullable(json['latitude']),
        longitude: _parseDoubleNullable(json['longitude']),
        googleMapsLink:
            json['googleMapsLink'] as String? ??
            json['google_maps_link'] as String?,
        viewCount: json['viewCount'] as int? ?? json['view_count'] as int? ?? 0,
        aiHeld: json['aiHeld'] as bool? ?? false,
        aiReasonCode: json['aiReasonCode'] as String?,
        aiSuggestedCategory: json['aiSuggestedCategory'] as String?,
        isNegotiable:
            json['isNegotiable'] as bool? ??
            json['is_negotiable'] as bool? ??
            false,
        createdAt: _parseDateTime(json['createdAt'] ?? json['created_at']),
        updatedAt: _parseDateTime(json['updatedAt'] ?? json['updated_at']),
        reviewedAt: _parseDateTimeNullable(
          json['reviewedAt'] ?? json['reviewed_at'],
        ),
        isFeatured:
            json['isFeatured'] as bool? ??
            json['is_featured'] as bool? ??
            false,
        isUrgent:
            json['isUrgent'] as bool? ?? json['is_urgent'] as bool? ?? false,
        isSticky:
            json['isSticky'] as bool? ?? json['is_sticky'] as bool? ?? false,
        featuredUntil: _parseDateTimeNullable(
          json['featuredUntil'] ?? json['featured_until'],
        ),
        urgentUntil: _parseDateTimeNullable(
          json['urgentUntil'] ?? json['urgent_until'],
        ),
        stickyUntil: _parseDateTimeNullable(
          json['stickyUntil'] ?? json['sticky_until'],
        ),
        attributes:
            json['attributes'] as Map<String, dynamic>? ??
            json['custom_fields'] as Map<String, dynamic>?,
        condition: json['condition'] as String?,
        favoritesCount:
            json['favoritesCount'] as int? ??
            json['favorites_count'] as int? ??
            0,
        locationType:
            json['locationType'] as String? ?? json['location_type'] as String?,
      );
    } catch (e, stack) {
      if (kDebugMode) {
        developer.log('Error parsing Ad.fromJson: $e', name: 'Ad');
        developer.log('JSON: $json', name: 'Ad');
        developer.log('$stack', name: 'Ad');
      }
      rethrow;
    }
  }

  /// Published date = reviewedAt (approval time) or createdAt as fallback.
  /// Matches web behavior: ad.publishedAt || ad.createdAt
  DateTime get publishedAt => reviewedAt ?? createdAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'description': description,
      'price': price,
      'categoryId': categoryId,
      'subcategoryId': subcategoryId,
      'locationId': locationId,
      'areaId': areaId,
      'slug': slug,
      'status': status.name,
      'images': images,
      'thumbnail': thumbnail,
      'latitude': latitude,
      'longitude': longitude,
      'googleMapsLink': googleMapsLink,
      'viewCount': viewCount,
      'isNegotiable': isNegotiable,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isFeatured': isFeatured,
      'isUrgent': isUrgent,
      'isSticky': isSticky,
      'featuredUntil': featuredUntil?.toIso8601String(),
      'urgentUntil': urgentUntil?.toIso8601String(),
      'stickyUntil': stickyUntil?.toIso8601String(),
      'attributes': attributes,
      'condition': condition,
      'favoritesCount': favoritesCount,
      'locationType': locationType,
      'aiHeld': aiHeld,
      'aiReasonCode': aiReasonCode,
      'aiSuggestedCategory': aiSuggestedCategory,
    };
  }

  /// Get the primary image (first image or thumbnail)
  String? get primaryImage {
    if (thumbnail != null && thumbnail!.isNotEmpty) return thumbnail;
    if (images.isNotEmpty) return images.first;
    return null;
  }

  Ad copyWith({
    int? id,
    int? userId,
    String? title,
    String? description,
    double? price,
    int? categoryId,
    int? subcategoryId,
    int? locationId,
    int? areaId,
    String? slug,
    AdStatus? status,
    List<String>? images,
    String? thumbnail,
    double? latitude,
    double? longitude,
    String? googleMapsLink,
    int? viewCount,
    bool? isNegotiable,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isFeatured,
    bool? isUrgent,
    bool? isSticky,
    DateTime? featuredUntil,
    DateTime? urgentUntil,
    DateTime? stickyUntil,
    Map<String, dynamic>? attributes,
    String? condition,
    int? favoritesCount,
    String? locationType,
    bool? aiHeld,
    String? aiReasonCode,
    String? aiSuggestedCategory,
  }) {
    return Ad(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      price: price ?? this.price,
      categoryId: categoryId ?? this.categoryId,
      subcategoryId: subcategoryId ?? this.subcategoryId,
      locationId: locationId ?? this.locationId,
      areaId: areaId ?? this.areaId,
      slug: slug ?? this.slug,
      status: status ?? this.status,
      images: images ?? this.images,
      thumbnail: thumbnail ?? this.thumbnail,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      googleMapsLink: googleMapsLink ?? this.googleMapsLink,
      viewCount: viewCount ?? this.viewCount,
      isNegotiable: isNegotiable ?? this.isNegotiable,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isFeatured: isFeatured ?? this.isFeatured,
      isUrgent: isUrgent ?? this.isUrgent,
      isSticky: isSticky ?? this.isSticky,
      featuredUntil: featuredUntil ?? this.featuredUntil,
      urgentUntil: urgentUntil ?? this.urgentUntil,
      stickyUntil: stickyUntil ?? this.stickyUntil,
      attributes: attributes ?? this.attributes,
      condition: condition ?? this.condition,
      favoritesCount: favoritesCount ?? this.favoritesCount,
      locationType: locationType ?? this.locationType,
      aiHeld: aiHeld ?? this.aiHeld,
      aiReasonCode: aiReasonCode ?? this.aiReasonCode,
      aiSuggestedCategory: aiSuggestedCategory ?? this.aiSuggestedCategory,
    );
  }
}

/// Ad with additional details (seller info, category/location names)
/// One level of an ad's location chain (leaf → root: Area, District, Province).
class AdLocationLevel {
  final int id;
  final String name;
  final String? nameNe;
  final String? type;

  const AdLocationLevel({
    required this.id,
    required this.name,
    this.nameNe,
    this.type,
  });

  factory AdLocationLevel.fromJson(Map<String, dynamic> json) =>
      AdLocationLevel(
        id: json['id'] as int,
        name: json['name'] as String? ?? '',
        nameNe: json['name_ne'] as String?,
        type: json['type'] as String?,
      );

  String localizedName(String locale) =>
      locale == 'ne' && nameNe != null && nameNe!.isNotEmpty ? nameNe! : name;
}

class AdWithDetails extends Ad {
  final String userName;
  final String? userAvatar;
  final String? userPhone;
  final bool userVerified;
  final String categoryName;
  final String? categoryNameNe;
  final String? subcategoryName;
  final String? subcategoryNameNe;
  final String locationName;
  final String? locationNameNe;

  /// District only — what the ad card shows. Municipality names run to 43
  /// characters and truncate in a card; districts top out at 16. English in
  /// both locales, like every other place name in the app.
  final String? districtName;
  final String? areaName;
  final String? areaNameNe;
  final List<AdLocationLevel> locationLevels;

  // Additional seller info
  final String? accountType;
  final String? businessVerificationStatus;
  final bool? individualVerified;
  final String? shopSlug;

  AdWithDetails({
    required super.id,
    required super.userId,
    required super.title,
    required super.description,
    required super.price,
    required super.categoryId,
    super.subcategoryId,
    required super.locationId,
    super.areaId,
    required super.slug,
    required super.status,
    required super.images,
    super.thumbnail,
    super.latitude,
    super.longitude,
    super.googleMapsLink,
    required super.viewCount,
    required super.isNegotiable,
    required super.createdAt,
    required super.updatedAt,
    super.reviewedAt,
    super.isFeatured,
    super.isUrgent,
    super.isSticky,
    super.featuredUntil,
    super.urgentUntil,
    super.stickyUntil,
    super.attributes,
    super.condition,
    super.favoritesCount,
    super.locationType,
    super.aiHeld,
    super.aiReasonCode,
    super.aiSuggestedCategory,
    required this.userName,
    this.userAvatar,
    this.userPhone,
    required this.userVerified,
    required this.categoryName,
    this.categoryNameNe,
    this.subcategoryName,
    this.subcategoryNameNe,
    required this.locationName,
    this.locationNameNe,
    this.districtName,
    this.areaName,
    this.areaNameNe,
    this.locationLevels = const [],
    this.accountType,
    this.businessVerificationStatus,
    this.individualVerified,
    this.shopSlug,
  });

  factory AdWithDetails.fromJson(Map<String, dynamic> json) {
    final ad = Ad.fromJson(json);
    return AdWithDetails(
      id: ad.id,
      userId: ad.userId,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      categoryId: ad.categoryId,
      subcategoryId: ad.subcategoryId,
      locationId: ad.locationId,
      areaId: ad.areaId,
      slug: ad.slug,
      status: ad.status,
      images: ad.images,
      thumbnail: ad.thumbnail,
      latitude: ad.latitude,
      longitude: ad.longitude,
      googleMapsLink: ad.googleMapsLink,
      viewCount: ad.viewCount,
      isNegotiable: ad.isNegotiable,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
      // Keep the API's display time (reviewedAt = stable publish time) —
      // dropping it made publishedAt degrade to createdAt on every screen.
      reviewedAt: ad.reviewedAt,
      isFeatured: ad.isFeatured,
      isUrgent: ad.isUrgent,
      isSticky: ad.isSticky,
      featuredUntil: ad.featuredUntil,
      urgentUntil: ad.urgentUntil,
      stickyUntil: ad.stickyUntil,
      attributes: ad.attributes,
      condition: ad.condition,
      favoritesCount: ad.favoritesCount,
      locationType: ad.locationType,
      // Owner-only AI moderation surface — dropping these here would silently
      // hide the hold-reason banner (same trap as reviewedAt above).
      aiHeld: ad.aiHeld,
      aiReasonCode: ad.aiReasonCode,
      aiSuggestedCategory: ad.aiSuggestedCategory,
      userName:
          json['userName'] as String? ??
          json['user_name'] as String? ??
          json['sellerName'] as String? ??
          'Unknown',
      userAvatar:
          json['userAvatar'] as String? ?? json['user_avatar'] as String?,
      userPhone: json['userPhone'] as String? ?? json['user_phone'] as String?,
      userVerified:
          json['userVerified'] as bool? ??
          json['user_verified'] as bool? ??
          false,
      categoryName:
          json['categoryName'] as String? ??
          json['category_name'] as String? ??
          '',
      categoryNameNe:
          json['categoryNameNe'] as String? ??
          json['category_name_ne'] as String?,
      subcategoryName:
          json['subcategoryName'] as String? ??
          json['subcategory_name'] as String?,
      subcategoryNameNe:
          json['subcategoryNameNe'] as String? ??
          json['subcategory_name_ne'] as String?,
      locationName:
          json['locationName'] as String? ??
          json['location_name'] as String? ??
          '',
      locationLevels: (json['locationLevels'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(AdLocationLevel.fromJson)
          .toList(),
      locationNameNe:
          json['locationNameNe'] as String? ??
          json['location_name_ne'] as String?,
      districtName:
          json['districtName'] as String? ?? json['district_name'] as String?,
      areaName: json['areaName'] as String? ?? json['area_name'] as String?,
      areaNameNe:
          json['areaNameNe'] as String? ?? json['area_name_ne'] as String?,
      accountType:
          json['accountType'] as String? ?? json['account_type'] as String?,
      businessVerificationStatus:
          json['businessVerificationStatus'] as String? ??
          json['business_verification_status'] as String?,
      individualVerified:
          json['individualVerified'] as bool? ??
          json['individual_verified'] as bool?,
      shopSlug: json['shopSlug'] as String? ?? json['shop_slug'] as String?,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json.addAll({
      'userName': userName,
      'userAvatar': userAvatar,
      'userPhone': userPhone,
      'userVerified': userVerified,
      'categoryName': categoryName,
      'categoryNameNe': categoryNameNe,
      'subcategoryName': subcategoryName,
      'subcategoryNameNe': subcategoryNameNe,
      'locationName': locationName,
      'locationNameNe': locationNameNe,
      'districtName': districtName,
      'areaName': areaName,
      'areaNameNe': areaNameNe,
      'accountType': accountType,
      'businessVerificationStatus': businessVerificationStatus,
      'individualVerified': individualVerified,
      'shopSlug': shopSlug,
    });
    return json;
  }

  /// Get the shop slug for navigation (uses shopSlug if available, else fallback to user-{userId})
  String get effectiveShopSlug => shopSlug ?? 'user-$userId';

  /// Get localized category name based on locale
  String localizedCategoryName(String locale) =>
      locale == 'ne' && categoryNameNe != null && categoryNameNe!.isNotEmpty
      ? categoryNameNe!
      : categoryName;

  /// Get localized location name based on locale
  String localizedLocationName(String locale) =>
      locale == 'ne' && locationNameNe != null && locationNameNe!.isNotEmpty
      ? locationNameNe!
      : locationName;

  /// Get localized subcategory name based on locale
  String? localizedSubcategoryName(String locale) =>
      locale == 'ne' &&
          subcategoryNameNe != null &&
          subcategoryNameNe!.isNotEmpty
      ? subcategoryNameNe
      : subcategoryName;

  /// Get localized area name based on locale
  String? localizedAreaName(String locale) =>
      locale == 'ne' && areaNameNe != null && areaNameNe!.isNotEmpty
      ? areaNameNe
      : areaName;
}

// Helper functions
AdStatus _parseAdStatus(dynamic value) {
  if (value == null) return AdStatus.pending;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'active':
    case 'approved':
      return AdStatus.active;
    case 'sold':
      return AdStatus.sold;
    case 'rejected':
      return AdStatus.rejected;
    case 'expired':
      return AdStatus.expired;
    default:
      return AdStatus.pending;
  }
}

List<String> _parseImages(dynamic value) {
  if (value == null) return [];
  if (value is List) {
    return value.map((e) {
      if (e is String) return e;
      if (e is Map && e['file_path'] != null) return e['file_path'] as String;
      if (e is Map && e['filePath'] != null) return e['filePath'] as String;
      return e.toString();
    }).toList();
  }
  return [];
}

double _parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  return double.tryParse(value.toString()) ?? 0.0;
}

double? _parseDoubleNullable(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  return double.tryParse(value.toString());
}

DateTime _parseDateTime(dynamic value) {
  if (value == null) return DateTime.now();
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString()) ?? DateTime.now();
}

DateTime? _parseDateTimeNullable(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}
