import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// The one place the "glass" rule lives.
///
/// iOS renders through Metal, where a BackdropFilter is cheap: blur at once.
/// Android runs Skia here, where a surface-sized blur costs tens of
/// milliseconds per frame *while it moves*. So on Android the surface opens
/// as a plain tint, and only once it has settled ([settleDelay], just past a
/// drawer's slide) does it switch to blur. The content behind an open drawer
/// is static, so that blur is paid once, not per frame.
class GlassSurface extends StatefulWidget {
  final Widget child;
  final double sigma;
  final Color tint;
  final BorderRadius borderRadius;
  final Duration settleDelay;

  const GlassSurface({
    super.key,
    required this.child,
    this.sigma = 18,
    this.tint = const Color(0xB8FFFFFF),
    this.borderRadius = BorderRadius.zero,
    this.settleDelay = const Duration(milliseconds: 320),
  });

  static bool get blursImmediately =>
      defaultTargetPlatform == TargetPlatform.iOS;

  @override
  State<GlassSurface> createState() => _GlassSurfaceState();
}

class _GlassSurfaceState extends State<GlassSurface> {
  late bool _blur = GlassSurface.blursImmediately;
  Timer? _settle;

  @override
  void initState() {
    super.initState();
    if (!_blur) {
      _settle = Timer(widget.settleDelay, () {
        if (mounted) setState(() => _blur = true);
      });
    }
  }

  @override
  void dispose() {
    _settle?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final body = ColoredBox(color: widget.tint, child: widget.child);
    return ClipRRect(
      borderRadius: widget.borderRadius,
      child: _blur
          ? BackdropFilter(
              filter: ui.ImageFilter.blur(
                sigmaX: widget.sigma,
                sigmaY: widget.sigma,
              ),
              child: body,
            )
          : body,
    );
  }
}
