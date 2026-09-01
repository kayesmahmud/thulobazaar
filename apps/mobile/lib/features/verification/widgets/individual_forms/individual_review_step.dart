import 'dart:io';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/theme/app_font.dart';
import '../../../../core/utils/localized_helpers.dart';

class IndividualReviewStep extends StatelessWidget {
  final String fullName;
  final String idType;
  final String idNumber;
  final int durationDays;
  final double price;
  final bool isFreeVerification;
  final File? idFrontFile;
  final File? idBackFile;
  final File? selfieFile;

  const IndividualReviewStep({
    super.key,
    required this.fullName,
    required this.idType,
    required this.idNumber,
    required this.durationDays,
    required this.price,
    required this.isFreeVerification,
    required this.idFrontFile,
    required this.idBackFile,
    required this.selfieFile,
  });

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          lang == 'ne' ? 'समीक्षा र पेश गर्नुहोस्' : 'Review & Submit',
          style: AppFont.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          lang == 'ne'
              ? 'कृपया पेश गर्नु अघि आफ्नो जानकारी समीक्षा गर्नुहोस्।'
              : 'Please review your information before submitting.',
          style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),

        // Summary card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            children: [
              _buildReviewRow(
                lang == 'ne' ? 'पूरा नाम' : 'Full Name',
                fullName,
              ),
              const Divider(height: 24),
              _buildReviewRow(
                lang == 'ne' ? 'परिचयपत्र प्रकार' : 'ID Type',
                _getIdTypeLabel(idType, lang),
              ),
              const Divider(height: 24),
              _buildReviewRow(
                lang == 'ne' ? 'परिचयपत्र नम्बर' : 'ID Number',
                idNumber,
              ),
              const Divider(height: 24),
              _buildReviewRow(
                lang == 'ne' ? 'अवधि' : 'Duration',
                lang == 'ne' ? '$durationDays दिन' : '$durationDays days',
              ),
              const Divider(height: 24),
              _buildReviewRow(
                lang == 'ne' ? 'मूल्य' : 'Price',
                isFreeVerification
                    ? (lang == 'ne' ? 'निःशुल्क' : 'FREE')
                    : formatLocalizedPrice(price, lang),
                isHighlighted: true,
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Documents preview
        Text(
          lang == 'ne' ? 'अपलोड गरिएका कागजातहरू' : 'Documents Uploaded',
          style: AppFont.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            if (idFrontFile != null)
              Expanded(
                child: _buildDocPreview(
                  lang == 'ne' ? 'परिचयपत्र अगाडि' : 'ID Front',
                  idFrontFile!,
                ),
              ),
            const SizedBox(width: 8),
            if (idBackFile != null)
              Expanded(
                child: _buildDocPreview(
                  lang == 'ne' ? 'परिचयपत्र पछाडि' : 'ID Back',
                  idBackFile!,
                ),
              )
            else
              const Spacer(),
          ],
        ),
        const SizedBox(height: 12),
        if (selfieFile != null)
          _buildDocPreview(
            lang == 'ne' ? 'परिचयपत्रसहित सेल्फी' : 'Selfie with ID',
            selfieFile!,
          ),
      ],
    );
  }

  Widget _buildReviewRow(
    String label,
    String value, {
    bool isHighlighted = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        Text(
          value,
          style: AppFont.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isHighlighted ? const Color(0xFF6366F1) : Colors.grey[800],
          ),
        ),
      ],
    );
  }

  Widget _buildDocPreview(String label, File file) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppFont.inter(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        Container(
          height: 100,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
            image: DecorationImage(image: FileImage(file), fit: BoxFit.cover),
          ),
        ),
      ],
    );
  }

  String _getIdTypeLabel(String type, String lang) {
    if (lang == 'ne') {
      switch (type) {
        case 'citizenship':
          return 'नागरिकता';
        case 'passport':
          return 'राहदानी';
        case 'driving_license':
          return 'सवारी चालक अनुमतिपत्र';
        default:
          return type;
      }
    }
    switch (type) {
      case 'citizenship':
        return 'Citizenship';
      case 'passport':
        return 'Passport';
      case 'driving_license':
        return 'Driving License';
      default:
        return type;
    }
  }
}
