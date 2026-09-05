import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/widgets/success_checkmark.dart';

/// What the AI decided about a just-posted ad.
class AdPostedOutcome {
  final bool live;

  /// Seller-safe hold reason. Null when the verdict never landed inside the
  /// poll window, or when the AI itself was unreachable — neither of which is
  /// the seller's fault, so neither may show a blaming message.
  final String? holdCode;

  /// Real category the AI suggests instead, already validated server-side —
  /// null when it had no confident suggestion, and the line is then omitted.
  final String? suggestedCategory;

  /// The seller tapped "Edit your ad" rather than dismissing.
  final bool editRequested;

  const AdPostedOutcome({
    required this.live,
    this.holdCode,
    this.suggestedCategory,
    this.editRequested = false,
  });

  bool get held => !live && holdCode != null;

  AdPostedOutcome asEditRequest() => AdPostedOutcome(
    live: live,
    holdCode: holdCode,
    suggestedCategory: suggestedCategory,
    editRequested: true,
  );
}

/// Hold reasons we have written bilingual copy for. Anything else — including
/// the server's 'other' — falls back to the neutral 'generic' message.
const _knownHoldCodes = {
  'stock_photo',
  'unclear_photos',
  'details_mismatch',
  'suspicious_price',
  'duplicate',
  'policy_check',
};

/// Post-success dialog. Opens immediately in a "checking" state so the seller
/// is never left waiting on a spinner, then flips in place the moment
/// [verdict] resolves — to "your ad is live" or to the specific hold reason.
///
/// Resolves when the dialog is dismissed, with whatever the AI verdict was at
/// that moment — closing early during "checking" yields a not-live outcome, so
/// the caller never blocks on the poll.
Future<AdPostedOutcome> showAdPostedDialog(
  BuildContext context, {
  required Future<AdPostedOutcome> verdict,
  required bool isNepali,
}) async {
  final result = await showDialog<AdPostedOutcome>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => _AdPostedDialog(verdict: verdict, isNepali: isNepali),
  );
  return result ?? const AdPostedOutcome(live: false);
}

class _AdPostedDialog extends StatefulWidget {
  final Future<AdPostedOutcome> verdict;
  final bool isNepali;

  const _AdPostedDialog({required this.verdict, required this.isNepali});

  @override
  State<_AdPostedDialog> createState() => _AdPostedDialogState();
}

class _AdPostedDialogState extends State<_AdPostedDialog> {
  AdPostedOutcome? _outcome;

  @override
  void initState() {
    super.initState();
    widget.verdict.then((o) {
      if (!mounted) return;
      setState(() => _outcome = o);
      // A live ad needs no acknowledgement — show the good news, then move on.
      if (o.live) {
        Future.delayed(const Duration(milliseconds: 1800), () {
          if (mounted) Navigator.of(context).pop(o);
        });
      }
    });
  }

  String get _reasonKey {
    final code = _outcome?.holdCode;
    return code != null && _knownHoldCodes.contains(code) ? code : 'generic';
  }

  @override
  Widget build(BuildContext context) {
    final outcome = _outcome;
    final checking = outcome == null;
    final held = outcome?.held ?? false;
    final live = outcome?.live ?? false;

    return PopScope(
      // Dismissal is via the button only, so the caller's navigation always runs.
      canPop: false,
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (checking)
                const SizedBox(
                  height: 64,
                  width: 64,
                  child: CircularProgressIndicator(strokeWidth: 4),
                )
              else if (held)
                Container(
                  height: 64,
                  width: 64,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF59E0B),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.schedule_rounded,
                    color: Colors.white,
                    size: 36,
                  ),
                )
              else
                const SuccessCheckmark(),

              const SizedBox(height: 20),

              Text(
                checking
                    ? 'postAd.adPostedChecking'.tr()
                    : held
                    ? 'postAd.adHeldTitle'.tr()
                    : live
                    ? 'postAd.adPostedLiveTitle'.tr()
                    : 'postAd.adPosted'.tr(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 12),

              if (held) ...[
                Text(
                  'postAd.adHeld_$_reasonKey'.tr(),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (outcome?.suggestedCategory case final suggested?) ...[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'postAd.adHeldTryCategory'.tr(
                        namedArgs: {'category': suggested},
                      ),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF92400E),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  _reasonKey == 'generic'
                      ? 'postAd.adHeldNoteGeneric'.tr()
                      : 'postAd.adHeldNote'.tr(),
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  textAlign: TextAlign.center,
                ),
                if (!widget.isNepali && _reasonKey != 'generic') ...[
                  const SizedBox(height: 8),
                  Text(
                    'postAd.adHeldNoteLatin'.tr(),
                    style: TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                      color: Colors.grey.shade600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ] else
                Text(
                  checking
                      ? 'postAd.adPostedCheckingNote'.tr()
                      : live
                      ? 'postAd.adPostedLiveNote'.tr()
                      : 'postAd.adHeldNoteGeneric'.tr(),
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  textAlign: TextAlign.center,
                ),

              // A live ad dismisses itself. Every other state — including the
              // wait — keeps a way out, so a slow verdict never traps anyone.
              if (!live) ...[
                const SizedBox(height: 20),
                if (held) ...[
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () =>
                          Navigator.of(context).pop(outcome?.asEditRequest()),
                      child: Text('postAd.adHeldEdit'.tr()),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(outcome),
                      child: Text('postAd.adHeldOk'.tr()),
                    ),
                  ),
                ] else
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(outcome),
                      child: Text('postAd.adHeldOk'.tr()),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
