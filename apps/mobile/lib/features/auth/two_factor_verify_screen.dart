import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_client.dart';
import '../../core/providers/auth_provider.dart';
import '../main_nav/main_nav_screen.dart';

class TwoFactorVerifyScreen extends StatefulWidget {
  final String tempToken;
  final VoidCallback? onSuccess;

  const TwoFactorVerifyScreen({
    super.key,
    required this.tempToken,
    this.onSuccess,
  });

  @override
  State<TwoFactorVerifyScreen> createState() => _TwoFactorVerifyScreenState();
}

class _TwoFactorVerifyScreenState extends State<TwoFactorVerifyScreen> {
  final _codeController = TextEditingController();
  final _authClient = AuthClient();
  bool _isLoading = false;
  String? _error;
  bool _useBackupCode = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<bool> _showAccountRecoveryDialog(String? deletionDate) async {
    final lang = context.locale.languageCode;

    String daysRemaining = '';
    if (deletionDate != null) {
      final deletionRequested = DateTime.tryParse(deletionDate);
      if (deletionRequested != null) {
        final deadline = deletionRequested.add(const Duration(days: 30));
        final remaining = deadline.difference(DateTime.now()).inDays;
        daysRemaining = remaining > 0 ? '$remaining' : '0';
      }
    }

    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        icon: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(
            LucideIcons.alertTriangle,
            color: Colors.orange.shade700,
            size: 32,
          ),
        ),
        title: Text(
          lang == 'ne'
              ? 'तपाईंको खाता मेटिने क्रममा छ'
              : 'Your Account Is Scheduled for Deletion',
          style: AppFont.inter(fontWeight: FontWeight.bold, fontSize: 18),
          textAlign: TextAlign.center,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              lang == 'ne'
                  ? 'तपाईंले आफ्नो खाता मेटाउन अनुरोध गर्नुभएको थियो।${daysRemaining.isNotEmpty ? ' तपाईंसँग $daysRemaining दिन बाँकी छ।' : ''} के तपाईं आफ्नो खाता राख्न चाहनुहुन्छ?'
                  : 'You previously requested to delete your account.${daysRemaining.isNotEmpty ? ' You have $daysRemaining days remaining before permanent deletion.' : ''} Would you like to keep your account?',
              style: AppFont.inter(fontSize: 14, color: Colors.grey[700]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  lang == 'ne' ? 'मेरो खाता राख्नुहोस्' : 'Keep My Account',
                  style: AppFont.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  lang == 'ne'
                      ? 'मेटाउने प्रक्रिया जारी राख्नुहोस्'
                      : 'Continue with Deletion',
                  style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (result == true) {
      final cancelResult = await _authClient.cancelAccountDeletion();
      if (cancelResult['success'] == true) {
        return true;
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                cancelResult['message'] ??
                    (lang == 'ne' ? 'त्रुटि भयो' : 'Failed to cancel deletion'),
              ),
            ),
          );
        }
        return false;
      }
    }

    if (mounted) {
      await context.read<AuthProvider>().logout();
    }
    return false;
  }

  Future<void> _verify() async {
    // Backup codes are stored as lowercase hex; normalise so a stray uppercase
    // character doesn't fail an otherwise-correct code. Harmless for numeric TOTP.
    final code = _codeController.text.trim().toLowerCase();
    if (code.isEmpty) {
      setState(
        () => _error = context.locale.languageCode == 'ne'
            ? 'कृपया कोड प्रविष्ट गर्नुहोस्'
            : 'Please enter the code',
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await _authClient.verify2FALogin(widget.tempToken, code);

      if (!mounted) return;

      if (result['success'] == true) {
        final token = result['token'];
        await context.read<AuthProvider>().login(token);

        // Check for pending account deletion
        if (result['accountPendingDeletion'] == true) {
          if (!mounted) return;
          final keepAccount = await _showAccountRecoveryDialog(
            result['deletionDate']?.toString(),
          );
          if (!keepAccount || !mounted) return;
        }

        if (mounted) {
          if (widget.onSuccess != null) {
            widget.onSuccess!();
          } else {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (_) => const MainNavScreen()),
              (route) => false,
            );
          }
        }
      } else {
        setState(() => _error = result['message'] ?? 'Verification failed');
      }
    } catch (e, st) {
      if (kDebugMode) {
        developer.log(
          '2FA verify failed',
          name: 'TwoFactorVerify',
          error: e,
          stackTrace: st,
        );
      }
      if (mounted) {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          lang == 'ne' ? 'दुई-चरण प्रमाणीकरण' : 'Two-Factor Authentication',
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.shield,
                size: 48,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              lang == 'ne'
                  ? 'प्रमाणीकरण कोड प्रविष्ट गर्नुहोस्'
                  : 'Enter Authentication Code',
              style: AppFont.inter(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _useBackupCode
                  ? (lang == 'ne'
                        ? 'आफ्नो ब्याकअप कोड मध्ये एउटा प्रविष्ट गर्नुहोस्'
                        : 'Enter one of your 8-character backup codes')
                  : (lang == 'ne'
                        ? 'तपाईंको authenticator एपबाट ६-अंकको कोड प्रविष्ट गर्नुहोस्'
                        : 'Enter the 6-digit code from your authenticator app'),
              textAlign: TextAlign.center,
              style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _codeController,
              // Backup codes are 8 hex chars (contain a–f), so they need a text
              // keyboard to type letters; TOTP codes use the number keyboard.
              keyboardType: _useBackupCode
                  ? TextInputType.text
                  : TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 8, // TOTP is 6 digits; backup codes are 8 hex chars
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9a-fA-F]')),
              ],
              style: AppFont.inter(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 8,
              ),
              decoration: InputDecoration(
                counterText: '',
                hintText: _useBackupCode ? 'a1b2c3d4' : '000000',
                hintStyle: AppFont.inter(
                  fontSize: 24,
                  color: Colors.grey[300],
                  letterSpacing: 8,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                    color: AppTheme.primary,
                    width: 2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(color: Colors.red, fontSize: 14),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _verify,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        lang == 'ne' ? 'प्रमाणित गर्नुहोस्' : 'Verify',
                        style: AppFont.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _isLoading
                  ? null
                  : () => setState(() {
                      _useBackupCode = !_useBackupCode;
                      _codeController.clear();
                      _error = null;
                    }),
              child: Text(
                _useBackupCode
                    ? (lang == 'ne'
                          ? 'बरु authenticator एप प्रयोग गर्नुहोस्'
                          : 'Use authenticator app instead')
                    : (lang == 'ne'
                          ? 'ब्याकअप कोड पनि प्रयोग गर्नुहोस्'
                          : 'You can also use a backup code'),
                style: AppFont.inter(
                  fontSize: 13,
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
