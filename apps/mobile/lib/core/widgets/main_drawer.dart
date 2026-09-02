import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/api/verification_client.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/theme/app_tokens.dart';
import 'package:mobile/core/widgets/glass_surface.dart';
import 'package:mobile/features/auth/signin_screen.dart';
import 'package:mobile/features/auth/signup_screen.dart';
import 'package:mobile/features/contact/contact_screen.dart';
import 'package:mobile/features/dashboard/dashboard_screen.dart';
import 'package:mobile/features/help/help_center_screen.dart';
import 'package:mobile/features/profile/profile_screen.dart';
import 'package:mobile/features/settings/settings_screen.dart';
import 'package:mobile/features/shop/shop_screen.dart';
import 'package:mobile/features/support/live_chat_screen.dart';
import 'package:mobile/features/support/support_tickets_screen.dart';
import 'package:mobile/features/verification/verification_screen.dart';

/// The glass drawer. Identity on top, Get Verified as the one loud card,
/// then the account rows (Settings last), the two ways to reach a person,
/// and the language switch. Signed-out users also get Help center and
/// Contact us here, because Settings, where those live for members, is
/// behind the sign-in gate.
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
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) return;
    try {
      final pricing = await VerificationClient().getVerificationPricing();
      if (!mounted) return;
      final free = pricing?.freeVerification;
      setState(() {
        _isFreeEligible =
            (free?.enabled ?? false) && (free?.isEligible ?? false);
      });
    } catch (_) {
      // The badge just stays hidden.
    }
  }

  void _open(Widget screen) {
    Navigator.pop(context);
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final signedIn = auth.isLoggedIn;
    final user = auth.user ?? const <String, dynamic>{};

    // Flutter's default width covers most of a narrow Android phone; keep
    // the feed visible behind the glass there. iOS keeps the default.
    final isAndroid = Theme.of(context).platform == TargetPlatform.android;
    final width = isAndroid ? MediaQuery.sizeOf(context).width * 0.62 : null;
    const radius = BorderRadius.horizontal(right: Radius.circular(24));

    return Drawer(
      width: width,
      backgroundColor: Colors.transparent,
      elevation: 0,
      shape: const RoundedRectangleBorder(borderRadius: radius),
      child: GlassSurface(
        borderRadius: radius,
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              _Identity(user: user, signedIn: signedIn),
              _VerifyCard(
                free: _isFreeEligible,
                onTap: () => _open(const VerificationScreen()),
              ),
              const SizedBox(height: 6),
              if (signedIn) ...[
                _Item(
                  icon: LucideIcons.user,
                  label: 'drawer.myProfile'.tr(),
                  onTap: () => _open(const ProfileScreen()),
                ),
                _Item(
                  icon: LucideIcons.layoutDashboard,
                  label: 'drawer.dashboard'.tr(),
                  onTap: () => _open(const DashboardScreen()),
                ),
                _Item(
                  icon: LucideIcons.store,
                  label: 'drawer.myShop'.tr(),
                  onTap: () => _open(ShopScreen(shopSlug: _shopSlug(user))),
                ),
                _Item(
                  icon: LucideIcons.settings,
                  label: 'drawer.settings'.tr(),
                  onTap: () => _open(const SettingsScreen()),
                ),
              ] else
                _GuestButtons(
                  onSignIn: () => _open(const SignInScreen()),
                  onSignUp: () => _open(const SignUpScreen()),
                ),
              const _Sep(),
              _Item(
                icon: LucideIcons.messagesSquare,
                label: 'drawer.liveChat'.tr(),
                onTap: () => _open(const LiveChatScreen()),
              ),
              if (!signedIn)
                _Item(
                  icon: LucideIcons.helpCircle,
                  label: 'drawer.helpCenter'.tr(),
                  onTap: () => _open(const HelpCenterScreen()),
                ),
              _Item(
                icon: LucideIcons.ticket,
                label: 'drawer.supportTickets'.tr(),
                onTap: () => _open(const SupportTicketsScreen()),
              ),
              if (!signedIn)
                _Item(
                  icon: LucideIcons.mail,
                  label: 'drawer.contactUs'.tr(),
                  onTap: () => _open(const ContactScreen()),
                ),
              const _Sep(),
              const _LanguagePills(),
              if (signedIn) ...[
                const _Sep(),
                _Item(
                  icon: LucideIcons.logOut,
                  label: 'auth.signOut'.tr(),
                  muted: true,
                  onTap: () {
                    Navigator.pop(context);
                    auth.logout();
                  },
                ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  static String _shopSlug(Map<String, dynamic> user) {
    for (final key in const [
      'shopSlug',
      'shop_slug',
      'customShopSlug',
      'custom_shop_slug',
    ]) {
      final value = user[key];
      if (value is String && value.isNotEmpty) return value;
    }
    return 'user-${user['id']}';
  }
}

class _Identity extends StatelessWidget {
  final Map<String, dynamic> user;
  final bool signedIn;
  const _Identity({required this.user, required this.signedIn});

  @override
  Widget build(BuildContext context) {
    final name = signedIn
        ? (user['fullName'] as String?) ?? 'drawer.notSignedIn'.tr()
        : 'drawer.notSignedIn'.tr();
    final avatar = ApiConfig.getAvatarUrl(user['avatar'] as String?);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 8, 12),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppTokens.brandTint,
            foregroundImage: signedIn && avatar.isNotEmpty
                ? CachedNetworkImageProvider(avatar)
                : null,
            child: const Icon(LucideIcons.user, color: AppTokens.brandDeep),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppFont.inter(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTokens.ink,
                height: 1.35,
              ),
            ),
          ),
          IconButton(
            tooltip: 'common.close'.tr(),
            icon: const Icon(LucideIcons.x, color: AppTokens.inkFaint),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}

/// Same destination as always, promoted from a text row to the one card
/// that should pull the eye.
class _VerifyCard extends StatelessWidget {
  final bool free;
  final VoidCallback onTap;
  const _VerifyCard({required this.free, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTokens.radiusCard),
          onTap: onTap,
          child: Ink(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppTokens.brand, AppTokens.brandDeep],
              ),
              borderRadius: BorderRadius.circular(AppTokens.radiusCard),
            ),
            child: Row(
              children: [
                const Icon(
                  LucideIcons.badgeCheck,
                  color: Colors.white,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'drawer.getVerified'.tr(),
                    style: AppFont.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1.35,
                    ),
                  ),
                ),
                if (free)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTokens.success,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      'FREE',
                      style: AppFont.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool muted;
  const _Item({
    required this.icon,
    required this.label,
    required this.onTap,
    this.muted = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = muted ? AppTokens.inkFaint : AppTokens.ink;
    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      horizontalTitleGap: 12,
      leading: Icon(
        icon,
        size: 20,
        color: muted ? AppTokens.inkFaint : AppTokens.inkMuted,
      ),
      title: Text(
        label,
        style: AppFont.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: color,
          height: 1.4,
        ),
      ),
      onTap: onTap,
    );
  }
}

class _GuestButtons extends StatelessWidget {
  final VoidCallback onSignIn;
  final VoidCallback onSignUp;
  const _GuestButtons({required this.onSignIn, required this.onSignUp});

  @override
  Widget build(BuildContext context) {
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    );
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: Column(
        children: [
          OutlinedButton(
            onPressed: onSignIn,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppTokens.brand),
              foregroundColor: AppTokens.brandDeep,
              minimumSize: const Size(double.infinity, 44),
              shape: shape,
            ),
            child: Text(
              'auth.signIn'.tr(),
              style: AppFont.inter(fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
          const SizedBox(height: 10),
          FilledButton(
            onPressed: onSignUp,
            style: FilledButton.styleFrom(
              backgroundColor: AppTokens.brand,
              minimumSize: const Size(double.infinity, 44),
              shape: shape,
            ),
            child: Text(
              'auth.signUp'.tr(),
              style: AppFont.inter(fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _LanguagePills extends StatelessWidget {
  const _LanguagePills();

  @override
  Widget build(BuildContext context) {
    final nepali = context.locale.languageCode == 'ne';
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
      child: Row(
        children: [
          _pill(context, 'English', !nepali, const Locale('en')),
          const SizedBox(width: 8),
          _pill(context, 'नेपाली', nepali, const Locale('ne')),
        ],
      ),
    );
  }

  Widget _pill(BuildContext context, String label, bool on, Locale locale) {
    return Expanded(
      child: Material(
        color: on ? AppTokens.brandTint : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () => context.setLocale(locale),
          child: Container(
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: on ? AppTokens.brand : AppTokens.hairline,
              ),
            ),
            child: Text(
              label,
              style: AppFont.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: on ? AppTokens.brandDeep : AppTokens.inkMuted,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Sep extends StatelessWidget {
  const _Sep();
  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
    child: Divider(height: 1, color: AppTokens.hairline),
  );
}
