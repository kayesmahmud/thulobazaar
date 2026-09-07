import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/theme/app_tokens.dart';
import 'package:mobile/features/safety/safety_beacon.dart';
import 'package:mobile/features/safety/script_toggle.dart';

const _policeComplaintFormUrl =
    'https://kvcio.nepalpolice.gov.np/ujuri-gunaso-form/';
const _cyberBureauEmail = 'cyberbureau@nepalpolice.gov.np';
const _cyberBureauPhone = '01-5319044';
const _policeEmergencyNumber = '100';

const _orange = Color(0xFFEA580C);
const _orangeDeep = Color(0xFFC2410C);
const _police = Color(0xFF1D4ED8);

/// How the advance-payment scam works, the warning signs, and where to
/// file a complaint with Nepal Police. Twin of the web /scam-prevention page.
class ScamPreventionScreen extends StatefulWidget {
  const ScamPreventionScreen({super.key});

  @override
  State<ScamPreventionScreen> createState() => _ScamPreventionScreenState();
}

class _ScamPreventionScreenState extends State<ScamPreventionScreen> {
  bool _roman = false;

  /// Resolves a key in the script the reader picked: the English string, or
  /// its romanized-Nepali `Latin` twin.
  String _t(String key) =>
      (_roman ? 'scamPrevention.${key}Latin' : 'scamPrevention.$key').tr();

  List<String> _keys(String prefix, int count) =>
      List.generate(count, (i) => _t('$prefix${i + 1}'));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTokens.canvas,
      appBar: AppBar(
        title: Text(
          _t('title'),
          style: AppFont.poppins(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppTokens.ink,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (ScriptToggle.isAvailable(context)) ...[
              Center(
                child: ScriptToggle(
                  roman: _roman,
                  color: _orangeDeep,
                  onChanged: (roman) => setState(() => _roman = roman),
                ),
              ),
              const SizedBox(height: 16),
            ],
            _Hero(t: _t),
            const SizedBox(height: 16),
            _Section(
              icon: LucideIcons.messageSquare,
              tint: const Color(0xFFB91C1C),
              title: _t('howTitle'),
              child: _Paragraph(_t('howStory')),
            ),
            _Section(
              icon: LucideIcons.alertTriangle,
              tint: _orangeDeep,
              title: _t('redFlagsTitle'),
              child: _Bullets(_keys('redFlag', 6), marker: _orange),
            ),
            _Section(
              icon: LucideIcons.shieldCheck,
              tint: AppTokens.successInk,
              title: _t('buyerRulesTitle'),
              child: _Bullets(_keys('buyerRule', 6), marker: AppTokens.success),
            ),
            _Section(
              icon: LucideIcons.store,
              tint: _police,
              title: _t('sellerRulesTitle'),
              child: _Bullets(_keys('sellerRule', 3), marker: _police),
            ),
            _Section(
              icon: LucideIcons.siren,
              tint: const Color(0xFFB91C1C),
              title: _t('scammedTitle'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Paragraph(_t('scammedIntro')),
                  const SizedBox(height: 12),
                  _Steps(_keys('scammedStep', 4)),
                ],
              ),
            ),
            _PoliceCard(t: _t),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  final String Function(String) t;
  const _Hero({required this.t});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_orange, Color(0xFFF59E0B)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const SafetyBeacon(
            icon: LucideIcons.shieldCheck,
            size: 56,
            background: Colors.white,
            foreground: _orange,
            ringColor: Colors.white,
          ),
          const SizedBox(height: 16),
          Text(
            t('title'),
            textAlign: TextAlign.center,
            style: AppFont.poppins(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            t('subtitle'),
            textAlign: TextAlign.center,
            style: AppFont.inter(color: Colors.white, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final IconData icon;
  final Color tint;
  final String title;
  final Widget child;

  const _Section({
    required this.icon,
    required this.tint,
    required this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTokens.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: tint.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 20, color: tint),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: AppFont.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTokens.ink,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _Paragraph extends StatelessWidget {
  final String text;
  const _Paragraph(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: AppFont.inter(
        fontSize: 14,
        height: 1.55,
        color: AppTokens.inkMuted,
      ),
    );
  }
}

class _Bullets extends StatelessWidget {
  final List<String> items;
  final Color marker;
  const _Bullets(this.items, {required this.marker});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 7),
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: marker,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: _Paragraph(item)),
              ],
            ),
          ),
      ],
    );
  }
}

class _Steps extends StatelessWidget {
  final List<String> items;
  const _Steps(this.items);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < items.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 28,
                  height: 28,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDC2626),
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '${i + 1}',
                    style: AppFont.inter(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: _Paragraph(items[i]),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _PoliceCard extends StatelessWidget {
  final String Function(String) t;
  const _PoliceCard({required this.t});

  Future<void> _open(BuildContext context, Uri uri) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!opened) throw Exception('launchUrl returned false');
    } catch (_) {
      messenger.showSnackBar(
        SnackBar(content: Text('settings.couldNotOpenLink'.tr())),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTokens.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBFDBFE), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Image.asset(
                'assets/images/nepal_police_logo.png',
                width: 52,
                height: 49,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('policeTitle'),
                      style: AppFont.poppins(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppTokens.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      t('policeOffice'),
                      style: AppFont.inter(
                        fontSize: 12,
                        color: AppTokens.inkFaint,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _Paragraph(t('policeBody')),
          const SizedBox(height: 16),
          SizedBox(
            height: 48,
            child: FilledButton.icon(
              onPressed: () =>
                  _open(context, Uri.parse(_policeComplaintFormUrl)),
              style: FilledButton.styleFrom(
                backgroundColor: _police,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(LucideIcons.externalLink, size: 18),
              label: Text(
                t('policeButton'),
                style: AppFont.inter(fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(height: 16),
          _Paragraph(t('policeOutsideValley')),
          const SizedBox(height: 10),
          _ContactRow(
            icon: LucideIcons.mail,
            label: t('cyberBureauEmail'),
            value: _cyberBureauEmail,
            onTap: () => _open(context, Uri.parse('mailto:$_cyberBureauEmail')),
          ),
          _ContactRow(
            icon: LucideIcons.phone,
            label: t('cyberBureauPhone'),
            value: _cyberBureauPhone,
            onTap: () => _open(
              context,
              Uri.parse('tel:${_cyberBureauPhone.replaceAll('-', '')}'),
            ),
          ),
          _ContactRow(
            icon: LucideIcons.siren,
            label: t('policeEmergency'),
            value: _policeEmergencyNumber,
            onTap: () =>
                _open(context, Uri.parse('tel:$_policeEmergencyNumber')),
          ),
          const SizedBox(height: 12),
          Text(
            t('policeDisclaimer'),
            style: AppFont.inter(fontSize: 11, color: AppTokens.inkFaint),
          ),
        ],
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  const _ContactRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 44),
        child: Row(
          children: [
            Icon(icon, size: 16, color: AppTokens.inkFaint),
            const SizedBox(width: 10),
            Text(
              '$label: ',
              style: AppFont.inter(fontSize: 13, color: AppTokens.inkMuted),
            ),
            Expanded(
              child: Text(
                value,
                style: AppFont.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: _police,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
