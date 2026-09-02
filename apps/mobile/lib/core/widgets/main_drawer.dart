import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:provider/provider.dart';

import 'package:mobile/core/api/verification_client.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/auth/signin_screen.dart';
import 'package:mobile/features/auth/signup_screen.dart';
import 'package:mobile/features/dashboard/dashboard_screen.dart';
import 'package:mobile/features/shop/shop_screen.dart';
import 'package:mobile/features/verification/verification_screen.dart';
import 'package:mobile/features/profile/profile_screen.dart';
import 'package:mobile/features/settings/settings_screen.dart';
import 'package:mobile/features/help/help_center_screen.dart';
import 'package:mobile/features/contact/contact_screen.dart';
import 'package:mobile/features/support/support_tickets_screen.dart';
import 'package:mobile/features/support/live_chat_screen.dart';

class MainDrawer extends StatefulWidget {
  const MainDrawer({super.key});

  @override
  State<MainDrawer> createState() => _MainDrawerState();
}

class _MainDrawerState extends State<MainDrawer> {
  bool _isFreeEligible = false;

  @override
  void initState() {
    super.initState();
    _checkFreeEligibility();
  }

  Future<void> _checkFreeEligibility() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isLoggedIn) return;
    try {
      final pricing = await VerificationClient().getVerificationPricing();
      if (!mounted) return;
      final free = pricing?.freeVerification;
      setState(() {
        _isFreeEligible =
            (free?.enabled ?? false) && (free?.isEligible ?? false);
      });
    } catch (_) {
      // Silent failure — badge just stays hidden
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isLoggedIn = authProvider.isLoggedIn;
    final user = authProvider.user;

    // Flutter's default Drawer width (304px) covers ~85% on narrow Android
    // phones but looks fine on wider iOS screens. Constrain it to ~58% of the
    // screen on Android only; iOS keeps the default (width: null).
    final isAndroid = Theme.of(context).platform == TargetPlatform.android;
    final drawerWidth = isAndroid
        ? MediaQuery.of(context).size.width * 0.58
        : null;

    return Drawer(
      width: drawerWidth,
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Image.asset(
                    'assets/images/logo.png',
                    height: 28,
                    errorBuilder: (context, error, stackTrace) => Text(
                      'common.appNameFallback'.tr(),
                      style: AppFont.poppins(
                        color: const Color(0xFFDC2626),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.x,
                      color: Colors.grey,
                      size: 28,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE5E7EB)),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Language Toggle
                    _buildLanguageToggle(context),
                    const SizedBox(height: 8),

                    _buildMenuItem(
                      'drawer.getVerified'.tr(),
                      trailing: _isFreeEligible ? _buildFreeBadge() : null,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const VerificationScreen(),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 12),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 24),
                      child: Divider(height: 1, color: Color(0xFFE5E7EB)),
                    ),
                    const SizedBox(height: 12),

                    if (isLoggedIn) ...[
                      _buildMenuItem(
                        'drawer.myProfile'.tr(),
                        icon: LucideIcons.user,
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ProfileScreen(),
                            ),
                          );
                        },
                      ),
                      _buildMenuItem(
                        'drawer.settings'.tr(),
                        icon: LucideIcons.settings,
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const SettingsScreen(),
                            ),
                          );
                        },
                      ),
                      _buildMenuItem(
                        'drawer.dashboard'.tr(),
                        icon: LucideIcons.layoutDashboard,
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const DashboardScreen(),
                            ),
                          );
                        },
                      ),
                      _buildMenuItem(
                        'drawer.myShop'.tr(),
                        icon: LucideIcons.store,
                        onTap: () {
                          Navigator.pop(context);
                          final shopSlug =
                              user?['shopSlug'] ??
                              user?['shop_slug'] ??
                              user?['customShopSlug'] ??
                              user?['custom_shop_slug'] ??
                              'user-${user?['id']}';
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ShopScreen(shopSlug: shopSlug),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 24),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: ElevatedButton(
                          onPressed: () {
                            authProvider.logout();
                            Navigator.pop(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFDC2626),
                            foregroundColor: Colors.white,
                            minimumSize: const Size(double.infinity, 42),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 0,
                          ),
                          child: Text(
                            'auth.signOut'.tr(),
                            style: AppFont.inter(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ] else ...[
                      // Guest View
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          children: [
                            OutlinedButton(
                              onPressed: () {
                                Navigator.pop(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const SignInScreen(),
                                  ),
                                );
                              },
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                  color: Color(0xFFE11D48),
                                ),
                                foregroundColor: const Color(0xFFE11D48),
                                minimumSize: const Size(double.infinity, 42),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: Text(
                                'auth.signIn'.tr(),
                                style: AppFont.inter(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () {
                                Navigator.pop(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const SignUpScreen(),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE11D48),
                                foregroundColor: Colors.white,
                                minimumSize: const Size(double.infinity, 42),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                elevation: 0,
                              ),
                              child: Text(
                                'auth.signUp'.tr(),
                                style: AppFont.inter(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 24),
                      child: Divider(height: 1, color: Color(0xFFE5E7EB)),
                    ),
                    const SizedBox(height: 12),

                    _buildMenuItem(
                      'drawer.liveChat'.tr(),
                      icon: LucideIcons.headphones,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const LiveChatScreen(),
                          ),
                        );
                      },
                    ),
                    _buildMenuItem(
                      'drawer.helpCenter'.tr(),
                      icon: LucideIcons.helpCircle,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const HelpCenterScreen(),
                          ),
                        );
                      },
                    ),
                    _buildMenuItem(
                      'drawer.faq'.tr(),
                      icon: LucideIcons.fileText,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const HelpCenterScreen(),
                          ),
                        );
                      },
                    ),
                    _buildMenuItem(
                      'drawer.supportTickets'.tr(),
                      icon: LucideIcons.ticket,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const SupportTicketsScreen(),
                          ),
                        );
                      },
                    ),
                    _buildMenuItem(
                      'drawer.contactUs'.tr(),
                      icon: LucideIcons.mail,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const ContactScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageToggle(BuildContext context) {
    final isNepali = context.locale.languageCode == 'ne';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => context.setLocale(const Locale('en')),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: !isNepali ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: !isNepali
                        ? [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    'English',
                    textAlign: TextAlign.center,
                    style: AppFont.inter(
                      fontSize: 14,
                      fontWeight: !isNepali ? FontWeight.w600 : FontWeight.w400,
                      color: !isNepali
                          ? const Color(0xFF374151)
                          : const Color(0xFF9CA3AF),
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: GestureDetector(
                onTap: () => context.setLocale(const Locale('ne')),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isNepali ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: isNepali
                        ? [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    'नेपाली',
                    textAlign: TextAlign.center,
                    style: AppFont.inter(
                      fontSize: 14,
                      fontWeight: isNepali ? FontWeight.w600 : FontWeight.w400,
                      color: isNepali
                          ? const Color(0xFF374151)
                          : const Color(0xFF9CA3AF),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    String title, {
    IconData? icon,
    VoidCallback? onTap,
    Widget? trailing,
  }) {
    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      leading: icon != null
          ? Icon(icon, color: Colors.grey[600], size: 20)
          : null,
      title: Text(
        title,
        style: AppFont.inter(
          color: const Color(0xFF374151),
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: trailing,
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 2),
      horizontalTitleGap: 10,
      minLeadingWidth: icon != null ? 24 : 0,
    );
  }

  Widget _buildFreeBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
        ),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withValues(alpha: 0.3),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Text(
        'FREE',
        style: AppFont.inter(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
