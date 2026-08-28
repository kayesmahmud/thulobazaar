import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'tokens.dart';

/// "Bazaar Awning" — the shared login-gate shell.
///
/// THE ONE RULE: everything between the top of the display and the headline is
/// a fixed-height block containing no text, so the headline lands at the same y
/// on every gated screen regardless of what the host Scaffold looks like.
///
///   headlineTop = viewPadding.top + 56 + 8 + medallion + gap
///               = viewPadding.top + 166   (regular)
///               = viewPadding.top + 146   (compact)
///
/// There is no Center, no MainAxisAlignment.center, no Spacer and no
/// IntrinsicHeight anywhere in this widget. The gate owns its own Scaffold and
/// renders exactly one transparent 56dp bar with no title and no actions, so no
/// string can ever change the height above the headline.
class GateBenefit {
  final IconData icon;
  final String label;
  const GateBenefit(this.icon, this.label);
}

class GateTier {
  final String badge, title, requirement, detail, outcome;
  final Color color;
  const GateTier({
    required this.badge,
    required this.title,
    required this.requirement,
    required this.detail,
    required this.outcome,
    required this.color,
  });
}

class GateScaffold extends StatelessWidget {
  final GateAccent accent;
  final IconData icon;
  final String headline, subhead, cta, secondary;
  final List<GateBenefit> benefits;
  final List<GateTier> tiers;
  final Widget? proof;
  final bool showBottomNav;
  final VoidCallback onCta;
  final VoidCallback onSecondary;

  const GateScaffold({
    super.key,
    required this.accent,
    required this.icon,
    required this.headline,
    required this.subhead,
    required this.cta,
    required this.secondary,
    required this.onCta,
    required this.onSecondary,
    this.benefits = const [],
    this.tiers = const [],
    this.proof,
    this.showBottomNav = false,
  });

  @override
  Widget build(BuildContext context) {
    // Compact is read from DEVICE height, never from LayoutBuilder constraints:
    // the Messages tab viewport is ~56dp shorter than a pushed route on the very
    // same phone, and a viewport-derived switch would put those two headlines
    // 20dp apart — reintroducing the exact bug this design exists to fix.
    final compact = MediaQuery.sizeOf(context).height < T.compactBelow;
    final medallion = compact ? T.medallionCompact : T.medallion;
    final gap = compact ? T.medallionGapCompact : T.medallionGap;
    final pad = compact ? T.cardPadCompact : T.cardPad;
    final overlap = compact ? 20.0 : 28.0;
    final top = MediaQuery.viewPaddingOf(context).top;

    return Scaffold(
      backgroundColor: Colors.white,
      // Body origin becomes the physical top of the display on EVERY host, so
      // the awning paints under the status bar and +166 is measured from one
      // origin everywhere.
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
                      _awning(context, top, medallion, gap),
                      Transform.translate(
                        offset: Offset(0, -overlap),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: T.gutter),
                          child: _card(pad),
                        ),
                      ),
                      SizedBox(height: overlap + 8),
                    ],
                  ),
                ),
              ),
            ),
          ),
          _dock(context),
        ],
      ),
      bottomNavigationBar: showBottomNav ? _fakeBottomNav() : null,
    );
  }

  Widget _awning(BuildContext context, double top, double medallion, double gap) {
    return Container(
      padding: EdgeInsets.only(
        top: top + T.toolbar + T.awningTopPad,
        left: T.gutter,
        right: T.gutter,
        bottom: 44,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [accent.deepTop, accent.deep],
        ),
      ),
      child: Column(
        children: [
          // Fixed-height, text-free: this is what holds the anchor.
          Container(
            width: medallion,
            height: medallion,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(T.rMedallion),
              border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
            ),
            child: Icon(icon, size: medallion * 0.45, color: Colors.white),
          ),
          SizedBox(height: gap),
          // ---- ANCHOR: this text starts at exactly viewPadding.top + 166 ----
          Text(headline, textAlign: TextAlign.center, style: T.headline(false)),
          const SizedBox(height: 8),
          Text(subhead, textAlign: TextAlign.center, style: T.subhead(false)),
        ],
      ),
    );
  }

  Widget _card(double pad) {
    return Container(
      padding: EdgeInsets.all(pad),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(T.rCard),
        border: Border.all(color: T.hairline),
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
          for (final t in tiers) ...[_tier(t), const SizedBox(height: 12)],
          for (int i = 0; i < benefits.length; i++) ...[
            if (i > 0) const SizedBox(height: 16),
            _benefitRow(benefits[i]),
          ],
          if (proof != null) ...[
            const SizedBox(height: 12),
            const _Hairline(),
            const SizedBox(height: 12),
            proof!,
          ],
        ],
      ),
    );
  }

  Widget _tier(GateTier t) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: t.color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(T.rTile),
        border: Border.all(color: t.color.withValues(alpha: 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(t.badge, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Text(t.title, style: T.tierTitle().copyWith(color: t.color)),
            ],
          ),
          const SizedBox(height: 8),
          Text(t.requirement, style: T.tierMeta()),
          Text(t.detail, style: T.tierBullet()),
          const SizedBox(height: 6),
          Text('→ ${t.outcome}',
              style: T.tierBullet().copyWith(
                  color: t.color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _benefitRow(GateBenefit b) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: accent.deep.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(T.rChip),
          ),
          child: Icon(b.icon, size: 19, color: accent.inkTone),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [Text(b.label, style: T.benefit(false))],
          ),
        ),
      ],
    );
  }

  Widget _dock(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          T.gutter, 12, T.gutter,
          20 + (showBottomNav ? 0 : MediaQuery.viewPaddingOf(context).bottom)),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: T.hairline)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 52,
            // The CTA is brand rose on EVERY gate: the awning carries context,
            // the button carries action. One colour means one meaning.
            child: FilledButton(
              onPressed: onCta,
              style: FilledButton.styleFrom(
                backgroundColor: T.brandDeep,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(cta, style: T.ctaLabel()),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: onSecondary,
            child: Text(secondary, style: T.secondary()),
          ),
        ],
      ),
    );
  }

  Widget _fakeBottomNav() {
    return SafeArea(
      top: false,
      child: Container(
        height: 62,
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: T.hairline)),
        ),
        child: const Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Icon(Icons.home_outlined, color: T.inkFaint),
          Icon(Icons.search, color: T.inkFaint),
          Icon(Icons.add_circle, color: T.brand, size: 34),
          Icon(Icons.chat_bubble_outline, color: T.inkFaint),
            Icon(Icons.person_outline, color: T.inkFaint),
          ],
        ),
      ),
    );
  }
}

class _Hairline extends StatelessWidget {
  const _Hairline();
  @override
  Widget build(BuildContext context) => Container(height: 1, color: T.hairline);
}
