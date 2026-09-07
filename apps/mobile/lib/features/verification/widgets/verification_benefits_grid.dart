import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';

class VerificationBenefitsGrid extends StatelessWidget {
  const VerificationBenefitsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final benefits = [
      {
        'icon': LucideIcons.badgeCheck,
        'title': 'Verified Badge',
        'desc': 'Stand out from the crowd',
      },
      {
        'icon': LucideIcons.trendingUp,
        'title': 'More Visibility',
        'desc': 'Higher in search results',
      },
      {
        'icon': LucideIcons.shield,
        'title': 'Build Trust',
        'desc': 'Buyers trust verified sellers',
      },
      {
        'icon': LucideIcons.star,
        'title': 'Premium Support',
        'desc': 'Priority customer service',
      },
    ];

    return GridView.count(
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: benefits.map((benefit) {
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                benefit['icon'] as IconData,
                color: const Color(0xFF6366F1),
                size: 28,
              ),
              const SizedBox(height: 8),
              Text(
                benefit['title'] as String,
                style: AppFont.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                benefit['desc'] as String,
                style: AppFont.inter(fontSize: 11, color: Colors.grey[500]),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
