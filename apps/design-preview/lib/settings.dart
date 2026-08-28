import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'mock.dart';
import 'tokens.dart';

/// The Settings screen that does not exist in the live app.
///
/// Tinted BY GROUP, not by row — one hue per card. A second colour appears only
/// where a row carries genuine state (phone verified/not, 2FA on/off, delete).
/// Utility rows get a neutral slate badge.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  // Official palette only: brand rose, the green "success" cue, neutral grey.
  // No violet, no indigo — those were invented.
  static const _violet = Brand.rose;        // Account
  static const _indigo = Brand.ink;          // Sign-in & security
  static const _emerald = Brand.greenInk;   // Preferences
  static const _slate = Color(0xFF6B7280);  // Help & about (neutral)

  @override
  Widget build(BuildContext context) {
    final u = session.user;
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: Text('Settings',
            style: T.benefit(false)
                .copyWith(fontSize: 18, fontWeight: FontWeight.w800)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          _header('Account'),
          _card([
            _row(_violet, LucideIcons.user, 'Personal information',
                'Name, photo, bio'),
            _row(_violet, LucideIcons.phone, 'Phone number',
                u.phone ?? 'Not added',
                chip: u.phoneVerified
                    ? const _Chip('Verified', Color(0xFF059669))
                    : const _Chip('Not verified', Color(0xFFD97706))),
            _row(_violet, LucideIcons.mail, 'Email address',
                u.email ?? 'Not added',
                // Deliberately inert: there is no change-email endpoint
                // anywhere in the API. Shown honestly rather than with a
                // chevron that goes nowhere.
                sub2: 'Contact support to change', inert: true),
            _row(_violet, LucideIcons.badgeCheck, 'Verification',
                u.businessVerified
                    ? 'Business verified'
                    : u.idVerified
                        ? 'Individual verified'
                        : 'Not verified'),
            _row(_violet, LucideIcons.creditCard, 'Payments & billing',
                'Your purchases and invoices'),
          ]),
          _header('Sign-in & security'),
          _card([
            _row(_indigo, LucideIcons.lock, 'Password',
                u.email != null && u.phone == null
                    ? 'Signed in with Google'
                    : 'Last changed 3 months ago',
                inert: u.email != null && u.phone == null),
            _row(_indigo, LucideIcons.shieldCheck, 'Two-factor authentication',
                'Extra code at sign-in',
                chip: const _Chip('Off', Color(0xFF64748B))),
          ]),
          _header('Preferences'),
          _card([
            _switchRow(_emerald, LucideIcons.bell, 'Push notifications',
                'Messages, offers and ad updates'),
            _row(_emerald, LucideIcons.history, 'Clear search history',
                'Stored only on this phone'),
          ]),
          _header('Help & about'),
          _card([
            _row(_slate, LucideIcons.helpCircle, 'Help center', 'FAQ and guides'),
            _row(_slate, LucideIcons.mail, 'Contact us', ''),
            _row(_slate, LucideIcons.fileText, 'Terms & privacy policy', ''),
            _row(_slate, LucideIcons.info, 'About Thulo Bazaar',
                'Version 1.3.1 (25)'),
          ]),
          const SizedBox(height: 24),
          _card([
            _row(_slate, LucideIcons.logOut, 'Sign out', ''),
            _row(const Color(0xFFBE123C), LucideIcons.trash2, 'Delete account',
                'Recoverable for 30 days',
                danger: true),
          ]),
        ],
      ),
    );
  }

  Widget _header(String t) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 22, 4, 10),
        child: Text(t,
            style: T.benefit(false)
                .copyWith(fontSize: 13.5, color: T.inkFaint, fontWeight: FontWeight.w700)),
      );

  Widget _card(List<Widget> rows) => Container(
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(T.rCard),
            border: Border.all(color: T.hairline)),
        child: Column(children: [
          for (int i = 0; i < rows.length; i++) ...[
            if (i > 0)
              const Padding(
                padding: EdgeInsets.only(left: 66),
                child: Divider(height: 1, color: T.hairline),
              ),
            rows[i],
          ],
        ]),
      );

  Widget _row(Color tint, IconData icon, String title, String sub,
      {Widget? chip, String? sub2, bool inert = false, bool danger = false}) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
            color: tint.withValues(alpha: 0.11),
            borderRadius: BorderRadius.circular(T.rChip)),
        child: Icon(icon, size: 19, color: tint),
      ),
      title: Text(title,
          style: T.benefit(false).copyWith(
              fontSize: 15, color: danger ? const Color(0xFFBE123C) : T.ink)),
      subtitle: sub.isEmpty && sub2 == null
          ? null
          : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (sub.isNotEmpty) Text(sub, style: T.benefitSub(false)),
              if (sub2 != null)
                Text(sub2,
                    style: T.benefitSub(false)
                        .copyWith(fontSize: 12, fontStyle: FontStyle.italic)),
            ]),
      trailing: chip ??
          (inert
              ? null
              : const Icon(LucideIcons.chevronRight,
                  size: 18, color: T.inkFaint)),
      onTap: inert ? null : () {},
    );
  }

  Widget _switchRow(Color tint, IconData icon, String title, String sub) =>
      ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
              color: tint.withValues(alpha: 0.11),
              borderRadius: BorderRadius.circular(T.rChip)),
          child: Icon(icon, size: 19, color: tint),
        ),
        title: Text(title, style: T.benefit(false).copyWith(fontSize: 15)),
        subtitle: Text(sub, style: T.benefitSub(false)),
        trailing: Switch(value: true, activeThumbColor: T.brand, onChanged: (_) {}),
      );
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip(this.label, this.color);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(999)),
        child: Text(label,
            style: T.trustChip().copyWith(
                fontSize: 11, fontWeight: FontWeight.w700, color: color)),
      );
}
