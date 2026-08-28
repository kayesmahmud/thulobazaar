import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'tokens.dart';
import 'mock.dart';

/// "Brand Canvas" — one rose band drawn identically at the top of every auth
/// surface, with a white sheet rising over it to hold the form.
///
/// The band is the constant; the sheet is the variable. It collapses to 132dp
/// instead of scrolling away when the keyboard opens, so rose stays on screen
/// while the user types.
class AuthShell extends StatelessWidget {
  final String title, subtitle;
  final List<Widget> children;
  final int? step, totalSteps;
  final bool canPop;

  const AuthShell({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
    this.step,
    this.totalSteps,
    this.canPop = true,
  });

  static const _band = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    // Everything past 0.58 of the diagonal is at or darker than #E11D48
    // (4.70:1 on white), which is exactly where the subhead sits.
    colors: [Color(0xFFDC143C), Color(0xFFB8102F)],
    stops: [0.0, 1.0],
  );

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.viewPaddingOf(context).top;
    final keyboard = MediaQuery.viewInsetsOf(context).bottom > 0;
    final bandHeight = keyboard ? 132.0 : 212.0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            height: bandHeight + top,
            decoration: const BoxDecoration(gradient: _band),
            child: Stack(
              children: [
                // Two radial blooms. No BackdropFilter anywhere: Impeller is
                // disabled in the real app, and blur on Skia costs 6-14ms/frame.
                Positioned(
                  top: -96, right: -84,
                  child: _bloom(300, 0.18),
                ),
                Positioned(
                  bottom: -60, left: -70,
                  child: _bloom(220, 0.08),
                ),
                Padding(
                  padding: EdgeInsets.only(top: top + 4, left: T.gutter, right: T.gutter),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        height: 48,
                        child: canPop
                            ? Align(
                                alignment: Alignment.centerLeft,
                                child: IconButton(
                                  icon: const Icon(LucideIcons.arrowLeft,
                                      color: Colors.white, size: 22),
                                  onPressed: () => Navigator.maybePop(context),
                                ),
                              )
                            : null,
                      ),
                      if (!keyboard) ...[
                        const SizedBox(height: 12),
                        Image.asset('assets/images/logo_white.png',
                            height: 24,
                            fit: BoxFit.contain,
                            errorBuilder: (c, e, st) => Text('THULO BAZAAR',
                                style: T.ctaLabel().copyWith(
                                    fontSize: 17, letterSpacing: 0.5))),
                        const SizedBox(height: 18),
                      ],
                      Text(title, style: T.headline(false).copyWith(fontSize: 26)),
                      if (!keyboard) ...[
                        const SizedBox(height: 6),
                        Text(subtitle, style: T.subhead(false)),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          // The sheet: 28dp top radius carving the band.
          Padding(
            padding: EdgeInsets.only(top: bandHeight + top - 28),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(T.rSheet)),
              ),
              child: SafeArea(
                top: false,
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(T.gutter, 24, T.gutter,
                      24 + MediaQuery.viewInsetsOf(context).bottom),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (step != null) _stepRail(),
                      ...children,
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bloom(double size, double alpha) => IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [
              Colors.white.withValues(alpha: alpha),
              Colors.white.withValues(alpha: 0),
            ]),
          ),
        ),
      );

  Widget _stepRail() => Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: Row(
          children: [
            for (int i = 1; i <= totalSteps!; i++) ...[
              Expanded(
                child: Container(
                  height: 4,
                  decoration: BoxDecoration(
                    color: i <= step! ? T.brand : T.hairline,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              if (i < totalSteps!) const SizedBox(width: 6),
            ],
          ],
        ),
      );
}

/// Field with a real focus state — the current app's phone field never changes
/// its border when you type in it.
class AuthField extends StatefulWidget {
  final String label, hint;
  final String? prefix, error;
  final bool obscure;
  final IconData? icon;
  const AuthField({
    super.key,
    required this.label,
    required this.hint,
    this.prefix,
    this.error,
    this.obscure = false,
    this.icon,
  });

  @override
  State<AuthField> createState() => _AuthFieldState();
}

class _AuthFieldState extends State<AuthField> {
  final _node = FocusNode();
  bool _hidden = true;

  @override
  void initState() {
    super.initState();
    _node.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _node.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final focused = _node.hasFocus;
    final bad = widget.error != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label,
            style: T.benefitSub(false)
                .copyWith(fontWeight: FontWeight.w600, color: T.inkMuted)),
        const SizedBox(height: 6),
        AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          decoration: BoxDecoration(
            color: focused ? Colors.white : const Color(0xFFFDF7F8),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: bad
                  ? const Color(0xFFDC2626)
                  : focused
                      ? T.brand
                      : const Color(0xFFF3E4E7),
              width: focused || bad ? 1.6 : 1,
            ),
          ),
          child: Row(
            children: [
              if (widget.prefix != null)
                Padding(
                  padding: const EdgeInsets.only(left: 14),
                  child: Text(widget.prefix!,
                      style: T.benefit(false).copyWith(color: T.inkMuted)),
                ),
              if (widget.icon != null)
                Padding(
                  padding: const EdgeInsets.only(left: 14),
                  child: Icon(widget.icon, size: 19, color: T.inkFaint),
                ),
              Expanded(
                child: TextField(
                  focusNode: _node,
                  obscureText: widget.obscure && _hidden,
                  style: T.benefit(false),
                  decoration: InputDecoration(
                    hintText: widget.hint,
                    hintStyle: T.benefit(false).copyWith(color: const Color(0xFF9CA3AF)),
                    border: InputBorder.none,
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                  ),
                ),
              ),
              if (widget.obscure)
                IconButton(
                  icon: Icon(_hidden ? LucideIcons.eye : LucideIcons.eyeOff,
                      size: 19, color: T.inkFaint),
                  onPressed: () => setState(() => _hidden = !_hidden),
                ),
            ],
          ),
        ),
        if (bad) ...[
          const SizedBox(height: 6),
          Row(children: [
            const Icon(LucideIcons.alertCircle, size: 14, color: Color(0xFFDC2626)),
            const SizedBox(width: 6),
            Text(widget.error!,
                style: T.benefitSub(false).copyWith(color: const Color(0xFFDC2626))),
          ]),
        ],
      ],
    );
  }
}

