import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Shared chrome for the four auth surfaces (sign in, sign up, forgot
/// password, 2FA).
///
/// Ported from the design-preview prototype, but re-authored rather than
/// copied: the prototype's widgets are display-only shells with no
/// controllers, non-nullable callbacks and a hardcoded back action, none of
/// which can carry the real screens' state.
class AuthT {
  // The logo colour. AppTheme.primary (#F43F5E) drifted from the mark and is
  // still what the other ~17 screens paint; auth and the login gates use the
  // real one. See the brand note in login_gate.dart.
  static const brand = Color(0xFFDC143C);
  static const brandDeep = Color(0xFFB8102F);

  static const ink = Color(0xFF111827);
  static const inkMuted = Color(0xFF4B5563);
  static const inkFaint = Color(0xFF6B7280);
  static const hairline = Color(0xFFE5E7EB);
  static const fieldRest = Color(0xFFFDF7F8);
  static const fieldBorder = Color(0xFFF3E4E7);
  static const danger = Color(0xFFDC2626);

  static const double gutter = 20;
  static const double bandOpen = 212;
  static const double bandTyping = 132;
  static const double sheetRadius = 28;

  // Every style carries an explicit height: Inter has no Devanagari coverage,
  // so Nepali falls back to a font with different ascent/descent metrics.
  static TextStyle headline(bool ne) => AppFont.inter(
    fontSize: ne ? 24 : 26,
    fontWeight: FontWeight.w800,
    letterSpacing: ne ? 0 : -0.4,
    height: ne ? 1.42 : 1.22,
    color: Colors.white,
  );

  static TextStyle subhead(bool ne) => AppFont.inter(
    fontSize: 15,
    fontWeight: FontWeight.w500,
    height: ne ? 1.60 : 1.45,
    color: Colors.white.withValues(alpha: 0.86),
  );

  static TextStyle body(bool ne) => AppFont.inter(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    height: ne ? 1.52 : 1.35,
    color: ink,
  );

  static TextStyle label(bool ne) => AppFont.inter(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    height: ne ? 1.62 : 1.45,
    color: inkMuted,
  );

  static TextStyle caption(bool ne) => AppFont.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: ne ? 1.62 : 1.45,
    color: inkFaint,
  );

  static TextStyle cta() => AppFont.inter(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.1,
    height: 1.20,
    color: Colors.white,
  );

  static TextStyle link() => AppFont.inter(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.30,
    color: brandDeep,
  );
}

/// One brand band drawn identically at the top of every auth surface, with a
/// white sheet rising over it to hold the form.
///
/// The band collapses to 132dp instead of scrolling away when the keyboard
/// opens, so the brand stays on screen while the user types.
class AuthShell extends StatelessWidget {
  final String title, subtitle;
  final List<Widget> children;
  final int? step, totalSteps;

  /// Null hides the back button. Sign-up passes its own handler because its
  /// back must step the flow (`_handleChangeNumber`), not pop the route.
  final VoidCallback? onBack;

  const AuthShell({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
    this.onBack,
    this.step,
    this.totalSteps,
  });

