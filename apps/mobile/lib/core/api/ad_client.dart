import 'dart:developer' as developer;
import 'api_error.dart';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/models.dart';
import 'package:mobile/features/post_ad/models/location_models.dart';
import 'dio_client.dart';

/// Ad API Client - handles all ad-related API calls
class AdClient {
  final Dio _dio;

  AdClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

  // ==========================================
  // BROWSE/LIST ADS
  // ==========================================

  /// Get paginated list of ads with optional filters
  Future<PaginatedResponse<AdWithDetails>> getAds({
    int page = 1,
    int limit = 20,
    int? categoryId,
    int? subcategoryId,
    int? locationId,
    int? areaId,
    double? minPrice,
    double? maxPrice,
    String? condition,
    String? sortBy,
    String? sortOrder,
    String? search,
    bool? isFeatured,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'offset': (page - 1) * limit,
        'limit': limit,
      };

      if (categoryId != null) queryParams['category_id'] = categoryId;
      if (subcategoryId != null) queryParams['subcategory_id'] = subcategoryId;
      if (locationId != null) queryParams['location_id'] = locationId;
      if (areaId != null) queryParams['area_id'] = areaId;
      if (minPrice != null) queryParams['min_price'] = minPrice;
      if (maxPrice != null) queryParams['max_price'] = maxPrice;
      if (condition != null) queryParams['condition'] = condition;
      // Map sort params to API format (price-low, price-high, newest, oldest)
      if (sortBy != null) {
        String apiSort = 'newest'; // Default
        if (sortBy == 'price') {
          apiSort = sortOrder == 'asc' ? 'price-low' : 'price-high';
        } else if (sortBy == 'date') {
          apiSort = sortOrder == 'asc' ? 'oldest' : 'newest';
        }
        queryParams['sortBy'] = apiSort;
      }
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (isFeatured != null) queryParams['is_featured'] = isFeatured;

      final response = await _dio.get('/ads', queryParameters: queryParams);

      return PaginatedResponse.fromJson(
        response.data as Map<String, dynamic>,
        (json) => AdWithDetails.fromJson(json),
      );
    } on DioException catch (e) {
      return PaginatedResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch ads',
      );
    }
  }

  /// Get ads using SearchFilters object
  Future<PaginatedResponse<AdWithDetails>> searchAds(
    SearchFilters filters, {
    int page = 1,
    int limit = 20,
  }) async {
    return getAds(
      page: page,
      limit: limit,
      categoryId: filters.categoryId,
      subcategoryId: filters.subcategoryId,
      locationId: filters.locationId,
      areaId: filters.areaId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      condition: filters.condition,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      search: filters.query,
    );
  }

  /// Get featured ads
  Future<PaginatedResponse<AdWithDetails>> getFeaturedAds({
    int limit = 6,
  }) async {
    return getAds(limit: limit, isFeatured: true);
  }

  /// Get latest ads
  Future<PaginatedResponse<AdWithDetails>> getLatestAds({
    int page = 1,
    int limit = 8,
  }) async {
    return getAds(page: page, limit: limit, sortBy: 'date', sortOrder: 'desc');
  }

  // ==========================================
  // SINGLE AD
  // ==========================================

  /// Get ad by ID
  Future<ApiResponse<AdWithDetails>> getAdById(int id) async {
    try {
      final response = await _dio.get('/ads/$id');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          AdWithDetails.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Ad not found');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch ad',
      );
    }
  }

  /// Get ad by slug
  Future<ApiResponse<AdWithDetails>> getAdBySlug(String slug) async {
    try {
      final response = await _dio.get('/ads/slug/$slug');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          AdWithDetails.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Ad not found');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch ad',
      );
    }
  }

  /// Increment ad view count
  Future<void> incrementView(int adId) async {
    try {
      await _dio.post('/ads/$adId/view');
    } catch (e) {
      // Silently fail - view count is not critical
      if (kDebugMode)
        developer.log('Failed to increment view: $e', name: 'AdClient');
    }
  }

  // ==========================================
  // USER'S ADS (MY ADS)
  // ==========================================

  /// Get current user's ads (requires auth)
  Future<PaginatedResponse<AdWithDetails>> getMyAds({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': limit};
      if (status != null) queryParams['status'] = status;

      final response = await _dio.get(
        '/ads/my-ads',
        queryParameters: queryParams,
      );

      // Handle both paginated and non-paginated responses
      if (response.data['success'] == true) {
        final data = response.data['data'];
        if (data is List) {
          // Non-paginated response
          return PaginatedResponse.success(
            data
                .map((e) => AdWithDetails.fromJson(e as Map<String, dynamic>))
                .toList(),
            PaginationInfo(
              page: 1,
              limit: data.length,
              total: data.length,
              totalPages: 1,
            ),
          );
        }
        // Paginated response
        return PaginatedResponse.fromJson(
          response.data as Map<String, dynamic>,
          (json) => AdWithDetails.fromJson(json),
        );
      }
      return PaginatedResponse.failure(
        response.data['error'] ?? 'Failed to fetch your ads',
      );
    } on DioException catch (e) {
      return PaginatedResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch your ads',
      );
    }
  }

  // ==========================================
  // CREATE/UPDATE/DELETE ADS
  // ==========================================

  /// Get edit context for an ad (owner-only). Tells whether editing will
  /// send the ad back to pending review or publish instantly.
  Future<ApiResponse<AdEditContext>> getEditContext(int adId) async {
    try {
      final response = await _dio.get('/ads/$adId/edit-context');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          AdEditContext.fromMap(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(
        response.data['error'] ?? 'Failed to load edit info',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to load edit info',
      );
    }
  }

  /// Create a new ad
  Future<AdSubmitResult> createAd(
    FormData formData, {
    void Function(int sent, int total)? onSendProgress,
  }) async {
    try {
      final response = await _dio.post(
        '/ads',
        data: formData,
        onSendProgress: onSendProgress,
      );
      if (kDebugMode)
        developer.log('createAd response: ${response.data}', name: 'AdClient');

      if (response.data['success'] == true) {
        return AdSubmitResult.success(
          Ad.fromJson(response.data['data'] as Map<String, dynamic>),
          resultingStatus: response.data['resultingStatus'] as String?,
        );
      }
      return AdSubmitResult.failure(
        response.data['error'] is String
            ? response.data['error']
            : apiMessage(response.data) ?? 'Failed to create ad',
      );
    } on DioException catch (e) {
      final errorData = e.response?.data;
      String errorMessage = 'Failed to create ad';

      if (errorData != null) {
        if (errorData['message'] is String) {
          errorMessage = errorData['message'];
        } else if (errorData['error'] is String) {
          errorMessage = errorData['error'];
        } else if (errorData['error'] is Map &&
            errorData['error']['message'] is String) {
          errorMessage = errorData['error']['message'];
        }
      }

      return AdSubmitResult.failure(errorMessage);
    }
  }

  /// Update an existing ad
  Future<AdSubmitResult> updateAd(
    int adId,
    FormData formData, {
    void Function(int sent, int total)? onSendProgress,
  }) async {
    try {
      final response = await _dio.put(
        '/ads/$adId',
        data: formData,
        onSendProgress: onSendProgress,
      );

      if (response.data['success'] == true) {
        return AdSubmitResult.success(
          Ad.fromJson(response.data['data'] as Map<String, dynamic>),
          resultingStatus: response.data['resultingStatus'] as String?,
        );
      }
      return AdSubmitResult.failure(
        response.data['error'] ?? 'Failed to update ad',
      );
    } on DioException catch (e) {
      return AdSubmitResult.failure(
        e.response?.data?['error'] ?? 'Failed to update ad',
      );
    }
  }

  /// Delete an ad
  Future<ApiResponse<void>> deleteAd(int adId) async {
    try {
      final response = await _dio.delete('/ads/$adId');

      if (response.data['success'] == true) {
        return ApiResponse.success(null);
      }
      return ApiResponse.failure(
        response.data['error'] ?? 'Failed to delete ad',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to delete ad',
      );
    }
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  /// Get all categories with subcategories
  Future<List<CategoryWithSubcategories>> getCategories() async {
    try {
      final response = await _dio.get('/categories?includeSubcategories=true');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map(
              (e) =>
                  CategoryWithSubcategories.fromJson(e as Map<String, dynamic>),
            )
            .toList();
      }
      return [];
    } on DioException catch (e) {
      if (kDebugMode)
        developer.log('Error fetching categories: $e', name: 'AdClient');
      return [];
    }
  }

  /// Background-stage one ad photo the moment it is picked, so posting later
  /// only sends ids (instant). Returns the stagedId, or null on any error —
  /// the caller then falls back to the classic full upload (fail-open).
  Future<String?> stageAdImage(String imagePath) async {
    try {
      final formData = FormData();
      formData.files.add(
        MapEntry(
          'image',
          await MultipartFile.fromFile(
            imagePath,
            filename: imagePath.split('/').last,
          ),
        ),
      );
      final response = await _dio.post('/ads/stage-image', data: formData);
      final body = response.data;
      if (body is Map<String, dynamic> && body['success'] == true) {
        final data = body['data'];
        if (data is Map<String, dynamic>) return data['stagedId'] as String?;
      }
      return null;
    } catch (e) {
      developer.log('Image staging unavailable: $e', name: 'AdClient');
      return null;
    }
  }

  /// AI autofill: draft a listing from up to 3 photos (paths of picked images).
  /// draft is null when the feature is off/unavailable or on any error —
  /// callers simply show no suggestions (fail-open). [rateLimited] separates
  /// "our hourly AI quota is used up" from photo problems, so the UI never
  /// blames the seller's photos for a 429.
  Future<({AiDraft? draft, bool rateLimited})> getAiDraft(
    List<String> imagePaths,
  ) async {
    try {
      final formData = FormData();
      for (final path in imagePaths.take(3)) {
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(path, filename: path.split('/').last),
          ),
        );
      }
      final response = await _dio.post('/ads/ai-draft', data: formData);
      final body = response.data;
      if (body is Map<String, dynamic> && body['success'] == true) {
        final draft = body['data'];
        if (draft is Map<String, dynamic>) {
          return (draft: AiDraft.fromMap(draft), rateLimited: false);
        }
      }
      return (draft: null, rateLimited: false);
    } on DioException catch (e) {
      developer.log('AI draft unavailable: $e', name: 'AdClient');
      return (draft: null, rateLimited: e.response?.statusCode == 429);
    } catch (e) {
      developer.log('AI draft unavailable: $e', name: 'AdClient');
      return (draft: null, rateLimited: false);
    }
  }

  /// Pre-post AI check on manually-typed fields: returns warning codes
  /// ('category_mismatch' | 'spelling'). Advisory only — any failure returns
  /// an empty list and posting proceeds exactly as today.
  Future<List<String>> precheckAd({
    required String title,
    String? description,
    String? categoryName,
    double? price,
  }) async {
    try {
      final response = await _dio.post(
        '/ads/ai-precheck',
        data: {
          'title': title,
          'description': description,
          'categoryName': categoryName,
          'price': price,
        },
        options: Options(
          sendTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );
      final body = response.data;
      if (body is Map<String, dynamic> && body['success'] == true) {
        final warnings = body['data']?['warnings'];
        if (warnings is List) {
          return warnings
              .whereType<Map<String, dynamic>>()
              .map((w) => w['code'])
              .whereType<String>()
              .toList();
        }
      }
      return const [];
    } catch (e) {
      developer.log('AI precheck unavailable: $e', name: 'AdClient');
      return const [];
    }
  }

  /// Get category by slug
  Future<ApiResponse<CategoryWithSubcategories>> getCategoryBySlug(
    String slug,
  ) async {
    try {
      final response = await _dio.get('/categories/slug/$slug');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          CategoryWithSubcategories.fromJson(
            response.data['data'] as Map<String, dynamic>,
          ),
        );
      }
      return ApiResponse.failure(
        response.data['error'] ?? 'Category not found',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch category',
      );
    }
  }

  // ==========================================
  // LOCATIONS
  // ==========================================

  /// Get full location hierarchy
  Future<List<LocationProvince>> getLocationHierarchy() async {
    try {
      final response = await _dio.get('/locations/hierarchy');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => LocationProvince.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      if (kDebugMode)
        developer.log(
          'Error fetching location hierarchy: $e',
          name: 'AdClient',
        );
      return [];
    }
  }

  // ==========================================
  // REPORT AD
  // ==========================================

  /// Report an ad (requires auth)
  Future<Map<String, dynamic>> reportAd(
    int adId,
    String reason, {
    String? details,
  }) async {
    try {
      final response = await _dio.post(
        '/reports',
        data: {
          'adId': adId,
          'reason': reason,
          if (details != null && details.isNotEmpty) 'details': details,
        },
      );
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        return e.response!.data as Map<String, dynamic>;
      }
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  // ==========================================
  // RELATED ADS
  // ==========================================

  /// Get related ads (same category)
  Future<List<AdWithDetails>> getRelatedAds(
    int categoryId, {
    int limit = 3,
    int? excludeAdId,
  }) async {
    try {
      final response = await getAds(
        categoryId: categoryId,
        limit: limit + 1, // Get extra in case we need to exclude
        sortBy: 'date',
        sortOrder: 'desc',
      );

      if (response.success) {
        var ads = response.data;
        if (excludeAdId != null) {
          ads = ads.where((ad) => ad.id != excludeAdId).toList();
        }
        return ads.take(limit).toList();
      }
      return [];
    } catch (e) {
      if (kDebugMode)
        developer.log('Error fetching related ads: $e', name: 'AdClient');
      return [];
    }
  }

  // ==========================================
  // AD LIMITS
  // ==========================================

  /// Fetch ad limits from server (image limits, max ads, etc.)
  Future<AdLimitsResponse> getAdLimits() async {
    try {
      final response = await _dio.get('/ad-limits');
      if (response.data['success'] == true) {
        return AdLimitsResponse.fromMap(
          response.data['data'] as Map<String, dynamic>,
        );
      }
      return const AdLimitsResponse();
    } catch (e) {
      if (kDebugMode) {
        developer.log('Error fetching ad limits: $e', name: 'AdClient');
      }
      return const AdLimitsResponse();
    }
  }
}

