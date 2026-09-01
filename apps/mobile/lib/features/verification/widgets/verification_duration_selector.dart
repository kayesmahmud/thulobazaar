import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/models/verification.dart';

class VerificationDurationSelector extends StatelessWidget {
  final VerificationPricing? pricing;
  final String? selectedType;
  final PricingOption? selectedDuration;
  final bool isFreeVerification;
  final Function(PricingOption) onDurationSelect;
  final VoidCallback onFreeSelect;
  final VoidCallback onClearSelection;
  final VoidCallback onProceed;

  const VerificationDurationSelector({
    super.key,
    required this.pricing,
    required this.selectedType,
    required this.selectedDuration,
    required this.isFreeVerification,
    required this.onDurationSelect,
    required this.onFreeSelect,
    required this.onClearSelection,
    required this.onProceed,
  });

  @override
  Widget build(BuildContext context) {
    if (pricing == null || selectedType == null) return const SizedBox();

    final options = pricing!.getPricingForType(selectedType!);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Select Duration',
                  style: AppFont.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
              ),
              TextButton(
                onPressed: onClearSelection,
                child: Text(
                  'Cancel',
                  style: AppFont.inter(color: Colors.grey[500]),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Free verification option
          if (pricing!.freeVerification.isEligible &&
              pricing!.freeVerification.appliesToType(selectedType ?? ''))
            _buildFreeOption(),

          // Paid options
          if (!isFreeVerification) ...[
            ...options.map((option) => _buildDurationOption(option)),
          ],

          const SizedBox(height: 20),

          // Proceed button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (selectedDuration != null || isFreeVerification)
                  ? onProceed
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                disabledBackgroundColor: Colors.grey[300],
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                isFreeVerification
                    ? 'Continue with Free Verification'
                    : 'Continue',
                style: AppFont.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFreeOption() {
    final free = pricing!.freeVerification;

    return GestureDetector(
      onTap: onFreeSelect,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isFreeVerification ? const Color(0xFFD1FAE5) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isFreeVerification
                ? const Color(0xFF10B981)
                : Colors.grey[200]!,
            width: isFreeVerification ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                LucideIcons.partyPopper,
                color: Color(0xFF10B981),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${free.durationDays} Days - FREE',
                    style: AppFont.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'New user promotional offer',
                    style: AppFont.inter(fontSize: 12, color: Colors.grey[500]),
                  ),
                ],
              ),
            ),
            if (isFreeVerification)
              const Icon(
                LucideIcons.checkCircle,
                color: Color(0xFF10B981),
                size: 24,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDurationOption(PricingOption option) {
    final isSelected = selectedDuration?.id == option.id;

    return GestureDetector(
      onTap: () => onDurationSelect(option),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEEF2FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF6366F1) : Colors.grey[200]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.durationLabel,
                    style: AppFont.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[800],
                    ),
                  ),
                  if (option.hasCampaignDiscount) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          'Rs. ${option.price.toStringAsFixed(0)}',
                          style: AppFont.inter(
                            fontSize: 12,
                            decoration: TextDecoration.lineThrough,
                            color: Colors.grey[400],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${option.discountPercentage}% OFF',
                            style: AppFont.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFD97706),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            Text(
              'Rs. ${option.finalPrice.toStringAsFixed(0)}',
              style: AppFont.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF6366F1),
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              const Icon(
                LucideIcons.checkCircle,
                color: Color(0xFF6366F1),
                size: 24,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
