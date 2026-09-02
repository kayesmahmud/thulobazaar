import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import 'package:mobile/core/api/auth_client.dart';

/// Asks for the current and new password, then changes it. Outcome lands in
/// a snackbar on the caller's scaffold.
Future<void> showChangePasswordDialog(BuildContext context) async {
  final change = await showDialog<_PasswordChange>(
    context: context,
    builder: (_) => const _ChangePasswordDialog(),
  );
  if (change == null || !context.mounted) return;

  final messenger = ScaffoldMessenger.of(context);
  try {
    final result = await AuthClient().changePassword(
      change.current,
      change.next,
    );
    if (result['success'] != true) throw Exception(result['message']);
    messenger.showSnackBar(
      SnackBar(content: Text('security.passwordChanged'.tr())),
    );
  } catch (e) {
    messenger.showSnackBar(
      SnackBar(
        content: Text('security.failedToChangePassword'.tr(args: ['$e'])),
      ),
    );
  }
}

class _PasswordChange {
  final String current;
  final String next;
  const _PasswordChange(this.current, this.next);
}

class _ChangePasswordDialog extends StatefulWidget {
  const _ChangePasswordDialog();
  @override
  State<_ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<_ChangePasswordDialog> {
  final _form = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();

  // The server rejects anything shorter; the old dialog said 6 and let a
  // 7-character password fail with a raw server message.
  static const _minLength = 8;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  void _submit() {
    if (_form.currentState?.validate() != true) return;
    Navigator.pop(context, _PasswordChange(_current.text, _next.text));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('security.changePassword'.tr()),
      content: Form(
        key: _form,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _current,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'security.currentPassword'.tr(),
              ),
              validator: (v) =>
                  (v ?? '').isEmpty ? 'security.required'.tr() : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _next,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'security.newPassword'.tr(),
              ),
              validator: (v) => (v ?? '').length < _minLength
                  ? 'security.min8Chars'.tr()
                  : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _confirm,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'security.confirmNewPassword'.tr(),
              ),
              validator: (v) {
                if ((v ?? '').isEmpty) return 'security.required'.tr();
                if (v != _next.text) return 'security.passwordMismatch'.tr();
                return null;
              },
              onFieldSubmitted: (_) => _submit(),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('common.cancel'.tr()),
        ),
        FilledButton(onPressed: _submit, child: Text('security.change'.tr())),
      ],
    );
  }
}
