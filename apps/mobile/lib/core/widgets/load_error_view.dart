import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_theme.dart';

/// Full-screen friendly state shown when a screen fails to load its data
/// (no internet or server unreachable), with a Retry action.
///
/// Reusable across screens — pass [isOffline] to tailor the icon and copy.
class LoadErrorView extends StatelessWidget {
  final bool isOffline;
  final VoidCallback onRetry;

  const LoadErrorView({
    super.key,
    required this.isOffline,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final title = isOffline ? 'common.offlineTitle' : 'common.loadErrorTitle';
    final subtitle = isOffline
        ? 'common.offlineSubtitle'
        : 'common.loadErrorSubtitle';
    final icon = isOffline ? LucideIcons.wifiOff : LucideIcons.cloudOff;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: Colors.grey[400]),
            ),
            const SizedBox(height: 20),
            Text(
              title.tr(),
              textAlign: TextAlign.center,
              style: AppFont.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle.tr(),
              textAlign: TextAlign.center,
              style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(LucideIcons.refreshCw, size: 18),
              label: Text('common.retry'.tr()),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
