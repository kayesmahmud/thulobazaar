import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/auth/signin_screen.dart';

class ReportReason {
  final String value;
  final String labelKey;
  final IconData icon;

  const ReportReason({
    required this.value,
    required this.labelKey,
    required this.icon,
  });
}

const _reportReasons = [
  ReportReason(value: 'spam', labelKey: 'report.spam', icon: LucideIcons.mail),
  ReportReason(
    value: 'fraud',
    labelKey: 'report.fraud',
    icon: LucideIcons.alertTriangle,
  ),
  ReportReason(
    value: 'inappropriate',
    labelKey: 'report.inappropriate',
    icon: LucideIcons.ban,
  ),
  ReportReason(
    value: 'duplicate',
    labelKey: 'report.duplicate',
    icon: LucideIcons.copy,
  ),
  ReportReason(
    value: 'misleading',
    labelKey: 'report.misleading',
    icon: LucideIcons.search,
  ),
  ReportReason(
    value: 'other',
    labelKey: 'report.other',
    icon: LucideIcons.fileText,
  ),
];

/// Shows a bottom sheet to report an ad. Returns true if report was submitted.
Future<bool?> showReportAdSheet(
  BuildContext context, {
  required int adId,
  required String adTitle,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _ReportAdSheet(adId: adId, adTitle: adTitle),
  );
}

class _ReportAdSheet extends StatefulWidget {
  final int adId;
  final String adTitle;

  const _ReportAdSheet({required this.adId, required this.adTitle});

  @override
  State<_ReportAdSheet> createState() => _ReportAdSheetState();
}

class _ReportAdSheetState extends State<_ReportAdSheet> {
  final _detailsController = TextEditingController();
  final _adClient = AdClient();

  String? _selectedReason;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (_selectedReason == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('report.selectReason'.tr())));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final result = await _adClient.reportAd(
        widget.adId,
        _selectedReason!,
        details: _detailsController.text.trim(),
      );

      if (!mounted) return;

      if (result['success'] == true) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('report.success'.tr()),
            backgroundColor: AppTheme.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'report.failed'.tr())),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = context.watch<AuthProvider>().isAuthenticated;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    LucideIcons.flag,
                    color: Color(0xFFEF4444),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'report.title'.tr(),
                        style: AppFont.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        widget.adTitle,
                        style: AppFont.inter(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.x, size: 20),
                ),
              ],
            ),
          ),

          // Content
          if (!isLoggedIn)
            _buildLoginRequired()
          else
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'report.whyReporting'.tr(),
                      style: AppFont.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Reason chips
                    ..._reportReasons.map((reason) => _buildReasonTile(reason)),

                    const SizedBox(height: 16),

                    // Details field
                    Text(
                      'report.additionalDetails'.tr(),
                      style: AppFont.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _detailsController,
                      maxLines: 3,
                      maxLength: 500,
                      decoration: InputDecoration(
                        hintText: 'report.detailsHint'.tr(),
                        hintStyle: AppFont.inter(
                          color: Colors.grey[400],
                          fontSize: 13,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.all(12),
                      ),
                      style: AppFont.inter(fontSize: 14),
                    ),
                    const SizedBox(height: 16),

                    // Submit button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSubmitting || _selectedReason == null
                            ? null
                            : _handleSubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEF4444),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                'report.submit'.tr(),
                                style: AppFont.inter(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),

                    // Disclaimer
                    Padding(
                      padding: const EdgeInsets.only(top: 12, bottom: 8),
                      child: Text(
                        'report.disclaimer'.tr(),
                        style: AppFont.inter(
                          fontSize: 11,
                          color: Colors.grey[400],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildReasonTile(ReportReason reason) {
    final isSelected = _selectedReason == reason.value;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => setState(() => _selectedReason = reason.value),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? const Color(0xFFEF4444) : Colors.grey[200]!,
              width: isSelected ? 2 : 1,
            ),
            color: isSelected ? const Color(0xFFFEF2F2) : Colors.white,
          ),
          child: Row(
            children: [
              Icon(
                reason.icon,
                size: 18,
                color: isSelected ? const Color(0xFFEF4444) : Colors.grey[500],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  reason.labelKey.tr(),
                  style: AppFont.inter(
                    fontSize: 14,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    color: isSelected
                        ? const Color(0xFFEF4444)
                        : Colors.grey[800],
                  ),
                ),
              ),
              if (isSelected)
                const Icon(
                  LucideIcons.checkCircle,
                  size: 18,
                  color: Color(0xFFEF4444),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoginRequired() {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Icon(LucideIcons.logIn, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'report.loginRequired'.tr(),
            style: AppFont.inter(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            'report.loginToReport'.tr(),
            style: AppFont.inter(fontSize: 14, color: Colors.grey[500]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SignInScreen()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'auth.signIn'.tr(),
              style: AppFont.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
