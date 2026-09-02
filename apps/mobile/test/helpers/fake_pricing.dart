import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/verification_client.dart';

/// Answers GET /verification/pricing the way the API does for a guest.
class _PricingAdapter implements HttpClientAdapter {
  final bool eligible;
  _PricingAdapter({required this.eligible});

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    expect(options.path, contains('/verification/pricing'));
    return ResponseBody.fromString(
      jsonEncode({
        'success': true,
        'data': {
          'individual': <Object>[],
          'business': <Object>[],
          'freeVerification': {
            'enabled': eligible,
            'durationDays': 180,
            'types': ['individual', 'business'],
            'isEligible': eligible,
          },
          'campaign': null,
        },
      }),
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

/// A VerificationClient whose only answer is the free-offer state.
VerificationClient fakePricingClient({required bool eligible}) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test.local/api'))
    ..httpClientAdapter = _PricingAdapter(eligible: eligible);
  return VerificationClient(dio: dio);
}
