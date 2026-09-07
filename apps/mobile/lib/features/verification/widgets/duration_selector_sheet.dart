import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/models/verification_models.dart';
import '../../../core/utils/localized_helpers.dart';

/// Bottom sheet for selecting verification duration/pricing.
/// Pricing is controlled via campaigns — a 100% discount campaign makes it free.
class DurationSelectorSheet extends StatefulWidget {
  final String verificationType; // 'individual' or 'business'
  final List<PricingOption> options;
  final FreeVerificationInfo
  freeVerification; // kept for API compat, not used in UI
  final VerificationCampaign? campaign;
  final void Function(PricingOption option, bool isFree) onProceed;

  const DurationSelectorSheet({
    Key? key,
    required this.verificationType,
    required this.options,
    required this.freeVerification,
    this.campaign,
    required this.onProceed,
  }) : super(key: key);

  @override
  State<DurationSelectorSheet> createState() => _DurationSelectorSheetState();
}

class _DurationSelectorSheetState extends State<DurationSelectorSheet> {
  PricingOption? _selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        context.locale.languageCode == 'ne'
                            ? 'अवधि छान्नुहोस्'
                            : 'Select Duration',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[900],
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),

                // Campaign discount banner
                if (widget.campaign != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.purple.shade400,
                          Colors.indigo.shade400,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Text(
                          widget.campaign!.bannerEmoji ?? '🎉',
                          style: const TextStyle(fontSize: 24),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${widget.campaign!.name} — ${widget.campaign!.discountPercentage.toInt()}% OFF',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                context.locale.languageCode == 'ne'
                                    ? '${widget.campaign!.daysRemaining} दिन बाँकी'
                                    : '${widget.campaign!.daysRemaining} days left',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 16),

                // Duration options grid
                GridView.builder(
                  shrinkWrap: true,
                  padding: EdgeInsets.zero,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.2,
                  ),
                  itemCount: widget.options.length,
                  itemBuilder: (context, index) {
                    final option = widget.options[index];
                    final isSelected = _selected?.id == option.id;

                    return _DurationOptionCard(
                      option: option,
                      isSelected: isSelected,
                      hasCampaign: option.hasCampaignDiscount,
                      onTap: () => setState(() => _selected = option),
                    );
                  },
                ),

                // Selected summary & proceed
                if (_selected != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.indigo.shade50, Colors.purple.shade50],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                context.locale.languageCode == 'ne'
                                    ? 'छानिएको योजना:'
                                    : 'Selected Plan:',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${widget.verificationType == 'individual' ? (context.locale.languageCode == 'ne' ? 'व्यक्तिगत' : 'Individual') : (context.locale.languageCode == 'ne' ? 'व्यापार' : 'Business')} — ${_selected!.durationLabel}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                _selected!.finalPrice <= 0
                                    ? (context.locale.languageCode == 'ne'
                                          ? 'निःशुल्क'
                                          : 'FREE')
                                    : formatLocalizedPrice(
                                        _selected!.finalPrice,
                                        context.locale.languageCode,
                                      ),
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: _selected!.finalPrice <= 0
                                      ? Colors.green
                                      : Colors.indigo,
                                ),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            widget.onProceed(
                              _selected!,
                              _selected!.finalPrice <= 0,
                            );
                          },
                          icon: const Icon(LucideIcons.arrowRight, size: 18),
                          label: Text(
                            l('proceed', context.locale.languageCode),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.indigo,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 14,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}

class _DurationOptionCard extends StatelessWidget {
  final PricingOption option;
  final bool isSelected;
  final bool hasCampaign;
  final VoidCallback onTap;

  const _DurationOptionCard({
    required this.option,
    required this.isSelected,
    required this.hasCampaign,
    required this.onTap,
  });

  bool get _isFree => option.finalPrice <= 0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: isSelected
              ? LinearGradient(
                  colors: [Colors.indigo.shade500, Colors.purple.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: isSelected
              ? null
              : hasCampaign
              ? Colors.purple.shade50
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : hasCampaign
                ? Colors.purple.shade300
                : Colors.grey.shade200,
            width: 2,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.indigo.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Stack(
          children: [
            // Badges
            if (_isFree)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.green.shade400, Colors.green.shade600],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne' ? 'निःशुल्क' : 'FREE',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            if (hasCampaign && !_isFree)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.purple.shade400, Colors.indigo.shade600],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne' ? 'प्रोमो' : 'PROMO',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            if (option.durationDays == 180 && !hasCampaign && !_isFree)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.amber.shade400, Colors.orange.shade500],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne'
                        ? 'लोकप्रिय'
                        : 'POPULAR',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

            // Content
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    option.durationLabel,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: isSelected ? Colors.white : Colors.grey[900],
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (_isFree) ...[
                    Text(
                      context.locale.languageCode == 'ne' ? 'निःशुल्क' : 'FREE',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : Colors.green,
                      ),
                    ),
                    if (option.price > 0)
                      Text(
                        formatLocalizedPrice(
                          option.price,
                          context.locale.languageCode,
                        ),
                        style: TextStyle(
                          fontSize: 12,
                          decoration: TextDecoration.lineThrough,
                          color: isSelected
                              ? Colors.white60
                              : Colors.grey.shade400,
                        ),
                      ),
                  ] else ...[
                    if (option.discountPercentage > 0) ...[
                      Text(
                        formatLocalizedPrice(
                          option.finalPrice,
                          context.locale.languageCode,
                        ),
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : Colors.indigo,
                        ),
                      ),
                      Text(
                        formatLocalizedPrice(
                          option.price,
                          context.locale.languageCode,
                        ),
                        style: TextStyle(
                          fontSize: 12,
                          decoration: TextDecoration.lineThrough,
                          color: isSelected
                              ? Colors.white60
                              : Colors.grey.shade400,
                        ),
                      ),
                    ] else
                      Text(
                        formatLocalizedPrice(
                          option.price,
                          context.locale.languageCode,
                        ),
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : Colors.indigo,
                        ),
                      ),
                  ],
                  if (option.discountPercentage > 0 && !_isFree) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? Colors.white.withValues(alpha: 0.2)
                            : hasCampaign
                            ? Colors.purple.shade100
                            : Colors.green.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        context.locale.languageCode == 'ne'
                            ? '${option.discountPercentage.toInt()}% बचत'
                            : 'Save ${option.discountPercentage.toInt()}%',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : hasCampaign
                              ? Colors.purple.shade700
                              : Colors.green.shade700,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
