import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:mobile/core/api/auth_client.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/features/auth/widgets/auth_kit.dart';

/// Verifies a phone number, or changes a verified one.
///
/// Changing is four short steps, one per screen, on the sign-in chrome:
///   1. confirm it's you: a code goes to the CURRENT number first
///   2. enter that code
///   3. type the new number
///   4. enter its code, and the number is saved
/// Step 1 exists because verifying only the new number would prove control of
/// the new SIM, not of the account; a stolen session could move the account.
/// Nothing is saved until step 4 succeeds.
class PhoneVerificationScreen extends StatefulWidget {
  final VoidCallback? onVerified;
  final bool isChanging;

  /// The number being replaced. Null means there is nothing to prove yet.
  final String? currentPhone;

  const PhoneVerificationScreen({
    super.key,
    this.onVerified,
    this.isChanging = false,
    this.currentPhone,
  });

  @override
  State<PhoneVerificationScreen> createState() =>
      _PhoneVerificationScreenState();
}

enum _Stage { confirmCurrent, currentCode, newNumber, newCode }

class _PhoneVerificationScreenState extends State<PhoneVerificationScreen> {
  final AuthClient _auth = AuthClient();
  final _phone = TextEditingController();
  final _code = TextEditingController();

  late _Stage _stage;
  late final bool _changing;
  late final String _current;
  String? _oldNumberOtpToken;
  String? _error;
  bool _busy = false;
  int _cooldown = 0;
  Timer? _timer;

  static final _nepaliMobile = RegExp(r'^9[78]\d{8}$');

  @override
  void initState() {
    super.initState();
    _current = widget.currentPhone?.trim() ?? '';
    _changing = widget.isChanging && _current.isNotEmpty;
    _stage = _changing ? _Stage.confirmCurrent : _Stage.newNumber;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _phone.dispose();
    _code.dispose();
    super.dispose();
  }

  // ---- steps -------------------------------------------------------------

  int get _step => switch (_stage) {
    _Stage.confirmCurrent => 1,
    _Stage.currentCode => 2,
    _Stage.newNumber => _changing ? 3 : 1,
    _Stage.newCode => _changing ? 4 : 2,
  };

  int get _totalSteps => _changing ? 4 : 2;

  /// The number a code is being sent to at this stage.
  String get _target =>
      _stage == _Stage.confirmCurrent || _stage == _Stage.currentCode
      ? _current
      : _phone.text.trim();

  void _go(_Stage stage) {
    _timer?.cancel();
    setState(() {
      _stage = stage;
      _error = null;
      _code.clear();
      _cooldown = 0;
    });
  }

