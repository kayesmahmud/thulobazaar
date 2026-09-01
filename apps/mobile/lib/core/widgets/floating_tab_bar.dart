import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:mobile/core/theme/app_font.dart';

/// One tab of the [FloatingTabBar].
class FloatingTabItem {
  final Widget icon;
  final String label;
  final String semanticLabel;
  const FloatingTabItem({
    required this.icon,
    required this.label,
    String? semanticLabel,
  }) : semanticLabel = semanticLabel ?? label;
}

/// The floating "pill" navigation bar: four tabs around a centre Post button,
/// hovering over the feed with a rounded outline. While the user scrolls
/// down it shrinks ([compact] true); when they stop or scroll up it grows
/// back with a small overshoot.
///
/// Blur is iOS-only. Measured on a Redmi (Skia, 120 Hz), a BackdropFilter
/// under this bar added ~8 ms to every frame and cut the frame count by a
/// third; iPhone renders it through Metal where it is cheap. Android gets the
/// same pill with a near-opaque tint instead.
///
/// The widget always reports the SAME height to its parent, so a Scaffold
/// with `extendBody: true` does not re-lay out the body on every frame of
/// the shrink animation; only the pill inside moves.
class FloatingTabBar extends StatelessWidget {
  final List<FloatingTabItem> items;
  final int currentIndex;
  final ValueChanged<int> onTap;
  final VoidCallback onPost;

  /// Screen-reader name of the centre button, e.g. "Post free ad".
  final String postLabel;
  final bool compact;

  const FloatingTabBar({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onTap,
    required this.onPost,
    required this.postLabel,
    this.compact = false,
  }) : assert(items.length == 4, 'the pill holds exactly four tabs');

  static const Color brand = Color(0xFFDC143C);
  static const Color _ink = Color(0xFF111827);
  static const Color _inactive = Color(0xFF6B7280);

  static const double expandedHeight = 66;
  static const double compactHeight = 50;
  static const double bottomGap = 14;

  /// Height reserved from the parent: constant, see class comment.
  static double reservedHeight(BuildContext context) =>
      expandedHeight + bottomGap + MediaQuery.paddingOf(context).bottom;

  static bool get _blurs => defaultTargetPlatform == TargetPlatform.iOS;

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final duration = reduceMotion
        ? Duration.zero
        : const Duration(milliseconds: 340);
    final height = compact ? compactHeight : expandedHeight;
    final side = compact ? 36.0 : 16.0;
    final radius = BorderRadius.circular(height / 2);

    final pill = Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: _blurs ? 0.55 : 0.94),
        borderRadius: radius,
        border: Border.all(color: Colors.white.withValues(alpha: 0.75)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _tab(0),
          _tab(1),
          _PostButton(
            compact: compact,
            duration: duration,
            onTap: onPost,
            label: postLabel,
          ),
          _tab(2),
          _tab(3),
        ],
      ),
    );

    final surface = _blurs
        ? ClipRRect(
            borderRadius: radius,
            child: BackdropFilter(
              filter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: pill,
            ),
          )
        : pill;

    return SizedBox(
      height: reservedHeight(context),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: AnimatedPadding(
          duration: duration,
          curve: Curves.easeOutBack,
          padding: EdgeInsets.fromLTRB(
            side,
            0,
            side,
            bottomGap + MediaQuery.paddingOf(context).bottom,
          ),
          child: AnimatedContainer(
            duration: duration,
            curve: Curves.easeOutBack,
            height: height,
            decoration: BoxDecoration(
              borderRadius: radius,
              boxShadow: [
                BoxShadow(
                  color: _ink.withValues(alpha: 0.18),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: RepaintBoundary(child: surface),
          ),
        ),
      ),
    );
  }

  Widget _tab(int index) {
    final item = items[index];
    final selected = index == currentIndex;
    final color = selected ? brand : _inactive;
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: item.semanticLabel,
        child: InkWell(
          onTap: () => onTap(index),
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            height: compact ? compactHeight : expandedHeight,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconTheme(
                  data: IconThemeData(color: color, size: compact ? 21 : 24),
                  child: item.icon,
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOut,
                  child: compact
                      ? const SizedBox.shrink()
                      : Padding(
                          padding: const EdgeInsets.only(top: 3),
                          child: Text(
                            item.label,
                            maxLines: 1,
                            softWrap: false,
                            overflow: TextOverflow.ellipsis,
                            style: AppFont.inter(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                              height: 1.3,
                              color: color,
                            ),
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

class _PostButton extends StatelessWidget {
  final bool compact;
  final Duration duration;
  final VoidCallback onTap;
  final String label;
  const _PostButton({
    required this.compact,
    required this.duration,
    required this.onTap,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final size = compact ? 38.0 : 50.0;
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: AnimatedContainer(
          duration: duration,
          curve: Curves.easeOutBack,
          width: size,
          height: size,
          margin: const EdgeInsets.symmetric(horizontal: 6),
          decoration: BoxDecoration(
            color: FloatingTabBar.brand,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: FloatingTabBar.brand.withValues(alpha: 0.38),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Icon(
            LucideIcons.plus,
            color: Colors.white,
            size: compact ? 20 : 26,
          ),
        ),
      ),
    );
  }
}
