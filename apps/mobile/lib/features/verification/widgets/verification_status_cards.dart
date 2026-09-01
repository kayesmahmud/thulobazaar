import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/models/verification.dart';

class VerificationStatusCard extends StatelessWidget {
  final String type;
  final String title;
  final String subtitle;
  final IconData icon;
  final VerificationStatusData? statusData;
  final bool isSelected;
  final VoidCallback onTap;

  const VerificationStatusCard({
    super.key,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.statusData,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isVerified = statusData?.verified == true;
    final isPending = statusData?.statusType == VerificationStatusType.pending;
    final isRejected =
        statusData?.statusType == VerificationStatusType.rejected;

    Color cardColor = Colors.white;
    Color borderColor = isSelected
        ? const Color(0xFF6366F1)
        : Colors.grey[200]!;
    Color iconBgColor = const Color(0xFFEEF2FF);
    Color iconColor = const Color(0xFF6366F1);

    if (isVerified) {
      iconBgColor = const Color(0xFFD1FAE5);
      iconColor = const Color(0xFF10B981);
    } else if (isPending) {
      iconBgColor = const Color(0xFFFEF3C7);
      iconColor = const Color(0xFFF59E0B);
    } else if (isRejected) {
      iconBgColor = const Color(0xFFFEE2E2);
      iconColor = const Color(0xFFEF4444);
    }

    return GestureDetector(
      onTap: isVerified || isPending ? null : onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: iconColor, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppFont.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[800],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: AppFont.inter(
                          fontSize: 13,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ),
                // Status badge
                VerificationStatusBadge(statusData: statusData),
              ],
            ),
            // Show rejection reason
            if (isRejected && statusData?.request?.rejectionReason != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      LucideIcons.info,
                      color: Color(0xFFEF4444),
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        statusData!.request!.rejectionReason!,
                        style: AppFont.inter(
                          fontSize: 12,
                          color: const Color(0xFFEF4444),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onTap,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    'Resubmit Application',
                    style: AppFont.inter(
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
            // Show expiry warning
            if (isVerified && statusData?.isExpiringSoon == true) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      LucideIcons.alertTriangle,
                      color: Color(0xFFF59E0B),
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Expires in ${statusData?.daysRemaining} days',
                      style: AppFont.inter(
                        fontSize: 12,
                        color: const Color(0xFFD97706),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class VerificationStatusBadge extends StatelessWidget {
  final VerificationStatusData? statusData;

  const VerificationStatusBadge({super.key, required this.statusData});

  @override
  Widget build(BuildContext context) {
    if (statusData == null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          'Not Verified',
          style: AppFont.inter(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
      );
    }

    final status = statusData!.statusType;
    Color bgColor;
    Color textColor;
    String text;
    IconData? iconData;

    switch (status) {
      case VerificationStatusType.verified:
        bgColor = const Color(0xFFD1FAE5);
        textColor = const Color(0xFF10B981);
        text = 'Verified';
        iconData = LucideIcons.checkCircle;
        break;
      case VerificationStatusType.pending:
        bgColor = const Color(0xFFFEF3C7);
        textColor = const Color(0xFFF59E0B);
        text = 'Pending';
        iconData = LucideIcons.hourglass;
        break;
      case VerificationStatusType.rejected:
        bgColor = const Color(0xFFFEE2E2);
        textColor = const Color(0xFFEF4444);
        text = 'Rejected';
        iconData = LucideIcons.xCircle;
        break;
      default:
        bgColor = Colors.grey[100]!;
        textColor = Colors.grey[600]!;
        text = 'Not Verified';
        iconData = null;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (iconData != null) ...[
            Icon(iconData, size: 14, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: AppFont.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
