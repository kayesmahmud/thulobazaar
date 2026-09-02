import 'package:dio/dio.dart';
import 'api_error.dart';
import '../models/models.dart';
import '../models/promotion.dart';
import 'dio_client.dart';

/// Promotion API Client - handles promotion-related API calls
class PromotionClient {
  final Dio _dio;

  PromotionClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

  // ==========================================
  // GET PRICING
  // ==========================================

  /// Get promotion pricing for an ad
  ///
  /// Parameters:
  /// - adId: Optional ad ID to get category-specific pricing
  /// - tier: Optional pricing tier override
  Future<ApiResponse<PricingResponse>> getPricing({
    int? adId,
    String? tier,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (adId != null) queryParams['adId'] = adId;
      if (tier != null) queryParams['tier'] = tier;

      final response = await _dio.get(
        '/promotion-pricing',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(
          PricingResponse.fromJson(
            response.data['data'] as Map<String, dynamic>,
          ),
        );
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to fetch pricing',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to fetch promotion pricing',
      );
    }
  }

  // ==========================================
  // CALCULATE PRICE
  // ==========================================

  /// Calculate final price for a specific promotion
  ///
  /// Parameters:
  /// - promotionType: Type of promotion (featured, urgent, sticky)
  /// - durationDays: Duration in days (3, 7, 15)
  /// - adId: Ad ID for category-specific pricing
  Future<ApiResponse<CalculatedPrice>> calculatePrice({
    required PromotionTypeEnum promotionType,
    required int durationDays,
    required int adId,
  }) async {
    try {
      final response = await _dio.get(
        '/promotion-pricing/calculate',
        queryParameters: {
          'promotionType': promotionType.apiValue,
          'durationDays': durationDays,
          'adId': adId,
        },
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(
          CalculatedPrice.fromJson(
            response.data['data'] as Map<String, dynamic>,
          ),
        );
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to calculate price',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to calculate promotion price',
      );
    }
  }

  // ==========================================
  // USER'S PROMOTIONS
  // ==========================================

  /// Get user's promotion history
  Future<PaginatedResponse<AdPromotion>> getPromotions({
    int page = 1,
    int limit = 20,
    bool? activeOnly,
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': limit};
      if (activeOnly != null) queryParams['active'] = activeOnly;

      final response = await _dio.get(
        '/promotions',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final pagination = response.data['pagination'] as Map<String, dynamic>?;

        return PaginatedResponse.success(
          data
              .map((e) => AdPromotion.fromJson(e as Map<String, dynamic>))
              .toList(),
          pagination != null
              ? PaginationInfo(
                  page: pagination['page'] as int? ?? page,
                  limit: pagination['limit'] as int? ?? limit,
                  total: pagination['total'] as int? ?? data.length,
                  totalPages: pagination['totalPages'] as int? ?? 1,
                )
              : PaginationInfo(
                  page: 1,
                  limit: data.length,
                  total: data.length,
                  totalPages: 1,
                ),
        );
      }
      return PaginatedResponse.failure(
        apiMessage(response.data) ?? 'Failed to fetch promotions',
      );
    } on DioException catch (e) {
      return PaginatedResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to fetch promotions',
      );
    }
  }

  // ==========================================
  // GET AD ACTIVE PROMOTION
  // ==========================================

  /// Get active promotion for a specific ad
  Future<ApiResponse<AdPromotion?>> getAdActivePromotion(int adId) async {
    try {
      final response = await _dio.get('/promotions/ad/$adId');

      if (response.data['success'] == true) {
        final data = response.data['data'];
        if (data != null) {
          return ApiResponse.success(
            AdPromotion.fromJson(data as Map<String, dynamic>),
          );
        }
        return ApiResponse.success(null);
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to fetch ad promotion',
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return ApiResponse.success(null); // No active promotion
      }
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to fetch ad promotion',
      );
    }
  }

  // ==========================================
  // APPLY PROMOTION (DIRECT)
  // ==========================================

  /// Apply promotion directly (for free promotions or after payment)
  Future<ApiResponse<AdPromotion>> applyPromotion({
    required int adId,
    required PromotionTypeEnum promotionType,
    required int durationDays,
    String? paymentReference,
  }) async {
    try {
      final response = await _dio.post(
        '/promotions',
        data: {
          'adId': adId,
          'promotionType': promotionType.apiValue,
          'durationDays': durationDays,
          'paymentReference': paymentReference,
        },
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(
          AdPromotion.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to apply promotion',
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return ApiResponse.failure('Authentication required');
      }
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to apply promotion',
      );
    }
  }

  // ==========================================
  // ACTIVE CAMPAIGNS
  // ==========================================

  /// Get best active promotion campaign (highest discount)
  Future<ApiResponse<PromotionCampaign?>> getActiveCampaign({
    String? tier,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (tier != null) queryParams['tier'] = tier;

      final response = await _dio.get(
        '/promotion-pricing/active-campaigns',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        final bestCampaign = data['bestCampaign'];
        if (bestCampaign != null) {
          return ApiResponse.success(
            PromotionCampaign.fromJson(bestCampaign as Map<String, dynamic>),
          );
        }
        return ApiResponse.success(null);
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to fetch campaigns',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to fetch active campaigns',
      );
    }
  }
}
