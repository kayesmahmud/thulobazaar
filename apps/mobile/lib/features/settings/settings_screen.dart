import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/services/search_history_service.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/theme/app_tokens.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:mobile/features/contact/contact_screen.dart';
import 'package:mobile/features/help/help_center_screen.dart';
import 'package:mobile/features/payment/payment_history_screen.dart';
import 'package:mobile/features/profile/delete_account_screen.dart';
import 'package:mobile/features/profile/phone_verification_screen.dart';
import 'package:mobile/features/profile/profile_screen.dart';
import 'package:mobile/features/profile/two_factor_setup_screen.dart';
import 'package:mobile/features/settings/active_sessions_screen.dart';
import 'package:mobile/features/settings/dialogs/change_password_dialog.dart';
import 'package:mobile/features/settings/dialogs/disable_two_factor_dialog.dart';
import 'package:mobile/features/settings/shop_url_screen.dart';
import 'package:mobile/features/settings/widgets/settings_kit.dart';
import 'package:mobile/features/verification/verification_screen.dart';

/// Account, sign-in & security, preferences, help. Every row leads to a
/// screen or flow that already existed; this screen only gathers them.
/// Language deliberately stays in the drawer.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      return const LoginGateScreen(kind: LoginGateKind.profile);
    }
    final user = auth.user ?? const <String, dynamic>{};
    return Scaffold(
      backgroundColor: AppTokens.canvas,
      appBar: AppBar(
        backgroundColor: AppTokens.surface,
        surfaceTintColor: AppTokens.surface,
        elevation: 0,
        title: Text(
          'settings.title'.tr(),
          style: AppFont.inter(fontSize: 18, fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
        children: [
          _AccountGroup(user: user),
          _SecurityGroup(user: user),
          const _PreferencesGroup(),
          const _HelpGroup(),
          const SizedBox(height: 24),
          const _AccountActions(),
        ],
      ),
    );
  }
}

void _push(BuildContext context, Widget screen) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
}

class _AccountGroup extends StatelessWidget {
  final Map<String, dynamic> user;
  const _AccountGroup({required this.user});

  bool get _phoneVerified => user['phoneVerified'] == true;

  bool get _businessVerified {
    final status = user['businessVerificationStatus'];
    return status == 'approved' || status == 'verified';
  }

  String? get _shopSlug =>
      (user['customShopSlug'] as String?) ?? (user['shopSlug'] as String?);

  String _verificationLabel() {
    final business = user['businessVerificationStatus'];
    if (business == 'approved' || business == 'verified') {
      return 'settings.businessVerified'.tr();
    }
    if (user['individualVerified'] == true) {
      return 'settings.individualVerified'.tr();
    }
    return 'settings.notVerified'.tr();
  }

  Future<void> _openPhone(BuildContext context) async {
    final auth = context.read<AuthProvider>();
    final phone = user['phone'] as String?;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PhoneVerificationScreen(
          isChanging: _phoneVerified,
          currentPhone: _phoneVerified ? phone : null,
          onVerified: auth.refreshProfile,
        ),
      ),
    );
    auth.refreshProfile();
  }

  @override
  Widget build(BuildContext context) {
    const tint = AppTokens.brand;
    return SettingsGroup(
      title: 'settings.account'.tr(),
      rows: [
        SettingsRow(
          icon: LucideIcons.user,
          tint: tint,
          title: 'settings.personalInfo'.tr(),
          subtitle: 'settings.personalInfoHint'.tr(),
          onTap: () => _push(context, const ProfileScreen()),
        ),
        SettingsRow(
          icon: LucideIcons.phone,
          tint: tint,
          title: 'settings.phone'.tr(),
          subtitle: (user['phone'] as String?) ?? 'settings.notAdded'.tr(),
          trailing: _phoneVerified
              ? SettingsChip(
                  label: 'settings.verified'.tr(),
                  color: AppTokens.successInk,
                )
              : SettingsChip(
                  label: 'settings.notVerified'.tr(),
                  color: AppTokens.warningInk,
                ),
          onTap: () => _openPhone(context),
        ),
        SettingsRow(
          icon: LucideIcons.mail,
          tint: tint,
          title: 'settings.email'.tr(),
          subtitle: (user['email'] as String?) ?? 'settings.notAdded'.tr(),
          // No change-email endpoint exists anywhere; say so instead of
          // showing a chevron that leads nowhere.
          note: 'settings.emailLocked'.tr(),
        ),
        SettingsRow(
          icon: LucideIcons.badgeCheck,
          tint: tint,
          title: 'settings.verification'.tr(),
          subtitle: _verificationLabel(),
          onTap: () => _push(context, const VerificationScreen()),
        ),
        // Everyone has a shop address; only a verified business may change
        // it (the website's rule). Others see why, and a tap leads there.
        SettingsRow(
          icon: LucideIcons.link,
          tint: tint,
          title: 'settings.shopUrl'.tr(),
          subtitle:
              'thulobazaar.com.np/${context.locale.languageCode}/shop/${_shopSlug ?? 'user-${user['id']}'}',
          note: _businessVerified ? null : 'settings.shopUrlLocked'.tr(),
          trailing: _businessVerified
              ? null
              : const Icon(
                  LucideIcons.lock,
                  size: 18,
                  color: AppTokens.inkFaint,
                ),
          onTap: () => _push(
            context,
            _businessVerified
                ? const ShopUrlScreen()
                : const VerificationScreen(),
          ),
        ),
        SettingsRow(
          icon: LucideIcons.receipt,
          tint: tint,
          title: 'settings.payments'.tr(),
          subtitle: 'settings.paymentsHint'.tr(),
          onTap: () => _push(context, const PaymentHistoryScreen()),
        ),
      ],
    );
  }
}

