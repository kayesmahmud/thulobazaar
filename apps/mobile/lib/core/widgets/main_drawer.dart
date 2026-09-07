import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

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
import 'package:mobile/features/safety/scam_prevention_screen.dart';
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
  /// Test seam: the pricing lookup behind the FREE badge.
  final VerificationClient? verificationClient;

  const MainDrawer({super.key, @visibleForTesting this.verificationClient});

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

  /// Guests are asked too: the pricing endpoint answers without a token, and
  /// a brand-new account has never been verified, so the badge is honest.
  Future<void> _checkFreeEligibility() async {
    try {
      final client = widget.verificationClient ?? VerificationClient();
      final pricing = await client.getVerificationPricing();
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
              // Breathing room under the status bar. The avatar used to
              // create it; without one the first row sat flush against the
              // notch. Both states clear the cutout by about the same amount.
              const SizedBox(height: 24),
              if (signedIn && _verifiedKind(user) != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: _VerifiedPill(kind: _verifiedKind(user)!),
                  ),
                )
              else
                const SizedBox(height: 32),
              const _LanguagePills(),
              const SizedBox(height: 12),
              if (_verifiedKind(user) == null) ...[
                _VerifyCard(
                  free: _isFreeEligible,
                  onTap: () => _open(const VerificationScreen()),
                ),
                const SizedBox(height: 6),
              ],
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
              _Item(
                icon: LucideIcons.shieldAlert,
                label: 'drawer.scamPrevention'.tr(),
                onTap: () => _open(const ScamPreventionScreen()),
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

/// Which badge, if any, a signed-in user has earned. Mirrors the rule
/// Settings uses, so the drawer and Settings can never disagree.
String? _verifiedKind(Map<String, dynamic> user) {
  final business = user['businessVerificationStatus'];
  if (business == 'approved' || business == 'verified') return 'business';
  if (user['individualVerified'] == true) return 'individual';
  return null;
}

/// Gold reads as a trading badge, blue as a personal identity check — the
/// same convention buyers already meet elsewhere.
class _VerifiedPill extends StatelessWidget {
  final String kind;
  const _VerifiedPill({required this.kind});

  @override
  Widget build(BuildContext context) {
    final business = kind == 'business';
    final ink = business ? const Color(0xFFB45309) : const Color(0xFF1D4ED8);
    final tint = business ? const Color(0xFFFEF3C7) : const Color(0xFFDBEAFE);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: tint,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.badgeCheck, size: 14, color: ink),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              business
                  ? 'settings.businessVerified'.tr()
                  : 'settings.individualVerified'.tr(),
              overflow: TextOverflow.ellipsis,
              style: AppFont.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: ink,
              ),
            ),
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

/// Segmented language switch: one white track, a brand thumb that slides to
/// the chosen language. Both choices sit on a solid background, so neither
/// vanishes on the frosted drawer, and it stays quiet next to the red
/// Get Verified card below it.
class _LanguagePills extends StatelessWidget {
  const _LanguagePills();

  static const _radius = 14.0;
  static const _inset = 4.0;
  static const _slide = Duration(milliseconds: 220);

  @override
  Widget build(BuildContext context) {
    final nepali = context.locale.languageCode == 'ne';
    final duration = MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : _slide;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 44,
        padding: const EdgeInsets.all(_inset),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(_radius),
          border: Border.all(color: AppTokens.hairline),
        ),
        child: Material(
          type: MaterialType.transparency,
          child: Stack(
            children: [
              AnimatedAlign(
                alignment: nepali
                    ? Alignment.centerRight
                    : Alignment.centerLeft,
                duration: duration,
                curve: Curves.easeOutCubic,
                child: FractionallySizedBox(
                  widthFactor: 0.5,
                  heightFactor: 1,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: AppTokens.brand,
                      borderRadius: BorderRadius.circular(_radius - _inset),
                      boxShadow: [
                        BoxShadow(
                          color: AppTokens.brand.withValues(alpha: 0.30),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Row(
                children: [
                  _cell(
                    context,
                    'English',
                    const Locale('en'),
                    !nepali,
                    duration,
                  ),
                  _cell(
                    context,
                    'नेपाली',
                    const Locale('ne'),
                    nepali,
                    duration,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _cell(
    BuildContext context,
    String label,
    Locale locale,
    bool on,
    Duration duration,
  ) {
    return Expanded(
      child: Semantics(
        button: true,
        selected: on,
        label: label,
        child: InkWell(
          borderRadius: BorderRadius.circular(_radius - _inset),
          onTap: () => context.setLocale(locale),
          child: Center(
            child: AnimatedDefaultTextStyle(
              duration: duration,
              style: AppFont.inter(
                fontSize: 14,
                fontWeight: on ? FontWeight.w800 : FontWeight.w600,
                color: on ? Colors.white : AppTokens.inkMuted,
              ),
              child: Text(label),
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
