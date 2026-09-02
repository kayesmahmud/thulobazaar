import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import 'package:mobile/core/api/auth_client.dart';
import 'package:mobile/core/theme/app_tokens.dart';

/// Password + current code, then turns 2FA off. Returns true on success so
/// the caller can refresh the profile.
Future<bool> showDisableTwoFactorDialog(BuildContext context) async {
  final proof = await showDialog<_TwoFactorProof>(
    context: context,
    builder: (_) => const _DisableTwoFactorDialog(),
  );
  if (proof == null || !context.mounted) return false;

  final messenger = ScaffoldMessenger.of(context);
  try {
    final result = await AuthClient().disable2FA(proof.password, proof.code);
    if (result['success'] != true) throw Exception(result['message']);
    messenger.showSnackBar(
      SnackBar(content: Text('security.twoFactorDisabled'.tr())),
    );
    return true;
  } catch (e) {
    messenger.showSnackBar(
      SnackBar(content: Text('security.failedToUpdate2fa'.tr(args: ['$e']))),
    );
    return false;
  }
}

class _TwoFactorProof {
  final String password;
  final String code;
  const _TwoFactorProof(this.password, this.code);
}

class _DisableTwoFactorDialog extends StatefulWidget {
  const _DisableTwoFactorDialog();
  @override
  State<_DisableTwoFactorDialog> createState() =>
      _DisableTwoFactorDialogState();
}

class _DisableTwoFactorDialogState extends State<_DisableTwoFactorDialog> {
  final _password = TextEditingController();
  final _code = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    _code.dispose();
    super.dispose();
  }

  void _submit() {
    if (_password.text.isEmpty || _code.text.isEmpty) {
      setState(() => _error = 'settings.passwordAndCodeRequired'.tr());
      return;
    }
    Navigator.pop(context, _TwoFactorProof(_password.text, _code.text));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('settings.disableTwoFactor'.tr()),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'settings.disableTwoFactorHint'.tr(),
            style: const TextStyle(fontSize: 13, color: AppTokens.inkFaint),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: InputDecoration(labelText: 'auth.password'.tr()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: InputDecoration(
              labelText: 'settings.twoFactorCode'.tr(),
              counterText: '',
              errorText: _error,
            ),
            onSubmitted: (_) => _submit(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('common.cancel'.tr()),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: AppTokens.danger),
          onPressed: _submit,
          child: Text('settings.turnOff'.tr()),
        ),
      ],
    );
  }
}
