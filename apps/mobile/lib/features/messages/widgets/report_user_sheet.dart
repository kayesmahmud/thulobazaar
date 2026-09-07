import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/api/message_client.dart';

class _UserReportReason {
  final String value;
  final String labelKey;
  final IconData icon;

  const _UserReportReason({
    required this.value,
    required this.labelKey,
    required this.icon,
  });
}

const _userReportReasons = [
  _UserReportReason(
    value: 'spam',
    labelKey: 'reportUser.spam',
    icon: LucideIcons.mail,
  ),
  _UserReportReason(
    value: 'scam',
    labelKey: 'reportUser.scam',
    icon: LucideIcons.alertTriangle,
  ),
  _UserReportReason(
    value: 'harassment',
    labelKey: 'reportUser.harassment',
    icon: LucideIcons.ban,
  ),
  _UserReportReason(
    value: 'inappropriate',
    labelKey: 'reportUser.inappropriate',
    icon: LucideIcons.eyeOff,
  ),
  _UserReportReason(
    value: 'impersonation',
    labelKey: 'reportUser.impersonation',
    icon: LucideIcons.userX,
  ),
  _UserReportReason(
    value: 'other',
    labelKey: 'reportUser.other',
    icon: LucideIcons.fileText,
  ),
];

/// Shows a bottom sheet to report a user. Returns true if a report was submitted.
Future<bool?> showReportUserSheet(
  BuildContext context, {
  required int reportedUserId,
  required String userName,
  int? conversationId,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _ReportUserSheet(
      reportedUserId: reportedUserId,
      userName: userName,
      conversationId: conversationId,
    ),
  );
}

class _ReportUserSheet extends StatefulWidget {
  final int reportedUserId;
  final String userName;
  final int? conversationId;

  const _ReportUserSheet({
    required this.reportedUserId,
    required this.userName,
    this.conversationId,
  });

  @override
  State<_ReportUserSheet> createState() => _ReportUserSheetState();
}

class _ReportUserSheetState extends State<_ReportUserSheet> {
  final _detailsController = TextEditingController();
  final _detailsFocus = FocusNode();
  final _scrollController = ScrollController();
  final _messageClient = MessageClient();

  String? _selectedReason;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _detailsFocus.addListener(_revealDetailsAndSubmit);
  }

  @override
  void dispose() {
    _detailsController.dispose();
    _detailsFocus.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// Once the keyboard has finished sliding in, scroll the sheet to the very
  /// bottom so the details box, the submit button and the note under it are
  /// all visible above the keyboard.
  void _revealDetailsAndSubmit() {
    if (!_detailsFocus.hasFocus) return;
    Future.delayed(const Duration(milliseconds: 350), () {
      if (!mounted || !_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _handleSubmit() async {
    if (_selectedReason == null) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      final result = await _messageClient.reportUser(
        reportedUserId: widget.reportedUserId,
        reason: _selectedReason!,
        details: _detailsController.text.trim(),
        conversationId: widget.conversationId,
      );

      if (!mounted) return;

      if (result.success) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('reportUser.success'.tr()),
            backgroundColor: AppTheme.success,
          ),
        );
      } else {
        // A SnackBar would render behind this modal sheet — show inline.
        setState(
          () => _errorMessage = result.error ?? 'reportUser.failed'.tr(),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = 'Error: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.sizeOf(context).height;
    final keyboardInset = MediaQuery.viewInsetsOf(context).bottom;
    final topPadding = MediaQuery.viewPaddingOf(context).top;
    // Same keyboard handling as the report-ad sheet: sit above the keyboard
    // and grow so the details field and submit button stay reachable.
    final maxHeight = keyboardInset > 0
        ? screenHeight - keyboardInset - topPadding - 16
        : screenHeight * 0.85;

    return AnimatedPadding(
      duration: const Duration(milliseconds: 150),
      curve: Curves.easeOut,
      padding: EdgeInsets.only(bottom: keyboardInset),
      child: Container(
        constraints: BoxConstraints(maxHeight: maxHeight),
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
                          'reportUser.title'.tr(),
                          style: AppFont.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          widget.userName,
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
            Flexible(
              child: SingleChildScrollView(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'reportUser.whyReporting'.tr(),
                      style: AppFont.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),

                    ..._userReportReasons.map(_buildReasonTile),

                    const SizedBox(height: 16),

                    Text(
                      'reportUser.additionalDetails'.tr(),
                      style: AppFont.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _detailsController,
                      focusNode: _detailsFocus,
                      maxLines: 3,
                      maxLength: 500,
                      decoration: InputDecoration(
                        hintText: 'reportUser.detailsHint'.tr(),
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
                    const SizedBox(height: 4),

                    if (_errorMessage != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              LucideIcons.alertCircle,
                              size: 18,
                              color: Color(0xFFEF4444),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: AppFont.inter(
                                  fontSize: 13,
                                  color: const Color(0xFFB91C1C),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

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
                                'reportUser.submit'.tr(),
                                style: AppFont.inter(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.only(top: 12, bottom: 8),
                      child: Text(
                        'reportUser.disclaimer'.tr(),
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
      ),
    );
  }

  Widget _buildReasonTile(_UserReportReason reason) {
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
}