/// Edit context for an ad, from GET /ads/:id/edit-context.
/// [status] is the raw DB status ('approved' | 'pending' | ...).
class AdEditContext {
  final String status;
  final bool canDirectPublish;
  final bool willGoToPending;

  /// The AI held this ad for a human check. The raw AI sentence stays
  /// editor-only; [aiReasonCode] is the seller-safe category, and it is null
  /// when the AI was unreachable — which must never be read as the seller's
  /// fault.
  final bool aiHeld;
  final String? aiReasonCode;

  /// Real category the AI suggests, already validated server-side against the
  /// category tree — safe to show verbatim.
  final String? aiSuggestedCategory;

  const AdEditContext({
    required this.status,
    required this.canDirectPublish,
    required this.willGoToPending,
    this.aiHeld = false,
    this.aiReasonCode,
    this.aiSuggestedCategory,
  });

  factory AdEditContext.fromMap(Map<String, dynamic> map) {
    return AdEditContext(
      status: map['status'] as String? ?? '',
      canDirectPublish: map['canDirectPublish'] == true,
      willGoToPending: map['willGoToPending'] == true,
      aiHeld: map['aiHeld'] == true,
      aiReasonCode: map['aiReasonCode'] as String?,
      aiSuggestedCategory: map['aiSuggestedCategory'] as String?,
    );
  }
}

