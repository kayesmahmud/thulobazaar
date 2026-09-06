import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/ad_client.dart';

/// Answers POST /ads with the API's ad-cap refusal.
class _AtCapAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    expect(options.path, endsWith('/ads'));
    return ResponseBody.fromString(
      jsonEncode({
        'success': false,
        'message':
            'You have reached the limit of 50 ads for unverified accounts. Get verified to post up to 1000 ads',
        'code': 'AD_LIMIT_REACHED',
        'details': {'limit': 50, 'verifiedLimit': 1000, 'verified': false},
      }),
      400,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  test('createAd surfaces the ad-cap code and details from a 400', () async {
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local/api'))
      ..httpClientAdapter = _AtCapAdapter();
    final result = await AdClient(dio: dio).createAd(FormData());

    expect(result.success, isFalse);
    expect(result.errorCode, adLimitReachedCode);
    expect(result.errorDetails?['limit'], 50);
    expect(result.errorDetails?['verifiedLimit'], 1000);
    expect(result.errorDetails?['verified'], false);
    expect(result.errorMessage, contains('Get verified'));
  });
}
