import 'package:flutter/material.dart';

/// Long text collapsed to [collapsedLines], with "View more" only when it
/// really overflows at the current width and text scale, and "View less"
/// once opened. Clamping by lines rather than words keeps roughly the same
/// screen height on every phone.
class ExpandableText extends StatefulWidget {
  final String text;
  final TextStyle style;
  final TextStyle linkStyle;
  final String moreLabel;
  final String lessLabel;
  final int collapsedLines;

  const ExpandableText({
    super.key,
    required this.text,
    required this.style,
    required this.linkStyle,
    required this.moreLabel,
    required this.lessLabel,
    this.collapsedLines = 8,
  });

  @override
  State<ExpandableText> createState() => _ExpandableTextState();
}

class _ExpandableTextState extends State<ExpandableText> {
  bool _expanded = false;

  bool _overflows(BuildContext context, double maxWidth) {
    final painter = TextPainter(
      text: TextSpan(text: widget.text, style: widget.style),
      maxLines: widget.collapsedLines,
      textDirection: Directionality.of(context),
      textScaler: MediaQuery.textScalerOf(context),
    )..layout(maxWidth: maxWidth);
    final overflows = painter.didExceedMaxLines;
    painter.dispose();
    return overflows;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final overflows = _overflows(context, constraints.maxWidth);
        final clamped = overflows && !_expanded;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AnimatedSize(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              alignment: Alignment.topCenter,
              child: Text(
                widget.text,
                style: widget.style,
                maxLines: clamped ? widget.collapsedLines : null,
                overflow: clamped
                    ? TextOverflow.ellipsis
                    : TextOverflow.visible,
              ),
            ),
            if (overflows)
              TextButton(
                key: const ValueKey('expandable_text_toggle'),
                onPressed: () => setState(() => _expanded = !_expanded),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(48, 40),
                  alignment: Alignment.centerLeft,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  _expanded ? widget.lessLabel : widget.moreLabel,
                  style: widget.linkStyle,
                ),
              ),
          ],
        );
      },
    );
  }
}