/// Result of creating/updating an ad. [resultingStatus] is the raw DB status
/// ('approved' | 'pending') the ad ended up in — 'approved' means it is live.
class AdSubmitResult {
  final bool success;
  final Ad? data;
  final String? error;
  final String? resultingStatus;

  const AdSubmitResult({
    required this.success,
    this.data,
    this.error,
    this.resultingStatus,
  });

  factory AdSubmitResult.success(Ad data, {String? resultingStatus}) {
    return AdSubmitResult(
      success: true,
      data: data,
      resultingStatus: resultingStatus,
    );
  }

  factory AdSubmitResult.failure(String error) {
    return AdSubmitResult(success: false, error: error);
  }

  /// True when the ad is live after this submit (verified business user).
  bool get isLive => resultingStatus == 'approved';

  String get errorMessage => error ?? 'Unknown error';
}

/// Ad limits response from server
class AdLimitsResponse {
  final int maxAdsPerUser;
  final int adExpiryDays;
  final int freeAdsLimit;
  final int maxImagesPerAd;
  final int maxImagesVerified;
  final int maxImagesUnverified;
  final int? userImageLimit;

  const AdLimitsResponse({
    this.maxAdsPerUser = 50,
    this.adExpiryDays = 0,
    this.freeAdsLimit = 30,
    this.maxImagesPerAd = 10,
    this.maxImagesVerified = 10,
    this.maxImagesUnverified = 5,
    this.userImageLimit,
  });

  /// The effective image limit for the current user
  int get effectiveImageLimit => userImageLimit ?? maxImagesUnverified;

  factory AdLimitsResponse.fromMap(Map<String, dynamic> map) {
    return AdLimitsResponse(
      maxAdsPerUser: (map['maxAdsPerUser'] as num?)?.toInt() ?? 50,
      adExpiryDays: (map['adExpiryDays'] as num?)?.toInt() ?? 0,
      freeAdsLimit: (map['freeAdsLimit'] as num?)?.toInt() ?? 30,
      maxImagesPerAd: (map['maxImagesPerAd'] as num?)?.toInt() ?? 10,
      maxImagesVerified: (map['maxImagesVerified'] as num?)?.toInt() ?? 10,
      maxImagesUnverified: (map['maxImagesUnverified'] as num?)?.toInt() ?? 5,
      userImageLimit: (map['userImageLimit'] as num?)?.toInt(),
    );
  }
}