class _SecurityGroup extends StatelessWidget {
  final Map<String, dynamic> user;
  const _SecurityGroup({required this.user});

  bool get _twoFactorOn => user['twoFactorEnabled'] == true;

  Future<void> _toggleTwoFactor(BuildContext context) async {
    final auth = context.read<AuthProvider>();
    if (_twoFactorOn) {
      final disabled = await showDisableTwoFactorDialog(context);
      if (disabled) auth.refreshProfile();
      return;
    }
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TwoFactorSetupScreen(onComplete: auth.refreshProfile),
      ),
    );
    auth.refreshProfile();
  }

  @override
  Widget build(BuildContext context) {
    const tint = AppTokens.ink;
    return SettingsGroup(
      title: 'settings.signInSecurity'.tr(),
      rows: [
        SettingsRow(
          icon: LucideIcons.lock,
          tint: tint,
          title: 'security.changePassword'.tr(),
          subtitle: 'security.updatePassword'.tr(),
          onTap: () => showChangePasswordDialog(context),
        ),
        SettingsRow(
          icon: LucideIcons.shieldCheck,
          tint: tint,
          title: 'security.twoFactor'.tr(),
          subtitle: 'security.twoFactorSubtitle'.tr(),
          trailing: SettingsChip(
            label: (_twoFactorOn ? 'settings.on' : 'settings.off').tr(),
            color: _twoFactorOn ? AppTokens.successInk : AppTokens.inkFaint,
          ),
          onTap: () => _toggleTwoFactor(context),
        ),
        SettingsRow(
          icon: LucideIcons.monitor,
          tint: tint,
          title: 'security.activeSessions'.tr(),
          subtitle: 'settings.sessionsHint'.tr(),
          onTap: () => _push(context, const ActiveSessionsScreen()),
        ),
      ],
    );
  }
}

class _PreferencesGroup extends StatelessWidget {
  const _PreferencesGroup();

  Future<void> _clearSearchHistory(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('settings.clearSearchHistory'.tr()),
        content: Text('settings.clearSearchHistoryConfirm'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('common.cancel'.tr()),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('settings.clear'.tr()),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await SearchHistoryService.clearAll();
    messenger.showSnackBar(
      SnackBar(content: Text('settings.searchHistoryCleared'.tr())),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SettingsGroup(
      title: 'settings.preferences'.tr(),
      rows: [
        SettingsRow(
          icon: LucideIcons.history,
          tint: AppTokens.successInk,
          title: 'settings.clearSearchHistory'.tr(),
          subtitle: 'settings.clearSearchHistoryHint'.tr(),
          onTap: () => _clearSearchHistory(context),
        ),
      ],
    );
  }
}

class _HelpGroup extends StatelessWidget {
  const _HelpGroup();

  Future<void> _openSupportPage(BuildContext context, String slug) async {
    final lang = context.locale.languageCode;
    final messenger = ScaffoldMessenger.of(context);
    final uri = Uri.parse('https://thulobazaar.com.np/$lang/support/$slug');
    try {
      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!opened) throw Exception('launchUrl returned false');
    } catch (_) {
      messenger.showSnackBar(
        SnackBar(content: Text('settings.couldNotOpenLink'.tr())),
      );
    }
  }

  Future<String> _version() async {
    try {
      final info = await PackageInfo.fromPlatform();
      return 'settings.version'.tr(args: [info.version, info.buildNumber]);
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    const tint = AppTokens.inkFaint;
    return SettingsGroup(
      title: 'settings.helpAbout'.tr(),
      rows: [
        SettingsRow(
          icon: LucideIcons.helpCircle,
          tint: tint,
          title: 'drawer.helpCenter'.tr(),
          subtitle: 'settings.helpCenterHint'.tr(),
          onTap: () => _push(context, const HelpCenterScreen()),
        ),
        SettingsRow(
          icon: LucideIcons.mail,
          tint: tint,
          title: 'drawer.contactUs'.tr(),
          onTap: () => _push(context, const ContactScreen()),
        ),
        SettingsRow(
          icon: LucideIcons.fileText,
          tint: tint,
          title: 'settings.terms'.tr(),
          onTap: () => _openSupportPage(context, 'terms-of-service'),
        ),
        SettingsRow(
          icon: LucideIcons.shield,
          tint: tint,
          title: 'settings.privacy'.tr(),
          onTap: () => _openSupportPage(context, 'privacy-policy'),
        ),
        FutureBuilder<String>(
          future: _version(),
          builder: (context, snapshot) => SettingsRow(
            icon: LucideIcons.info,
            tint: tint,
            title: 'settings.about'.tr(),
            subtitle: snapshot.data,
          ),
        ),
      ],
    );
  }
}

class _AccountActions extends StatelessWidget {
  const _AccountActions();

  Future<void> _signOut(BuildContext context) async {
    final auth = context.read<AuthProvider>();
    final navigator = Navigator.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('auth.signOut'.tr()),
        content: Text('settings.signOutConfirm'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('common.cancel'.tr()),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('auth.signOut'.tr()),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await auth.logout();
    navigator.popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return SettingsCard(
      rows: [
        SettingsRow(
          icon: LucideIcons.logOut,
          tint: AppTokens.inkFaint,
          title: 'auth.signOut'.tr(),
          onTap: () => _signOut(context),
        ),
        SettingsRow(
          icon: LucideIcons.trash2,
          tint: AppTokens.danger,
          title: 'settings.deleteAccount'.tr(),
          subtitle: 'settings.deleteAccountHint'.tr(),
          danger: true,
          onTap: () => _push(context, const DeleteAccountScreen()),
        ),
      ],
    );
  }
}