  void _back() {
    switch (_stage) {
      case _Stage.currentCode:
        _go(_Stage.confirmCurrent);
      case _Stage.newCode:
        _go(_Stage.newNumber);
      default:
        Navigator.pop(context);
    }
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      if (_cooldown <= 1) {
        t.cancel();
        setState(() => _cooldown = 0);
      } else {
        setState(() => _cooldown--);
      }
    });
  }

  // ---- network -----------------------------------------------------------

  Future<void> _sendCode() async {
    final phone = _target;
    if (!_nepaliMobile.hasMatch(phone)) {
      setState(() => _error = 'auth.phoneValidation'.tr());
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final result = await _auth.sendOtp(phone, purpose: 'phone_verification');
      if (!mounted) return;
      if (result['success'] != true) {
        // The server explains itself: number in use, cooldown, invalid.
        setState(
          () =>
              _error = result['message'] as String? ?? 'phone.sendFailed'.tr(),
        );
        return;
      }
      final next = _stage == _Stage.confirmCurrent
          ? _Stage.currentCode
          : _Stage.newCode;
      if (_stage != next) _go(next);
      _startCooldown();
    } catch (_) {
      if (mounted) setState(() => _error = 'phone.sendFailed'.tr());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitCode() async {
    final code = _code.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'auth.enterValidOtp'.tr());
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final verified = await _auth.verifyOtp(
        _target,
        code,
        purpose: 'phone_verification',
      );
      final token = verified['verificationToken'] as String?;
      if (verified['success'] != true || token == null) {
        throw Exception(verified['message'] ?? 'phone.codeFailed'.tr());
      }
      if (_stage == _Stage.currentCode) {
        // Ownership proven; nothing saved yet.
        _oldNumberOtpToken = token;
        _phone.clear();
        _go(_Stage.newNumber);
        return;
      }
      await _save(token);
    } catch (e) {
      if (mounted) setState(() => _error = _plain(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _save(String token) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final result = await _auth.updatePhone(
      _phone.text.trim(),
      token,
      oldNumberOtpToken: _oldNumberOtpToken,
    );
    if (result['success'] != true) {
      throw Exception(result['message'] ?? 'phone.saveFailed'.tr());
    }
    if (!mounted) return;
    messenger.showSnackBar(
      SnackBar(
        content: Text((_changing ? 'phone.updated' : 'phone.verified').tr()),
      ),
    );
    widget.onVerified?.call();
    navigator.pop(true);
  }

  static String _plain(Object e) =>
      e.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');

  // ---- ui ------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final ne = context.locale.languageCode == 'ne';
    return AuthShell(
      title: _title(),
      subtitle: _subtitle(),
      onBack: _busy ? null : _back,
      step: _step,
      totalSteps: _totalSteps,
      children: switch (_stage) {
        _Stage.confirmCurrent => _confirmCurrent(ne),
        _Stage.currentCode || _Stage.newCode => _enterCode(ne),
        _Stage.newNumber => _enterNumber(),
      },
    );
  }

  String _title() => switch (_stage) {
    _Stage.confirmCurrent => 'phone.confirmTitle'.tr(),
    _Stage.currentCode || _Stage.newCode => 'phone.codeTitle'.tr(),
    _Stage.newNumber =>
      (_changing ? 'phone.newNumberTitle' : 'phone.addTitle').tr(),
  };

  String _subtitle() => switch (_stage) {
    _Stage.confirmCurrent => 'phone.confirmSubtitle'.tr(),
    _Stage.currentCode ||
    _Stage.newCode => 'phone.codeSentTo'.tr(args: [_target]),
    _Stage.newNumber =>
      (_changing ? 'phone.newNumberSubtitle' : 'phone.addSubtitle').tr(),
  };

  List<Widget> _confirmCurrent(bool ne) => [
    _CurrentNumber(phone: _current, ne: ne),
    if (_error != null) ...[const SizedBox(height: 10), _ErrorText(_error!)],
    const SizedBox(height: 18),
    authButton(
      label: 'phone.sendCode'.tr(),
      onTap: _busy ? null : _sendCode,
      loading: _busy,
    ),
  ];

  List<Widget> _enterNumber() => [
    AuthField(
      key: const ValueKey('phone_new_number'),
      controller: _phone,
      label: 'phone.newNumber'.tr(),
      hint: 'auth.phonePlaceholder'.tr(),
      prefix: Text('auth.phonePrefix'.tr()),
      keyboardType: TextInputType.phone,
      maxLength: 10,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      error: _error,
      onChanged: (_) => setState(() => _error = null),
    ),
    const SizedBox(height: 18),
    authButton(
      label: 'phone.sendCode'.tr(),
      onTap: _busy ? null : _sendCode,
      loading: _busy,
    ),
  ];

  List<Widget> _enterCode(bool ne) => [
    AuthField(
      key: const ValueKey('phone_code'),
      controller: _code,
      label: 'phone.code'.tr(),
      hint: 'auth.otpPlaceholder'.tr(),
      keyboardType: TextInputType.number,
      maxLength: 6,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      error: _error,
      onChanged: (_) => setState(() => _error = null),
      style: AppFont.inter(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        letterSpacing: 8,
      ),
    ),
    const SizedBox(height: 8),
    Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        if (_stage == _Stage.newCode)
          TextButton(
            onPressed: _busy ? null : () => _go(_Stage.newNumber),
            child: Text('auth.changeNumber'.tr(), style: AuthT.link()),
          )
        else
          const SizedBox.shrink(),
        TextButton(
          onPressed: _busy || _cooldown > 0 ? null : _sendCode,
          child: Text(
            _cooldown > 0
                ? 'auth.resendIn'.tr(args: ['$_cooldown'])
                : 'auth.resendOtp'.tr(),
            style: AuthT.link().copyWith(
              color: _cooldown > 0 ? AuthT.inkFaint : null,
            ),
          ),
        ),
      ],
    ),
    const SizedBox(height: 10),
    authButton(
      label:
          (_stage == _Stage.currentCode
                  ? 'phone.confirm'
                  : _changing
                  ? 'phone.saveNumber'
                  : 'phone.verify')
              .tr(),
      onTap: _busy || _code.text.length != 6 ? null : _submitCode,
      loading: _busy,
    ),
  ];
}

/// The number already on the account, shown, not typed: step 1 must target
/// what the server knows, never what the user enters.
class _CurrentNumber extends StatelessWidget {
  final String phone;
  final bool ne;
  const _CurrentNumber({required this.phone, required this.ne});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: AuthT.fieldRest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AuthT.fieldBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AuthT.brand.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              LucideIcons.phone,
              size: 20,
              color: AuthT.brandDeep,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('phone.currentNumber'.tr(), style: AuthT.caption(ne)),
              const SizedBox(height: 2),
              Text(
                '${'auth.phonePrefix'.tr()} $phone',
                style: AuthT.body(ne).copyWith(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ErrorText extends StatelessWidget {
  final String text;
  const _ErrorText(this.text);
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: AppFont.inter(fontSize: 13, color: AuthT.danger, height: 1.4),
  );
}
