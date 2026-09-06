import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/features/verification/verification_screen.dart';

/// The ad-cap refusal gets localized copy and, for unverified sellers, a
/// tap-through to verification. Every other failure shows the server text.
void showAdSubmitFailure(BuildContext context, AdSubmitResult result) {
  if (result.errorCode != adLimitReachedCode) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(result.errorMessage)));
    return;
  }
  final details = result.errorDetails ?? const <String, dynamic>{};
  final verified = details['verified'] == true;
  final args = {
    'limit': '${details['limit'] ?? ''}',
    'verifiedLimit': '${details['verifiedLimit'] ?? ''}',
  };
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      duration: const Duration(seconds: 8),
      content: Text(
        (verified ? 'postAd.adLimitVerified' : 'postAd.adLimitUnverified').tr(
          namedArgs: args,
        ),
      ),
      action: verified
          ? null
          : SnackBarAction(
              label: 'postAd.adLimitCta'.tr(),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const VerificationScreen()),
              ),
            ),
    ),
  );
}
