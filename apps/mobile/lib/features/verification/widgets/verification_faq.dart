import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';

class VerificationFaqSection extends StatelessWidget {
  const VerificationFaqSection({super.key});

  @override
  Widget build(BuildContext context) {
    final faqs = [
      {
        'q': 'How long does verification take?',
        'a':
            'Verification is usually completed within 24-48 hours after submission.',
      },
      {
        'q': 'What documents do I need?',
        'a':
            'For individuals: Valid ID (citizenship, passport, or driving license) and a selfie. For businesses: Business registration/license document.',
      },
      {
        'q': 'Is verification refundable?',
        'a':
            'Verification fees are non-refundable once your application is approved.',
      },
    ];

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
          Text(
            'Frequently Asked Questions',
            style: AppFont.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 16),
          ...faqs.map((faq) => _buildFaqItem(faq['q']!, faq['a']!)),
        ],
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return ExpansionTile(
      title: Text(
        question,
        style: AppFont.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.grey[700],
        ),
      ),
      tilePadding: EdgeInsets.zero,
      childrenPadding: const EdgeInsets.only(bottom: 16),
      children: [
        Text(
          answer,
          style: AppFont.inter(
            fontSize: 13,
            color: Colors.grey[600],
            height: 1.5,
          ),
        ),
      ],
    );
  }
}
