import 'package:flutter/material.dart';

/// A round icon with two rings rippling outward, like an alert beacon.
///
/// One ticker drives both rings; the painter only strokes two circles, and
/// the [RepaintBoundary] keeps every other pixel on the screen from
/// repainting with it. Honours the OS reduce-motion setting by standing still.
class SafetyBeacon extends StatefulWidget {
  final IconData icon;
  final double size;
  final Color background;
  final Color foreground;
  final Color ringColor;

  const SafetyBeacon({
    super.key,
    required this.icon,
    this.size = 40,
    this.background = const Color(0xFFEA580C),
    this.foreground = Colors.white,
    this.ringColor = const Color(0xFFEA580C),
  });

  @override
  State<SafetyBeacon> createState() => _SafetyBeaconState();
}

class _SafetyBeaconState extends State<SafetyBeacon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.stop();
    } else if (!_controller.isAnimating) {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: CustomPaint(
        painter: _RipplePainter(progress: _controller, color: widget.ringColor),
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: widget.background,
            shape: BoxShape.circle,
          ),
          child: Icon(
            widget.icon,
            size: widget.size / 2,
            color: widget.foreground,
          ),
        ),
      ),
    );
  }
}

class _RipplePainter extends CustomPainter {
  final Animation<double> progress;
  final Color color;

  _RipplePainter({required this.progress, required this.color})
    : super(repaint: progress);

  static const _rings = 2;
  static const _maxScale = 2.2;
  static const _peakOpacity = 0.55;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final baseRadius = size.shortestSide / 2;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    for (var i = 0; i < _rings; i++) {
      final phase = (progress.value + i / _rings) % 1.0;
      final eased = Curves.easeOut.transform(phase);
      paint.color = color.withValues(alpha: _peakOpacity * (1 - eased));
      canvas.drawCircle(
        center,
        baseRadius * (1 + (_maxScale - 1) * eased),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_RipplePainter old) =>
      old.progress != progress || old.color != color;
}
