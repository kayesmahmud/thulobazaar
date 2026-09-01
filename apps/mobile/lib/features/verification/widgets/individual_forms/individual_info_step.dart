import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';

class IndividualInfoStep extends StatelessWidget {
  final TextEditingController fullNameController;
  final TextEditingController idNumberController;
  final String idType;
  final ValueChanged<String?> onIdTypeChanged;

  const IndividualInfoStep({
    super.key,
    required this.fullNameController,
    required this.idNumberController,
    required this.idType,
    required this.onIdTypeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          lang == 'ne' ? 'व्यक्तिगत जानकारी' : 'Personal Information',
          style: AppFont.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          lang == 'ne'
              ? 'तपाईंको परिचयपत्रमा देखिए अनुसार विवरणहरू लेख्नुहोस्।'
              : 'Enter your details exactly as they appear on your ID document.',
          style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),

        // Full Name
        Text(
          lang == 'ne' ? 'पूरा नाम *' : 'Full Name *',
          style: AppFont.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: fullNameController,
          decoration: InputDecoration(
            hintText: lang == 'ne'
                ? 'आफ्नो पूरा नाम लेख्नुहोस्'
                : 'Enter your full name',
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // ID Type
        Text(
          lang == 'ne' ? 'परिचयपत्र प्रकार *' : 'ID Document Type *',
          style: AppFont.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: idType,
              isExpanded: true,
              items: [
                DropdownMenuItem(
                  value: 'citizenship',
                  child: Text(lang == 'ne' ? 'नागरिकता' : 'Citizenship'),
                ),
                DropdownMenuItem(
                  value: 'passport',
                  child: Text(lang == 'ne' ? 'राहदानी' : 'Passport'),
                ),
                DropdownMenuItem(
                  value: 'driving_license',
                  child: Text(
                    lang == 'ne' ? 'सवारी चालक अनुमतिपत्र' : 'Driving License',
                  ),
                ),
              ],
              onChanged: onIdTypeChanged,
            ),
          ),
        ),
        const SizedBox(height: 20),

        // ID Number
        Text(
          lang == 'ne' ? 'परिचयपत्र नम्बर *' : 'ID Document Number *',
          style: AppFont.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: idNumberController,
          decoration: InputDecoration(
            hintText: lang == 'ne'
                ? 'आफ्नो परिचयपत्र नम्बर लेख्नुहोस्'
                : 'Enter your ID number',
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
            ),
          ),
        ),

        const SizedBox(height: 24),

        // Tips
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFEEF2FF),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    LucideIcons.lightbulb,
                    color: Color(0xFF6366F1),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    lang == 'ne' ? 'सुझावहरू' : 'Tips',
                    style: AppFont.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF6366F1),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                lang == 'ne'
                    ? '• तपाईंको परिचयपत्रमा देखिए अनुसारको नाम प्रयोग गर्नुहोस्\n'
                          '• परिचयपत्र नम्बर शुद्ध छ भनी जाँच गर्नुहोस्\n'
                          '• जानकारी तपाईंको कागजातसँग मिल्नुपर्छ'
                    : '• Use the exact name as shown on your ID\n'
                          '• Double-check your ID number for accuracy\n'
                          '• Information must match your documents',
                style: AppFont.inter(
                  fontSize: 13,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
