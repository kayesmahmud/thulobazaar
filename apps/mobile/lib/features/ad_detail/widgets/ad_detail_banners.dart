import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';

class SafetyTipsCard extends StatelessWidget {
  const SafetyTipsCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isNe = context.locale.languageCode == 'ne';
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFEDD5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isNe ? 'सुरक्षा सुझावहरू' : "Safety Tips",
            style: AppFont.inter(
              color: const Color(0xFFC2410C),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          _buildBullet(
            isNe
                ? 'सार्वजनिक सुरक्षित ठाउँमा भेट्नुहोस्'
                : "Meet in a safe public place",
          ),
          _buildBullet(
            isNe
                ? 'भुक्तानी गर्नुअघि सामान जाँच्नुहोस्'
                : "Inspect the item before payment",
          ),
          _buildBullet(
            isNe ? 'अग्रिम भुक्तानी नगर्नुहोस्' : "Never pay in advance",
          ),
        ],
      ),
    );
  }

  Widget _buildBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          const Icon(LucideIcons.circle, size: 6, color: Color(0xFFC2410C)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: AppFont.inter(
                fontSize: 12,
                color: const Color(0xFF9A3412),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
