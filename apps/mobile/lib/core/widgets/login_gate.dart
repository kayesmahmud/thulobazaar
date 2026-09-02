import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/features/auth/signin_screen.dart';
import 'package:mobile/features/auth/signup_screen.dart';

/// The signed-out state for every gated screen.
///
/// THE ONE RULE: everything between the top of the display and the headline is
/// a fixed-height block containing no text, so the headline lands at the same y
/// on every gated screen no matter what the host looks like.
///
///   headlineTop = viewPadding.top + 56 + 8 + medallion + gap
///               = viewPadding.top + 166  (regular) / + 146 (compact)
///
/// No Center, no MainAxisAlignment.center, no Spacer, no IntrinsicHeight —
/// those are what made the old LoginRequiredWidget land at four different
/// heights depending on which Scaffold happened to host it.
///
/// Brand colour is #DC143C: the logo, the app icon, and the single most
/// frequent colour in the live site's compiled CSS. NOT the #F43F5E that
/// globals.css and app_theme.dart declare.
enum LoginGateKind {
  postAd,
  verification,
  messages,
  profile,
  support,
  liveChat,
  notifications,
}

class _GateSpec {
  final IconData icon;
  final String titleKey, subtitleKey, ctaKey;
  final List<(IconData, String)> benefits;
  const _GateSpec(
    this.icon,
    this.titleKey,
    this.subtitleKey,
    this.ctaKey,
    this.benefits,
  );
}

const _specs = <LoginGateKind, _GateSpec>{
  LoginGateKind.postAd: _GateSpec(
    LucideIcons.plusCircle,
    'gate.postAd.title',
    'gate.postAd.subtitle',
    'gate.postAd.cta',
    [
      (LucideIcons.banknote, 'gate.postAd.b1'),
      (LucideIcons.sparkles, 'gate.postAd.b2'),
      (LucideIcons.mapPin, 'gate.postAd.b3'),
    ],
  ),
  LoginGateKind.verification: _GateSpec(
    LucideIcons.badgeCheck,
    'gate.verification.title',
    'gate.verification.subtitle',
    'gate.verification.cta',
    [
      (LucideIcons.shieldCheck, 'gate.verification.b1'),
      (LucideIcons.upload, 'gate.verification.b2'),
      (LucideIcons.clock, 'gate.verification.b3'),
    ],
  ),
  LoginGateKind.messages: _GateSpec(
    LucideIcons.messageCircle,
    'gate.messages.title',
    'gate.messages.subtitle',
    'gate.messages.cta',
    [
      (LucideIcons.users, 'gate.messages.b1'),
      (LucideIcons.image, 'gate.messages.b2'),
      (LucideIcons.bell, 'gate.messages.b3'),
    ],
  ),
  LoginGateKind.profile: _GateSpec(
    LucideIcons.userCircle,
    'gate.profile.title',
    'gate.profile.subtitle',
    'gate.profile.cta',
    [
      (LucideIcons.layoutList, 'gate.profile.b1'),
      (LucideIcons.badgeCheck, 'gate.profile.b2'),
      (LucideIcons.settings, 'gate.profile.b3'),
    ],
  ),
  LoginGateKind.support: _GateSpec(
    LucideIcons.lifeBuoy,
    'gate.support.title',
    'gate.support.subtitle',
    'gate.support.cta',
    [
      (LucideIcons.zap, 'gate.support.b1'),
      (LucideIcons.list, 'gate.support.b2'),
    ],
  ),
  LoginGateKind.liveChat: _GateSpec(
    LucideIcons.messagesSquare,
    'gate.liveChat.title',
    'gate.liveChat.subtitle',
    'gate.liveChat.cta',
    [
      (LucideIcons.zap, 'gate.liveChat.b1'),
      (LucideIcons.globe, 'gate.liveChat.b2'),
    ],
  ),
  LoginGateKind.notifications: _GateSpec(
    LucideIcons.bell,
    'gate.notifications.title',
    'gate.notifications.subtitle',
    'gate.notifications.cta',
    [
      (LucideIcons.messageCircle, 'gate.notifications.b1'),
      (LucideIcons.tag, 'gate.notifications.b2'),
    ],
  ),
};

class LoginGateScreen extends StatelessWidget {
  final LoginGateKind kind;

  /// Runs after sign-in or sign-up succeeds. Leave null to return to the
  /// screen that showed the gate — see [_returnToHost].
  final VoidCallback? onLoginSuccess;

  /// Pass the host's drawer when the gate replaces a screen that had one, so
  /// the hamburger keeps working.
  final Widget? drawer;

  const LoginGateScreen({
    super.key,
    required this.kind,
    this.onLoginSuccess,
    this.drawer,
  });

  // Brand — see class doc.
  static const _brand = Color(0xFFDC143C);
  static const _brandDeep = Color(0xFFB8102F);
  static const _ink = Color(0xFF111827);
  static const _inkFaint = Color(0xFF6B7280);
  static const _hairline = Color(0xFFE5E7EB);

  static const _toolbar = 56.0;
  static const _awningTopPad = 8.0;

