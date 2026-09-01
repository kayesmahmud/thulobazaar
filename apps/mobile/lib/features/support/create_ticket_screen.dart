import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:easy_localization/easy_localization.dart';

import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/models/support_ticket.dart';
import 'ticket_detail_screen.dart';

class CreateTicketScreen extends StatefulWidget {
  const CreateTicketScreen({super.key});

  @override
  State<CreateTicketScreen> createState() => _CreateTicketScreenState();
}

class _CreateTicketScreenState extends State<CreateTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  final _client = SupportClient();

  SupportTicketCategory _category = SupportTicketCategory.general;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final response = await _client.createTicket(
      subject: _subjectController.text.trim(),
      message: _messageController.text.trim(),
      category: _category.name,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (response.hasData) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => TicketDetailScreen(ticketId: response.data!.id),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.errorMessage),
          backgroundColor: Colors.red[700],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          'support.newTicket'.tr(),
          style: AppFont.poppins(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      LucideIcons.lightbulb,
                      size: 20,
                      color: Color(0xFF2563EB),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'support.ticketHelper'.tr(),
                        style: AppFont.inter(
                          fontSize: 13,
                          color: const Color(0xFF1E40AF),
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Category
              _buildLabel('support.categoryLabel'.tr(), LucideIcons.tag),
              const SizedBox(height: 8),
              DropdownButtonFormField<SupportTicketCategory>(
                initialValue: _category,
                decoration: _inputDecoration('support.selectCategory'.tr()),
                items: SupportTicketCategory.values
                    .map(
                      (c) => DropdownMenuItem(
                        value: c,
                        child: Text(
                          c.label,
                          style: AppFont.inter(fontSize: 15),
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _category = v);
                },
              ),

              const SizedBox(height: 20),

              // Subject
              _buildLabel('support.subject'.tr(), LucideIcons.type),
              const SizedBox(height: 8),
              TextFormField(
                controller: _subjectController,
                decoration: _inputDecoration('support.subjectHint'.tr()),
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'support.subjectRequired'.tr()
                    : null,
                textInputAction: TextInputAction.next,
                style: AppFont.inter(fontSize: 15),
              ),

              const SizedBox(height: 20),

              // Description
              _buildLabel(
                'support.descriptionLabel'.tr(),
                LucideIcons.alignLeft,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _messageController,
                decoration: _inputDecoration('support.descriptionHint'.tr()),
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'support.descriptionRequired'.tr()
                    : null,
                maxLines: 6,
                style: AppFont.inter(fontSize: 15),
              ),

              const SizedBox(height: 32),

              // Submit
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE11D48),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    disabledBackgroundColor: Colors.grey[300],
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.send, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'support.submitTicket'.tr(),
                              style: AppFont.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[500]),
        const SizedBox(width: 6),
        Text(
          text,
          style: AppFont.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF374151),
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: AppFont.inter(color: Colors.grey[400]),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE11D48), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.red[300]!),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
  }
}
