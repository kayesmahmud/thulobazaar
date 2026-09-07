import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/features/safety/safety_beacon.dart';
import 'package:mobile/features/safety/scam_prevention_screen.dart';
import 'package:mobile/features/safety/script_toggle.dart';

const _orangeInk = Color(0xFFC2410C);
const _orangeText = Color(0xFF9A3412);

/// The beacon's rings spread past its icon; the title starts clear of them.
const _beaconSize = 32.0;
const _beaconInset = 6.0;
const _beaconToTitle = 28.0;

class SafetyTipsCard extends StatefulWidget {
  const SafetyTipsCard({super.key});

  @override
  State<SafetyTipsCard> createState() => _SafetyTipsCardState();
}

class _SafetyTipsCardState extends State<SafetyTipsCard> {
  bool _roman = false;

  String _t(String key) => (_roman ? '${key}Latin' : key).tr();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFEDD5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const SizedBox(width: _beaconInset),
              const SafetyBeacon(
                icon: LucideIcons.shieldAlert,
                size: _beaconSize,
              ),
              const SizedBox(width: _beaconToTitle),
              Expanded(
                child: Text(
                  _t('adDetail.safetyTips'),
                  style: AppFont.inter(
                    fontSize: 15,
                    color: _orangeInk,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (ScriptToggle.isAvailable(context)) ...[
            const SizedBox(height: 12),
            ScriptToggle(
              roman: _roman,
              color: _orangeInk,
              onChanged: (roman) => setState(() => _roman = roman),
            ),
          ],
          const SizedBox(height: 12),
          for (var i = 1; i <= 4; i++) _Tip(_t('adDetail.safetyTip$i')),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ScamPreventionScreen()),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: _orangeInk,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(LucideIcons.shieldCheck, size: 18),
              label: Text(
                _t('adDetail.safetyLearnMore'),
                style: AppFont.inter(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Tip extends StatelessWidget {
  final String text;
  const _Tip(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 1),
            child: Icon(Icons.check_circle, size: 16, color: _orangeInk),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: AppFont.inter(
                fontSize: 13,
                height: 1.4,
                color: _orangeText,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
