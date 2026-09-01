import 'dart:io';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';

class IndividualDocumentsStep extends StatelessWidget {
  final File? idFrontFile;
  final File? idBackFile;
  final File? selfieFile;
  final VoidCallback onPickFront;
  final VoidCallback onPickBack;
  final VoidCallback onPickSelfie;
  final VoidCallback onClearFront;
  final VoidCallback onClearBack;
  final VoidCallback onClearSelfie;

  const IndividualDocumentsStep({
    super.key,
    required this.idFrontFile,
    required this.idBackFile,
    required this.selfieFile,
    required this.onPickFront,
    required this.onPickBack,
    required this.onPickSelfie,
    required this.onClearFront,
    required this.onClearBack,
    required this.onClearSelfie,
  });

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          lang == 'ne' ? 'कागजातहरू अपलोड गर्नुहोस्' : 'Upload Documents',
          style: AppFont.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          lang == 'ne'
              ? 'तपाईंको परिचयपत्र र सेल्फीको स्पष्ट फोटो अपलोड गर्नुहोस्।'
              : 'Upload clear photos of your ID document and a selfie.',
          style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),

        // ID Front
        _buildFileUpload(
          label: lang == 'ne' ? 'परिचयपत्र (अगाडि) *' : 'ID Document (Front) *',
          hint: lang == 'ne'
              ? 'आफ्नो परिचयपत्रको अगाडिको भाग अपलोड गर्नुहोस्'
              : 'Upload front side of your ID',
          file: idFrontFile,
          onTap: onPickFront,
          onClear: onClearFront,
        ),
        const SizedBox(height: 20),

        // ID Back (Optional)
        _buildFileUpload(
          label: lang == 'ne' ? 'परिचयपत्र (पछाडि)' : 'ID Document (Back)',
          hint: lang == 'ne'
              ? 'आफ्नो परिचयपत्रको पछाडिको भाग अपलोड गर्नुहोस् (ऐच्छिक)'
              : 'Upload back side of your ID (optional)',
          file: idBackFile,
          onTap: onPickBack,
          onClear: onClearBack,
          isOptional: true,
        ),
        const SizedBox(height: 20),

        // Selfie
        _buildFileUpload(
          label: lang == 'ne' ? 'परिचयपत्रसहित सेल्फी *' : 'Selfie with ID *',
          hint: lang == 'ne'
              ? 'आफ्नो परिचयपत्र समातेको सेल्फी अपलोड गर्नुहोस्'
              : 'Upload a selfie holding your ID document',
          file: selfieFile,
          onTap: onPickSelfie,
          onClear: onClearSelfie,
        ),

        const SizedBox(height: 24),

        // Tips
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    LucideIcons.alertTriangle,
                    color: Color(0xFFF59E0B),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    lang == 'ne' ? 'फोटो आवश्यकताहरू' : 'Photo Requirements',
                    style: AppFont.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFFD97706),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                lang == 'ne'
                    ? '• सबै पाठ स्पष्ट देखिनुपर्छ\n'
                          '• चम्किलो प्रकाश र छायाबाट बच्नुहोस्\n'
                          '• सेल्फीको लागि: परिचयपत्र अनुहारको छेउमा राख्नुहोस्\n'
                          '• अधिकतम फाइल साइज: प्रति छवि ५MB'
                    : '• Ensure all text is clearly visible\n'
                          '• Avoid glare and shadows\n'
                          '• For selfie: Hold ID next to your face\n'
                          '• Max file size: 5MB per image',
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

  Widget _buildFileUpload({
    required String label,
    required String hint,
    required File? file,
    required VoidCallback onTap,
    required VoidCallback onClear,
    bool isOptional = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppFont.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: double.infinity,
            height: file != null ? 180 : 120,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: file != null
                    ? const Color(0xFF10B981)
                    : Colors.grey[300]!,
                width: file != null ? 2 : 1,
              ),
            ),
            child: file != null
                ? Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.file(
                          file,
                          width: double.infinity,
                          height: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: onClear,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.red.withValues(alpha: 0.9),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(
                              LucideIcons.x,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            LucideIcons.check,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ],
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        LucideIcons.upload,
                        size: 40,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        hint,
                        style: AppFont.inter(
                          fontSize: 13,
                          color: Colors.grey[500],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}
