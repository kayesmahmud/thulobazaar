import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:mobile/features/help/help_center_screen.dart';
import 'package:mobile/features/support/support_tickets_screen.dart';
import 'package:mobile/features/support/live_chat_screen.dart';

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          'contact.title'.tr(),
          style: AppFont.poppins(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Header card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Icon(
                    LucideIcons.headphones,
                    color: Colors.white,
                    size: 36,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'contact.wereHereToHelp'.tr(),
                    style: AppFont.poppins(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'contact.reachOut'.tr(),
                    textAlign: TextAlign.center,
                    style: AppFont.inter(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Contact info cards
            _ContactCard(
              icon: LucideIcons.mail,
              iconColor: const Color(0xFF3B82F6),
              iconBg: const Color(0xFFDBEAFE),
              title: 'contact.email'.tr(),
              value: 'contact.emailAddress'.tr(),
              onTap: () => _launchUrl('mailto:support@thulobazaar.com.np'),
            ),
            _ContactCard(
              icon: LucideIcons.phone,
              iconColor: const Color(0xFF22C55E),
              iconBg: const Color(0xFFDCFCE7),
              title: 'contact.phone'.tr(),
              value: 'contact.phoneNumber'.tr(),
              onTap: () => _launchUrl('tel:+97715921222'),
            ),
            _ContactCard(
              icon: LucideIcons.mapPin,
              iconColor: const Color(0xFF8B5CF6),
              iconBg: const Color(0xFFEDE9FE),
              title: 'contact.address'.tr(),
              value: 'contact.location'.tr(),
            ),
            _ContactCard(
              icon: LucideIcons.clock,
              iconColor: const Color(0xFFF59E0B),
              iconBg: const Color(0xFFFEF3C7),
              title: 'contact.businessHours'.tr(),
              value: 'contact.hours'.tr(),
            ),

            const SizedBox(height: 24),

            // Quick action buttons
            Text(
              'contact.quickActions'.tr(),
              style: AppFont.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 12),

            _ActionButton(
              icon: LucideIcons.headphones,
              title: 'contact.startLiveChat'.tr(),
              subtitle: 'contact.liveChatSubtitle'.tr(),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LiveChatScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _ActionButton(
              icon: LucideIcons.ticket,
              title: 'contact.createSupportTicket'.tr(),
              subtitle: 'contact.supportSubtitle'.tr(),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SupportTicketsScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _ActionButton(
              icon: LucideIcons.helpCircle,
              title: 'contact.browseFaqs'.tr(),
              subtitle: 'contact.faqSubtitle'.tr(),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const HelpCenterScreen()),
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  static Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}

class _ContactCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String value;
  final VoidCallback? onTap;

  const _ContactCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.value,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 22, color: iconColor),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppFont.inter(
                        fontSize: 13,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      value,
                      style: AppFont.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: onTap != null
                            ? iconColor
                            : const Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
              ),
              if (onTap != null)
                Icon(
                  LucideIcons.externalLink,
                  size: 16,
                  color: Colors.grey[400],
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFFE11D48).withAlpha(25),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 20, color: const Color(0xFFE11D48)),
        ),
        title: Text(
          title,
          style: AppFont.inter(fontSize: 15, fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          subtitle,
          style: AppFont.inter(fontSize: 13, color: Colors.grey[500]),
        ),
        trailing: Icon(
          LucideIcons.chevronRight,
          size: 18,
          color: Colors.grey[400],
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
    );
  }
}
