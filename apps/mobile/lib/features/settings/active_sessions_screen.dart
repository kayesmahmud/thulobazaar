import 'dart:developer' as developer;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:mobile/core/api/auth_client.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/theme/app_tokens.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:mobile/core/widgets/load_error_view.dart';
import 'package:mobile/features/settings/widgets/settings_kit.dart';

/// Every refresh token still valid for this account. The API returns no
/// device name yet, so each row can only say when it started.
class ActiveSessionsScreen extends StatefulWidget {
  const ActiveSessionsScreen({super.key});
  @override
  State<ActiveSessionsScreen> createState() => _ActiveSessionsScreenState();
}

class _ActiveSessionsScreenState extends State<ActiveSessionsScreen> {
  final _auth = AuthClient();
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final result = await _auth.getSessions();
      final data = (result['data'] as List?) ?? const [];
      if (!mounted) return;
      setState(() {
        _sessions = data.cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (e) {
      developer.log('sessions load failed: $e', name: 'ActiveSessions');
      if (!mounted) return;
      setState(() {
        _loading = false;
        _failed = true;
      });
    }
  }

  Future<void> _revoke(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('settings.revokeSession'.tr()),
        content: Text('settings.revokeSessionConfirm'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('common.cancel'.tr()),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppTokens.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('auth.signOut'.tr()),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    try {
      final result = await _auth.revokeSession(id);
      if (result['success'] != true) throw Exception(result['message']);
      if (!mounted) return;
      setState(() => _sessions.removeWhere((s) => s['id'] == id));
      messenger.showSnackBar(
        SnackBar(content: Text('security.sessionRevoked'.tr())),
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(content: Text('security.failedToRevoke'.tr(args: ['$e']))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTokens.canvas,
      appBar: AppBar(
        backgroundColor: AppTokens.surface,
        surfaceTintColor: AppTokens.surface,
        elevation: 0,
        title: Text(
          'security.activeSessions'.tr(),
          style: AppFont.inter(fontSize: 18, fontWeight: FontWeight.w800),
        ),
      ),
      body: _body(context),
    );
  }

  Widget _body(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_failed) return LoadErrorView(isOffline: false, onRetry: _load);
    if (_sessions.isEmpty) {
      return Center(
        child: Text(
          'security.noSessions'.tr(),
          style: AppFont.inter(color: AppTokens.inkFaint),
        ),
      );
    }
    final lang = context.locale.languageCode;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        SettingsCard(
          rows: [
            for (final s in _sessions)
              SettingsRow(
                icon: LucideIcons.monitor,
                tint: AppTokens.ink,
                title: 'security.sessionStarted'.tr(),
                subtitle: _startedAt(s, lang),
                trailing: IconButton(
                  tooltip: 'settings.revokeSession'.tr(),
                  icon: const Icon(LucideIcons.logOut, color: AppTokens.danger),
                  onPressed: () {
                    final id = s['id'];
                    if (id is int) _revoke(id);
                  },
                ),
              ),
          ],
        ),
      ],
    );
  }

  String _startedAt(Map<String, dynamic> session, String lang) {
    final raw = session['created_at'] ?? session['createdAt'];
    final when = raw is String ? DateTime.tryParse(raw) : null;
    if (when == null) return '';
    return formatNepalTime(when, 'MMM d, yyyy h:mm a', lang);
  }
}