  /// The primary CTA names the step and the goal ("Sign in to chat") and
  /// opens sign-in; the secondary link ("New here? Create a free account")
  /// opens sign-up. The old outcome-only labels ("Start chatting") opened the
  /// sign-up form, which read as a trick to anyone who already had an account.
  void _openSignIn(BuildContext context) {
    final onSuccess = onLoginSuccess ?? _returnToHost(context);
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => SignInScreen(onSuccess: onSuccess)),
    );
  }

  void _openSignUp(BuildContext context) {
    final onSuccess = onLoginSuccess ?? _returnToHost(context);
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => SignUpScreen(onSuccess: onSuccess)),
    );
  }

  /// Without a callback the auth screens rebuild the app on Home, so someone
  /// who tapped Chats and signed in landed on Home and had to tap Chats again.
  /// Instead, pop every auth route back to the screen that showed this gate:
  /// every host watches AuthProvider, so it re-renders signed in, exactly
  /// where the user was. Captures the NavigatorState and the host route, never
  /// the gate's context — the host rebuilds (and disposes the gate) the moment
  /// login succeeds.
  VoidCallback _returnToHost(BuildContext context) {
    final navigator = Navigator.of(context);
    final host = ModalRoute.of(context);
    return () => navigator.popUntil((route) => route == host || route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final spec = _specs[kind]!;
    final ne = context.locale.languageCode == 'ne';

    // Compact reads DEVICE height, never LayoutBuilder constraints: a tab
    // viewport is ~56dp shorter than a pushed route on the same phone, and a
    // viewport-derived switch would make two gates disagree by 20dp.
    final compact = MediaQuery.sizeOf(context).height < 700;
    final medallion = compact ? 68.0 : 84.0;
    final gap = compact ? 14.0 : 18.0;
    final pad = compact ? 14.0 : 18.0;
    final overlap = compact ? 20.0 : 28.0;
    final top = MediaQuery.viewPaddingOf(context).top;

    return Scaffold(
      backgroundColor: Colors.white,
      drawer: drawer,
      // Body origin becomes the physical top of the display on EVERY host, so
      // the anchor is measured from one origin everywhere.
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: Colors.white,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        title: null,
        actions: null,
      ),
      body: Column(
        children: [
          Expanded(
            child: LayoutBuilder(
              builder: (context, c) => SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: c.maxHeight),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _awning(spec, ne, top, medallion, gap),
                      Transform.translate(
                        offset: Offset(0, -overlap),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: _card(spec, ne, pad),
                        ),
                      ),
                      SizedBox(height: overlap + 8),
                    ],
                  ),
                ),
              ),
            ),
          ),
          _dock(context, spec, ne),
        ],
      ),
    );
  }

  Widget _awning(
    _GateSpec spec,
    bool ne,
    double top,
    double medallion,
    double gap,
  ) {
    return Container(
      padding: EdgeInsets.only(
        top: top + _toolbar + _awningTopPad,
        left: 20,
        right: 20,
        bottom: 44,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_brand, _brandDeep],
        ),
      ),
      child: Column(
        children: [
          // Fixed height, no text: this is what holds the anchor.
          Container(
            width: medallion,
            height: medallion,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
            ),
            child: Icon(spec.icon, size: medallion * 0.45, color: Colors.white),
          ),
          SizedBox(height: gap),
          // ---- ANCHOR ----
          Text(
            spec.titleKey.tr(),
            textAlign: TextAlign.center,
            style: AppFont.inter(
              fontSize: ne ? 24 : 26,
              fontWeight: FontWeight.w800,
              letterSpacing: ne ? 0 : -0.4,
              height: ne ? 1.42 : 1.22,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            spec.subtitleKey.tr(),
            textAlign: TextAlign.center,
            style: AppFont.inter(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              height: ne ? 1.60 : 1.45,
              color: Colors.white.withValues(alpha: 0.86),
            ),
          ),
        ],
      ),
    );
  }

  Widget _card(_GateSpec spec, bool ne, double pad) {
    return Container(
      padding: EdgeInsets.all(pad),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _hairline),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (int i = 0; i < spec.benefits.length; i++) ...[
            if (i > 0) const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: _brand.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Icon(spec.benefits[i].$1, size: 19, color: _brandDeep),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    spec.benefits[i].$2.tr(),
                    style: AppFont.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      height: ne ? 1.52 : 1.35,
                      color: _ink,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _dock(BuildContext context, _GateSpec spec, bool ne) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        20 + MediaQuery.paddingOf(context).bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: _hairline)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: () => _openSignIn(context),
              style: FilledButton.styleFrom(
                backgroundColor: _brand,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                spec.ctaKey.tr(),
                style: AppFont.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.1,
                  height: 1.20,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => _openSignUp(context),
            child: Text(
              'gate.newHere'.tr(),
              style: AppFont.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                height: 1.30,
                color: _brandDeep,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Unused today but kept so a future gate can show a muted footnote.
  static TextStyle footnote() =>
      AppFont.inter(fontSize: 12, height: 1.45, color: _inkFaint);
}
