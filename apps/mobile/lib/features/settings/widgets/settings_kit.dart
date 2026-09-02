import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/theme/app_tokens.dart';

/// A sentence-case header above a white card of rows. Tint is chosen per
/// group, not per row, so a screen reads as a few calm blocks.
class SettingsGroup extends StatelessWidget {
  final String title;
  final List<Widget> rows;
  const SettingsGroup({super.key, required this.title, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 22, 4, 10),
          child: Text(
            title,
            style: AppFont.inter(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              color: AppTokens.inkFaint,
              height: 1.4,
            ),
          ),
        ),
        SettingsCard(rows: rows),
      ],
    );
  }
}

/// The card alone, for a group that needs no header (sign out / delete).
class SettingsCard extends StatelessWidget {
  final List<Widget> rows;
  const SettingsCard({super.key, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTokens.surface,
        borderRadius: BorderRadius.circular(AppTokens.radiusCard),
        border: Border.all(color: AppTokens.hairline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0)
              const Padding(
                padding: EdgeInsets.only(left: 66),
                child: Divider(height: 1, color: AppTokens.hairline),
              ),
            rows[i],
          ],
        ],
      ),
    );
  }
}

/// Badge + title + subtitle + trailing. Pass no [onTap] for a row that is
/// information only; it then shows no chevron rather than a dead one.
class SettingsRow extends StatelessWidget {
  final IconData icon;
  final Color tint;
  final String title;
  final String? subtitle;
  final String? note;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool danger;

  const SettingsRow({
    super.key,
    required this.icon,
    required this.tint,
    required this.title,
    this.subtitle,
    this.note,
    this.trailing,
    this.onTap,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) {
    final titleColor = danger ? AppTokens.danger : AppTokens.ink;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: tint.withValues(alpha: 0.11),
          borderRadius: BorderRadius.circular(AppTokens.radiusBadge),
        ),
        child: Icon(icon, size: 19, color: tint),
      ),
      title: Text(
        title,
        style: AppFont.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: titleColor,
          height: 1.4,
        ),
      ),
      subtitle: subtitle == null && note == null
          ? null
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (subtitle != null)
                  Text(
                    subtitle ?? '',
                    style: AppFont.inter(
                      fontSize: 13,
                      color: AppTokens.inkFaint,
                      height: 1.5,
                    ),
                  ),
                if (note != null)
                  Text(
                    note ?? '',
                    style: AppFont.inter(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                      color: AppTokens.inkFaint,
                      height: 1.5,
                    ),
                  ),
              ],
            ),
      trailing:
          trailing ??
          (onTap == null
              ? null
              : const Icon(
                  LucideIcons.chevronRight,
                  size: 18,
                  color: AppTokens.inkFaint,
                )),
      onTap: onTap,
    );
  }
}

/// Small status pill for a row that carries real state (verified, on/off).
class SettingsChip extends StatelessWidget {
  final String label;
  final Color color;
  const SettingsChip({super.key, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppFont.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
          height: 1.3,
        ),
      ),
    );
  }
}