  static const _band = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AuthT.brand, AuthT.brandDeep],
  );

  @override
  Widget build(BuildContext context) {
    final ne = context.locale.languageCode == 'ne';
    final top = MediaQuery.viewPaddingOf(context).top;
    final inset = MediaQuery.viewInsetsOf(context).bottom;
    final typing = inset > 0;
    final band = (typing ? AuthT.bandTyping : AuthT.bandOpen) + top;

    // resizeToAvoidBottomInset MUST stay false: Scaffold zeroes viewInsets for
    // its body when it is true (scaffold.dart, removeBottomInset), which would
    // make `typing` above permanently false and the band would never collapse.
    // The scroll padding below carries the inset instead.
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: false,
      // StackFit.expand + every child positioned: a loose Stack sizes itself to
      // its tallest NON-positioned child, so an unpositioned band would cap the
      // stack at ~253dp and leave the sheet below it 28dp tall with its whole
      // form overflowing out of view.
      body: Stack(
        fit: StackFit.expand,
        children: [
          AnimatedPositioned(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            top: 0,
            left: 0,
            right: 0,
            height: band,
            child: Container(
              decoration: const BoxDecoration(gradient: _band),
              child: Stack(
                children: [
                  // Two radial blooms. No BackdropFilter anywhere: Impeller is
                  // disabled in this app and blur on Skia costs 6-14ms/frame.
                  Positioned(top: -96, right: -84, child: _bloom(300, 0.18)),
                  Positioned(bottom: -60, left: -70, child: _bloom(220, 0.08)),
                  Padding(
                    padding: EdgeInsets.only(
                      top: top + 4,
                      left: AuthT.gutter,
                      right: AuthT.gutter,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          height: 48,
                          child: onBack == null
                              ? null
                              : Align(
                                  alignment: Alignment.centerLeft,
                                  child: IconButton(
                                    icon: const Icon(
                                      LucideIcons.arrowLeft,
                                      color: Colors.white,
                                      size: 22,
                                    ),
                                    onPressed: onBack,
                                  ),
                                ),
                        ),
                        if (!typing) const SizedBox(height: 18),
                        Text(title, style: AuthT.headline(ne)),
                        if (!typing) ...[
                          const SizedBox(height: 6),
                          Text(subtitle, style: AuthT.subhead(ne)),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Positioned, not Padding: a loose Stack child wrapping a scroll view
          // shrink-wraps to its content, which would leave the band showing
          // below short forms.
          AnimatedPositioned(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            top: band - AuthT.sheetRadius,
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              // Without a clip the scroll view's content paints outside the
              // rounded decoration and rides up over the band as you scroll.
              clipBehavior: Clip.antiAlias,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(AuthT.sheetRadius),
                ),
              ),
              child: SafeArea(
                top: false,
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(
                    AuthT.gutter,
                    24,
                    AuthT.gutter,
                    24 + inset,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (step != null && totalSteps != null) _stepRail(),
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
        gradient: RadialGradient(
          colors: [
            Colors.white.withValues(alpha: alpha),
            Colors.white.withValues(alpha: 0),
          ],
        ),
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
                color: i <= step! ? AuthT.brand : AuthT.hairline,
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

/// Text field with a real focus state — the old phone field never changed its
/// border when you typed in it.
///
/// Unlike the prototype's version this takes the screen's own controller and
/// every input constraint the real forms rely on.
class AuthField extends StatefulWidget {
  final TextEditingController controller;
  final String label, hint;

  /// A widget, not a string: the phone prefix is `+९७७` in Nepali and is
  /// styled separately from the input text.
  final Widget? prefix;
  final String? error;
  final bool obscure;
  final bool enabled;
  final IconData? icon;
  final TextInputType? keyboardType;
  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final TextCapitalization textCapitalization;
  final TextAlign textAlign;

  /// Override for the input text itself — the OTP box wants big, tracked-out
  /// digits rather than body copy.
  final TextStyle? style;

  const AuthField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    this.prefix,
    this.error,
    this.obscure = false,
    this.enabled = true,
    this.icon,
    this.keyboardType,
    this.maxLength,
    this.inputFormatters,
    this.onChanged,
    this.textCapitalization = TextCapitalization.none,
    this.textAlign = TextAlign.start,
    this.style,
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
    final ne = context.locale.languageCode == 'ne';
    final focused = _node.hasFocus;
    final bad = widget.error != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: AuthT.label(ne)),
        const SizedBox(height: 6),
        AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          decoration: BoxDecoration(
            color: widget.enabled
                ? (focused ? Colors.white : AuthT.fieldRest)
                : const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: bad
                  ? AuthT.danger
                  : focused
                  ? AuthT.brand
                  : AuthT.fieldBorder,
              width: focused || bad ? 1.6 : 1,
            ),
          ),
          child: Row(
            children: [
              if (widget.prefix != null)
                Padding(
                  padding: const EdgeInsets.only(left: 14),
                  child: DefaultTextStyle(
                    style: AuthT.body(ne).copyWith(color: AuthT.inkMuted),
                    child: widget.prefix!,
                  ),
                ),
              if (widget.icon != null)
                Padding(
                  padding: const EdgeInsets.only(left: 14),
                  child: Icon(widget.icon, size: 19, color: AuthT.inkFaint),
                ),
              Expanded(
                child: TextField(
                  controller: widget.controller,
                  focusNode: _node,
                  enabled: widget.enabled,
                  obscureText: widget.obscure && _hidden,
                  keyboardType: widget.keyboardType,
                  maxLength: widget.maxLength,
                  inputFormatters: widget.inputFormatters,
                  onChanged: widget.onChanged,
                  textCapitalization: widget.textCapitalization,
                  textAlign: widget.textAlign,
                  style: widget.style ?? AuthT.body(ne),
                  decoration: InputDecoration(
                    // AppTheme's inputDecorationTheme is `filled: true` with a
                    // grey fill, which paints over the container above and
                    // leaves a seam beside the prefix and the eye button.
                    filled: false,
                    counterText: '',
                    hintText: widget.hint,
                    hintStyle: AuthT.body(
                      ne,
                    ).copyWith(color: const Color(0xFF9CA3AF)),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 16,
                    ),
                  ),
                ),
              ),
              if (widget.obscure)
                IconButton(
                  icon: AnimatedRotation(
                    turns: _hidden ? 0 : 0.5,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      _hidden ? LucideIcons.eye : LucideIcons.eyeOff,
                      size: 19,
                      color: AuthT.inkFaint,
                    ),
                  ),
                  onPressed: () => setState(() => _hidden = !_hidden),
                ),
            ],
          ),
        ),
        if (bad) ...[
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(
                LucideIcons.alertCircle,
                size: 14,
                color: AuthT.danger,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  widget.error!,
                  style: AuthT.caption(ne).copyWith(color: AuthT.danger),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

/// [onTap] is nullable so callers can express `_isLoading ? null : _handle…`;
/// the prototype's non-nullable version could not disable itself, which is
/// what stops a double submit.
Widget authButton({
  required String label,
  required VoidCallback? onTap,
  bool filled = true,
  bool loading = false,
  Color fill = AuthT.brand,
}) => SizedBox(
  height: 52,
  child: filled
      ? FilledButton(
          onPressed: loading ? null : onTap,
          style: FilledButton.styleFrom(
            backgroundColor: fill,
            disabledBackgroundColor: fill.withValues(alpha: 0.45),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: loading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(label, style: AuthT.cta()),
        )
      : OutlinedButton(
          onPressed: loading ? null : onTap,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AuthT.hairline),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: Text(label, style: AuthT.cta().copyWith(color: AuthT.ink)),
        ),
);

/// "or sign in with phone" style separator.
Widget authDivider(String label, bool ne) => Row(
  children: [
    const Expanded(child: Divider(color: AuthT.hairline)),
    Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Text(label, style: AuthT.caption(ne)),
    ),
    const Expanded(child: Divider(color: AuthT.hairline)),
  ],
);

/// Google button. Google's brand guidelines fix the mark, the label and the
/// neutral chrome, so this is deliberately not brand-coloured.
Widget googleButton({required String label, required VoidCallback? onTap}) =>
    Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFDADCE0)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SvgPicture.asset(
                'assets/images/google_logo.svg',
                width: 18,
                height: 18,
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: AppFont.roboto(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF3C4043),
                  letterSpacing: 0.25,
                ),
              ),
            ],
          ),
        ),
      ),
    );
