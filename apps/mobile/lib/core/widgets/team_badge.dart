import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';

/// Official "Thulo Bazaar Team" badge shown next to staff names in chat.
/// Driven by the server-computed `isStaff` flag (users.role), so regular
/// users can never display it.
class TeamBadge extends StatelessWidget {
  final bool compact;

  const TeamBadge({super.key, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFFDBEAFE),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.verified,
            size: compact ? 11 : 13,
            color: const Color(0xFF1D4ED8),
          ),
          const SizedBox(width: 2),
          Text(
            compact ? 'TEAM' : 'THULO BAZAAR TEAM',
            style: AppFont.inter(
              fontSize: compact ? 9 : 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
              color: const Color(0xFF1D4ED8),
            ),
          ),
        ],
      ),
    );
  }
}
