import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/models/api_response.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/widgets/app_cached_image.dart';

/// The API rejects support photos above this size.
const kMaxSupportPhotoBytes = 5 * 1024 * 1024;

/// Snackbar text for a failed photo send: the rate limit gets its own wording,
/// everything else one generic retry line (never the raw server message).
String supportPhotoFailureText(ApiResponse<Object?> response) {
  if (response.code == SupportClient.imageLimitCode) {
    return 'support.imageLimitReached'.tr();
  }
  return 'support.imageUploadFailed'.tr();
}

/// Support attachment URLs arrive relative (`/uploads/messages/...`); the
/// image lives on the API host, one level above the `/api` prefix.
String supportImageUrl(String url) {
  if (url.startsWith('http')) return url;
  return '${ApiConfig.baseUrl.replaceFirst(RegExp(r'/api$'), '')}$url';
}

/// The photo (and optional caption) inside a support message bubble. The
/// bubble itself — colours, radii, sender line, timestamp — stays with the
/// screen; this only fills the content slot.
class SupportPhotoBubble extends StatelessWidget {
  final String url;
  final String caption;
  final bool isOwn;

  const SupportPhotoBubble({
    super.key,
    required this.url,
    required this.caption,
    required this.isOwn,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: isOwn
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      children: [
        Semantics(
          label: 'support.photo'.tr(),
          button: true,
          child: GestureDetector(
            onTap: () => showSupportPhoto(context, url),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AppCachedImage(
                imageUrl: supportImageUrl(url),
                width: 220,
                fit: BoxFit.cover,
                memCacheWidth: 440,
                placeholder: Container(
                  width: 220,
                  height: 160,
                  color: Colors.grey[300],
                ),
                errorWidget: Container(
                  width: 220,
                  height: 160,
                  color: Colors.grey[300],
                  child: const Icon(
                    LucideIcons.imageOff,
                    size: 32,
                    color: Colors.grey,
                  ),
                ),
              ),
            ),
          ),
        ),
        if (caption.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            caption,
            style: AppFont.inter(
              fontSize: 14,
              height: 1.4,
              color: isOwn ? Colors.white : const Color(0xFF1F2937),
            ),
          ),
        ],
      ],
    );
  }
}

/// Full-screen, pinch-to-zoom view of one support photo.
void showSupportPhoto(BuildContext context, String url) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: Center(
          child: InteractiveViewer(
            child: AppCachedImage(
              imageUrl: supportImageUrl(url),
              fit: BoxFit.contain,
            ),
          ),
        ),
      ),
    ),
  );
}

/// The strip above the input once a photo is picked: thumbnail, status text,
/// and cancel/send — or a spinner while the photo is on its way.
class PendingPhotoBar extends StatelessWidget {
  final File file;
  final bool isUploading;
  final VoidCallback onCancel;
  final VoidCallback onSend;

  const PendingPhotoBar({
    super.key,
    required this.file,
    required this.isUploading,
    required this.onCancel,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        border: Border(top: BorderSide(color: Colors.grey[300]!)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.file(file, width: 60, height: 60, fit: BoxFit.cover),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              (isUploading ? 'support.sendingPhoto' : 'support.photoReady')
                  .tr(),
              style: AppFont.inter(fontSize: 14, color: Colors.grey[700]),
            ),
          ),
          if (isUploading)
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else ...[
            IconButton(
              tooltip: 'common.cancel'.tr(),
              icon: const Icon(LucideIcons.x, color: Colors.grey),
              onPressed: onCancel,
            ),
            IconButton(
              tooltip: 'support.photoReady'.tr(),
              icon: const Icon(LucideIcons.send, color: Color(0xFFE11D48)),
              onPressed: onSend,
            ),
          ],
        ],
      ),
    );
  }
}