Widget authButton(String label, VoidCallback onTap, {bool filled = true}) =>
    SizedBox(
      height: 52,
      child: filled
          ? FilledButton(
              onPressed: onTap,
              style: FilledButton.styleFrom(
                backgroundColor: T.brandDeep,
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(label, style: T.ctaLabel()),
            )
          : OutlinedButton(
              onPressed: onTap,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: T.hairline),
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(label,
                  style: T.ctaLabel().copyWith(color: T.ink)),
            ),
    );

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    void fakeSignIn(Persona p) {
      session.signIn(p);
      Navigator.popUntil(context, (r) => r.isFirst);
    }

    return AuthShell(
      title: 'Welcome back',
      subtitle: 'Sign in to buy and sell across Nepal.',
      children: [
        const AuthField(
            label: 'Phone number', hint: '98XXXXXXXX', prefix: '+977'),
        const SizedBox(height: 16),
        const AuthField(
            label: 'Password', hint: 'Your password', obscure: true),
        const SizedBox(height: 10),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
            child: Text('Forgot password?', style: T.secondary()),
          ),
        ),
        const SizedBox(height: 6),
        authButton('Sign in', () => fakeSignIn(Persona.seller)),
        const SizedBox(height: 20),
        Row(children: [
          const Expanded(child: Divider(color: T.hairline)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text('or', style: T.benefitSub(false)),
          ),
          const Expanded(child: Divider(color: T.hairline)),
        ]),
        const SizedBox(height: 20),
        authButton('Continue with Google', () => fakeSignIn(Persona.buyer),
            filled: false),
        const SizedBox(height: 20),
        // Prototype affordance — not part of the real design.
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(T.rTile),
            border: Border.all(color: T.hairline),
          ),
          child: Column(children: [
            Text('PROTOTYPE — sign in as',
                style: T.trustChip().copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              _persona('🧕 Buyer (no phone)', () => fakeSignIn(Persona.buyer)),
              _persona('🧑 Seller', () => fakeSignIn(Persona.seller)),
              _persona('🏪 Business', () => fakeSignIn(Persona.business)),
            ]),
          ]),
        ),
        const SizedBox(height: 16),
        Center(
          child: TextButton(
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const SignUpScreen())),
            child: Text('New here? Create an account', style: T.secondary()),
          ),
        ),
      ],
    );
  }

  Widget _persona(String label, VoidCallback onTap) => ActionChip(
        label: Text(label, style: T.trustChip()),
        onPressed: onTap,
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
          side: const BorderSide(color: T.hairline),
        ),
      );
}

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});
  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  int _step = 1;

  @override
  Widget build(BuildContext context) {
    switch (_step) {
      case 1:
        return AuthShell(
          title: "What's your number?",
          subtitle: "We'll text you a code to confirm it.",
          step: 1,
          totalSteps: 3,
          children: [
            const AuthField(
                label: 'Phone number', hint: '98XXXXXXXX', prefix: '+977'),
            const SizedBox(height: 20),
            authButton('Send code', () => setState(() => _step = 2)),
            const SizedBox(height: 14),
            Text(
              'Your number is never shown on your ads. Buyers message you inside the app.',
              textAlign: TextAlign.center,
              style: T.benefitSub(false),
            ),
          ],
        );
      case 2:
        return AuthShell(
          title: 'Enter the code',
          subtitle: 'Sent to +977 98•• ••• 118.',
          step: 2,
          totalSteps: 3,
          children: [
            const AuthField(
                label: 'Six-digit code', hint: '• • • • • •', icon: LucideIcons.hash),
            const SizedBox(height: 14),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('Resend in 0:42  ', style: T.benefitSub(false)),
              Text('Change number', style: T.secondary().copyWith(fontSize: 13)),
            ]),
            const SizedBox(height: 20),
            authButton('Verify', () => setState(() => _step = 3)),
          ],
        );
      default:
        return AuthShell(
          title: 'Almost there',
          subtitle: 'Just a name and a password.',
          step: 3,
          totalSteps: 3,
          canPop: false,
          children: [
            const AuthField(
                label: 'Full name', hint: 'e.g. Bikash Thapa', icon: LucideIcons.user),
            const SizedBox(height: 16),
            const AuthField(
                label: 'Password',
                hint: 'At least 8 characters',
                obscure: true),
            const SizedBox(height: 20),
            authButton('Create my account', () {
              session.signIn(Persona.seller);
              Navigator.popUntil(context, (r) => r.isFirst);
            }),
            const SizedBox(height: 14),
            Text('By continuing you agree to our Terms and Privacy Policy.',
                textAlign: TextAlign.center, style: T.benefitSub(false)),
          ],
        );
    }
  }
}

class ForgotPasswordScreen extends StatelessWidget {
  const ForgotPasswordScreen({super.key});
  @override
  Widget build(BuildContext context) => AuthShell(
        title: 'Reset your password',
        subtitle: "We'll text a code to your number.",
        step: 1,
        totalSteps: 3,
        children: [
          const AuthField(
              label: 'Phone number', hint: '98XXXXXXXX', prefix: '+977'),
          const SizedBox(height: 20),
          authButton('Send reset code', () => Navigator.pop(context)),
        ],
      );
}

class TwoFactorScreen extends StatelessWidget {
  const TwoFactorScreen({super.key});
  @override
  Widget build(BuildContext context) => AuthShell(
        title: 'Two-step verification',
        subtitle: 'Open your authenticator app.',
        step: 2,
        totalSteps: 2,
        children: [
          const AuthField(
              label: 'Six-digit code', hint: '• • • • • •', icon: LucideIcons.shieldCheck),
          const SizedBox(height: 20),
          authButton('Verify and sign in', () {
            session.signIn(Persona.seller);
            Navigator.popUntil(context, (r) => r.isFirst);
          }),
          const SizedBox(height: 14),
          Center(
              child: Text('Use a backup code instead', style: T.secondary())),
        ],
      );
}
