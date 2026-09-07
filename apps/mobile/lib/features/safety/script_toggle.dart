import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import 'package:mobile/core/theme/app_font.dart';

/// English / Nepali (Roman) switch for safety copy. Only English readers
/// need it: the Devanagari version is the app's Nepali locale itself, so the
/// toggle disappears there.
class ScriptToggle extends StatelessWidget {
  final bool roman;
  final ValueChanged<bool> onChanged;
  final Color color;

  const ScriptToggle({
    super.key,
    required this.roman,
    required this.onChanged,
    required this.color,
  });

  static bool isAvailable(BuildContext context) =>
      context.locale.languageCode == 'en';

  @override
  Widget build(BuildContext context) {
    if (!isAvailable(context)) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _Pill(
            label: 'common.scriptTabEnglish'.tr(),
            selected: !roman,
            color: color,
            onTap: () => onChanged(false),
          ),
          _Pill(
            label: 'common.scriptTabRoman'.tr(),
            selected: roman,
            color: color,
            onTap: () => onChanged(true),
          ),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _Pill({
    required this.label,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        constraints: const BoxConstraints(minHeight: 38),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: AppFont.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : color,
          ),
        ),
      ),
    );
  }
}
