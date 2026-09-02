import 'package:dio/dio.dart';
import 'api_error.dart';
import '../models/models.dart';
import 'dio_client.dart';

/// Client for favorites/wishlist API
class FavoritesClient {
  final Dio _dio;

  FavoritesClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

  /// Get user's favorite ads
  Future<FavoritesResponse> getFavorites({int limit = 50, int page = 1}) async {
    try {
      final response = await _dio.get(
        '/favorites',
        queryParameters: {'limit': limit, 'page': page},
      );

      if (response.data['success'] == true) {
        final List<dynamic> favoritesJson = response.data['data'] ?? [];
        final favorites = favoritesJson
            .map((json) => FavoriteAd.fromJson(json))
            .toList();

        return FavoritesResponse(
          success: true,
          data: favorites,
          pagination: response.data['pagination'],
        );
      }

      return FavoritesResponse(
        success: false,
        error: apiMessage(response.data) ?? 'Failed to fetch favorites',
      );
    } on DioException catch (e) {
      return FavoritesResponse(
        success: false,
        error: apiMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return FavoritesResponse(success: false, error: e.toString());
    }
  }

  /// Add ad to favorites
  Future<ApiResult> addToFavorites(int adId) async {
    try {
      final response = await _dio.post('/favorites', data: {'adId': adId});

      return ApiResult(
        success: response.data['success'] == true,
        error: apiMessage(response.data),
      );
    } on DioException catch (e) {
      return ApiResult(
        success: false,
        error: apiMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return ApiResult(success: false, error: e.toString());
    }
  }

  /// Remove ad from favorites
  Future<ApiResult> removeFromFavorites(int adId) async {
    try {
      final response = await _dio.delete('/favorites/$adId');

      return ApiResult(
        success: response.data['success'] == true,
        error: apiMessage(response.data),
      );
    } on DioException catch (e) {
      return ApiResult(
        success: false,
        error: apiMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return ApiResult(success: false, error: e.toString());
    }
  }

  /// Check if ad is in favorites
  Future<IsFavoritedResponse> checkFavorite(int adId) async {
    try {
      final response = await _dio.get('/favorites/$adId');

      if (response.data['success'] == true) {
        return IsFavoritedResponse(
          success: true,
          isFavorited: response.data['data']?['isFavorited'] ?? false,
        );
      }

      return IsFavoritedResponse(success: false, isFavorited: false);
    } on DioException {
      return IsFavoritedResponse(success: false, isFavorited: false);
    } catch (e) {
      return IsFavoritedResponse(success: false, isFavorited: false);
    }
  }
}

/// Response wrapper for favorites list
class FavoritesResponse {
  final bool success;
  final List<FavoriteAd> data;
  final String? error;
  final Map<String, dynamic>? pagination;

  FavoritesResponse({
    required this.success,
    this.data = const [],
    this.error,
    this.pagination,
  });
}

/// Response wrapper for is favorited check
class IsFavoritedResponse {
  final bool success;
  final bool isFavorited;

  IsFavoritedResponse({required this.success, required this.isFavorited});
}

/// Simple result wrapper
class ApiResult {
  final bool success;
  final String? error;

  ApiResult({required this.success, this.error});
}

/// Model for favorite ad
class FavoriteAd {
  final int id;
  final int adId;
  final DateTime createdAt;
  final FavoriteAdDetails ad;

  FavoriteAd({
    required this.id,
    required this.adId,
    required this.createdAt,
    required this.ad,
  });

  factory FavoriteAd.fromJson(Map<String, dynamic> json) {
    return FavoriteAd(
      id: json['id'],
      adId: json['adId'],
      createdAt: DateTime.parse(json['createdAt']),
      ad: FavoriteAdDetails.fromJson(json['ad']),
    );
  }
}

/// Model for ad details in favorite
class FavoriteAdDetails {
  final int id;
  final String title;
  final String slug;
  final double? price;
  final String? primaryImage;
  final String? categoryName;
  final String? locationName;
  final String status;

  FavoriteAdDetails({
    required this.id,
    required this.title,
    required this.slug,
    this.price,
    this.primaryImage,
    this.categoryName,
    this.locationName,
    required this.status,
  });

  factory FavoriteAdDetails.fromJson(Map<String, dynamic> json) {
    return FavoriteAdDetails(
      id: json['id'],
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      price: json['price']?.toDouble(),
      primaryImage: json['primaryImage'],
      categoryName: json['category']?['name'],
      locationName: json['location']?['name'],
      status: json['status'] ?? 'active',
    );
  }
}
