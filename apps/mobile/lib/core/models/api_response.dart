/// API Response models - mirrors @thulobazaar/types ApiResponse interfaces

/// Generic API Response wrapper
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  /// Machine-readable error code from the API body (e.g. a rate-limit code),
  /// so a screen can word the failure itself instead of echoing the server.
  final String? code;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.message,
    this.code,
  });

  /// Factory for successful response
  factory ApiResponse.success(T data) {
    return ApiResponse(success: true, data: data);
  }

  /// Factory for error response
  factory ApiResponse.failure(String error, [String? message]) {
    return ApiResponse(success: false, error: error, message: message);
  }

  /// Parse from JSON with a data parser function
  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) fromData,
  ) {
    if (json['success'] == true) {
      return ApiResponse(success: true, data: fromData(json['data']));
    }
    return ApiResponse(
      success: false,
      error: _extractError(json['error']),
      message: json['message'] as String?,
    );
  }

  /// Get error message (either error or message field)
  String get errorMessage => error ?? message ?? 'Unknown error';

  /// Check if response has data
  bool get hasData => success && data != null;
}

/// Pagination info
class PaginationInfo {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  PaginationInfo({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginationInfo.fromJson(Map<String, dynamic> json) {
    final limit = json['limit'] as int? ?? 20;
    final total = json['total'] as int? ?? 0;
    final offset = json['offset'] as int? ?? 0;
    // Backend returns offset-based pagination; compute page/totalPages
    final page =
        json['page'] as int? ?? (limit > 0 ? (offset ~/ limit) + 1 : 1);
    final totalPages =
        json['totalPages'] as int? ??
        json['total_pages'] as int? ??
        (limit > 0 ? (total + limit - 1) ~/ limit : 1);
    return PaginationInfo(
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
      'total': total,
      'totalPages': totalPages,
    };
  }

  /// Check if there are more pages
  bool get hasMore => page < totalPages;

  /// Check if this is the first page
  bool get isFirst => page <= 1;

  /// Check if this is the last page
  bool get isLast => page >= totalPages;
}

/// Paginated Response wrapper
class PaginatedResponse<T> {
  final bool success;
  final List<T> data;
  final PaginationInfo pagination;
  final String? error;

  PaginatedResponse({
    required this.success,
    required this.data,
    required this.pagination,
    this.error,
  });

  /// Factory for successful paginated response
  factory PaginatedResponse.success(List<T> data, PaginationInfo pagination) {
    return PaginatedResponse(success: true, data: data, pagination: pagination);
  }

  /// Factory for error response
  factory PaginatedResponse.failure(String error) {
    return PaginatedResponse(
      success: false,
      data: [],
      pagination: PaginationInfo(page: 1, limit: 20, total: 0, totalPages: 0),
      error: error,
    );
  }

  /// Parse from JSON with a data parser function
  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromData,
  ) {
    if (json['success'] == true) {
      final dataList = json['data'] as List? ?? [];
      return PaginatedResponse(
        success: true,
        data: dataList.map((e) => fromData(e as Map<String, dynamic>)).toList(),
        pagination: PaginationInfo.fromJson(
          json['pagination'] as Map<String, dynamic>? ?? {},
        ),
      );
    }
    return PaginatedResponse.failure(
      _extractError(json['error']) ?? 'Unknown error',
    );
  }

  /// Check if there are more pages to load
  bool get hasMore => pagination.hasMore;

  /// Check if the list is empty
  bool get isEmpty => data.isEmpty;

  /// Check if the list is not empty
  bool get isNotEmpty => data.isNotEmpty;

  /// Get error message
  String? get errorMessage => error;
}

/// Search Filters model
class SearchFilters {
  final String? query;
  final int? categoryId;
  final int? subcategoryId;
  final int? locationId;
  final int? areaId;
  final double? minPrice;
  final double? maxPrice;
  final bool? isNegotiable;
  final String? sortBy; // 'date', 'price', 'views'
  final String? sortOrder; // 'asc', 'desc'
  final String? condition; // 'Brand New', 'Used'

  // Display names for UI (not sent to API)
  final String? categoryName;
  final String? locationName;

  SearchFilters({
    this.query,
    this.categoryId,
    this.subcategoryId,
    this.locationId,
    this.areaId,
    this.minPrice,
    this.maxPrice,
    this.isNegotiable,
    this.sortBy,
    this.sortOrder,
    this.condition,
    this.categoryName,
    this.locationName,
  });

  /// Convert to query parameters map
  Map<String, String> toQueryParams() {
    final params = <String, String>{};
    if (query != null && query!.isNotEmpty) params['search'] = query!;
    if (categoryId != null) params['category_id'] = categoryId.toString();
    if (subcategoryId != null)
      params['subcategory_id'] = subcategoryId.toString();
    if (locationId != null) params['location_id'] = locationId.toString();
    if (areaId != null) params['area_id'] = areaId.toString();
    if (minPrice != null) params['min_price'] = minPrice.toString();
    if (maxPrice != null) params['max_price'] = maxPrice.toString();
    if (isNegotiable != null) params['is_negotiable'] = isNegotiable.toString();
    if (sortBy != null) params['sort_by'] = sortBy!;
    if (sortOrder != null) params['sort_order'] = sortOrder!;
    if (condition != null) params['condition'] = condition!;
    return params;
  }

  /// Create a copy with updated values
  SearchFilters copyWith({
    String? query,
    int? categoryId,
    int? subcategoryId,
    int? locationId,
    int? areaId,
    double? minPrice,
    double? maxPrice,
    bool? isNegotiable,
    String? sortBy,
    String? sortOrder,
    String? condition,
    String? categoryName,
    String? locationName,
  }) {
    return SearchFilters(
      query: query ?? this.query,
      categoryId: categoryId ?? this.categoryId,
      subcategoryId: subcategoryId ?? this.subcategoryId,
      locationId: locationId ?? this.locationId,
      areaId: areaId ?? this.areaId,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      isNegotiable: isNegotiable ?? this.isNegotiable,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
      condition: condition ?? this.condition,
      categoryName: categoryName ?? this.categoryName,
      locationName: locationName ?? this.locationName,
    );
  }

  /// Check if any filters are applied
  bool get hasFilters {
    return query != null ||
        categoryId != null ||
        subcategoryId != null ||
        locationId != null ||
        areaId != null ||
        minPrice != null ||
        maxPrice != null ||
        isNegotiable != null ||
        condition != null;
  }

  /// Clear all filters
  SearchFilters clear() {
    return SearchFilters(sortBy: sortBy, sortOrder: sortOrder);
  }
}

/// Helper to extract error message from various API error formats.
/// The backend error handler may return error as a Map ({statusCode, name, ...})
/// or as a plain String.
String? _extractError(dynamic error) {
  if (error == null) return null;
  if (error is String) return error;
  if (error is Map) {
    // Try common error map shapes
    return error['message'] as String? ??
        error['name'] as String? ??
        error.toString();
  }
  return error.toString();
}
