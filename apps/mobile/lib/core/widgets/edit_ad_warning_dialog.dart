import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/models/models.dart';

/// Warning shown before editing a LIVE ad. Two variants:
/// - [willGoToPending] true: edit takes the ad offline for re-review.
/// - [willGoToPending] false: verified business, edit publishes instantly.
/// Returns true when the user confirms.
Future<bool?> showEditAdWarningDialog(
  BuildContext context, {
  required bool willGoToPending,
}) {
  final isNepali = context.locale.languageCode == 'ne';

  final title = willGoToPending
      ? (isNepali ? 'यो विज्ञापन सम्पादन गर्ने?' : 'Edit this ad?')
      : (isNepali
            ? 'तपाईंको सम्पादन तुरुन्तै लाइभ हुनेछ'
            : 'Your edit goes live instantly');

  final body = willGoToPending
      ? (isNepali
            ? 'सम्पादन गर्दा यो विज्ञापन अफलाइन हुनेछ र पुन: समीक्षाको लागि पठाइनेछ। हाम्रो टोलीले तपाईंको परिवर्तन स्वीकृत गरेपछि यो फेरि लाइभ हुनेछ।'
            : 'Editing will take this ad offline and send it back for review. It will go live again once our team approves your changes.')
      : (isNepali
            ? 'प्रमाणित व्यवसाय भएकाले तपाईंका परिवर्तनहरू समीक्षा बिना तुरुन्तै प्रकाशित हुन्छन्। कृपया सबै विवरण सही छ भनी सुनिश्चित गर्नुहोस् — बारम्बार भ्रामक सम्पादनले यो सुविधा हट्न सक्छ, र त्यसपछि तपाईंका सम्पादनहरू फेरि समीक्षामा जानेछन्।'
            : 'As a verified business, your changes publish immediately without review. Please make sure everything is accurate — repeated misleading edits can remove this privilege, and your future edits would then need review again.');

  final confirmLabel = willGoToPending
      ? (isNepali ? 'सम्पादन गर्नुहोस्' : 'Edit anyway')
      : (isNepali ? 'बुझें, सम्पादन गर्नुहोस्' : 'I understand, edit');

  return showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        title,
        style: AppFont.inter(fontWeight: FontWeight.bold, fontSize: 17),
      ),
      content: Text(body, style: AppFont.inter(fontSize: 14, height: 1.5)),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text('common.cancel'.tr()),
        ),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
}

/// Full pre-edit flow shared by My Ads, Dashboard and Ad Detail:
/// pending/rejected ads proceed directly; for a live ad the server edit
/// context is fetched and the matching warning dialog is shown. Falls back
/// to the re-review warning if the edit-context call fails.
/// Returns true when the edit form should open.
Future<bool> confirmAdEdit(
  BuildContext context, {
  required AdClient adClient,
  required AdWithDetails ad,
}) async {
  if (ad.status != AdStatus.active) return true;

  final response = await adClient.getEditContext(ad.id);
  if (!context.mounted) return false;

  final editContext = response.data;
  if (response.success && editContext != null) {
    // Server says the ad is not live (e.g. already pending): no warning needed.
    if (editContext.status != 'approved') return true;
    final confirmed = await showEditAdWarningDialog(
      context,
      willGoToPending: editContext.willGoToPending,
    );
    return confirmed == true;
  }

  // Safe default: warn that the edit sends the ad back to review.
  final confirmed = await showEditAdWarningDialog(
    context,
    willGoToPending: true,
  );
  return confirmed == true;
}
