import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_client.dart';
import '../../core/utils/localized_helpers.dart';
import '../../core/providers/auth_provider.dart';
import '../main_nav/main_nav_screen.dart';

enum _DeleteStep { confirmIntent, sendingOtp, enterOtp, deleting, success }

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final _authClient = AuthClient();
  final _otpController = TextEditingController();

  _DeleteStep _step = _DeleteStep.confirmIntent;
  String? _maskedPhone;
  String? _recoveryDeadline;
  String? _error;
  int _cooldown = 0;
  Timer? _cooldownTimer;

  @override
  void dispose() {
    _otpController.dispose();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  void _startCooldown(int seconds) {
    _cooldown = seconds;
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _cooldown--;
        if (_cooldown <= 0) timer.cancel();
      });
    });
  }

  Future<void> _requestDeletion() async {
    setState(() {
      _step = _DeleteStep.sendingOtp;
      _error = null;
    });

    try {
      final result = await _authClient.requestAccountDeletion();
      if (!mounted) return;

      if (result['success'] == true) {
        setState(() {
          _maskedPhone = result['data']?['phone'];
          _step = _DeleteStep.enterOtp;
        });
        _startCooldown(60);
      } else {
        final cooldown = result['cooldownRemaining'];
        if (cooldown != null) _startCooldown(cooldown);
        setState(() {
          _error = result['message'] ?? 'Failed to send code';
          _step = _DeleteStep.confirmIntent;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _step = _DeleteStep.confirmIntent;
        });
      }
    }
  }

  Future<void> _confirmDeletion() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      setState(
        () => _error = context.locale.languageCode == 'ne'
            ? '६-अंकको कोड प्रविष्ट गर्नुहोस्'
            : 'Enter a 6-digit code',
      );
      return;
    }

    setState(() {
      _step = _DeleteStep.deleting;
      _error = null;
    });

    try {
      final result = await _authClient.confirmAccountDeletion(otp);
      if (!mounted) return;

      if (result['success'] == true) {
        setState(() {
          _recoveryDeadline = result['data']?['recoveryDeadline'];
          _step = _DeleteStep.success;
        });
      } else {
        setState(() {
          _error = result['message'] ?? 'Deletion failed';
          _step = _DeleteStep.enterOtp;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _step = _DeleteStep.enterOtp;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;

    return Scaffold(
      appBar: AppBar(
        title: Text(lang == 'ne' ? 'खाता मेटाउनुहोस्' : 'Delete Account'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: _buildCurrentStep(lang),
      ),
    );
  }

  Widget _buildCurrentStep(String lang) {
    switch (_step) {
      case _DeleteStep.confirmIntent:
        return _buildConfirmIntent(lang);
      case _DeleteStep.sendingOtp:
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(48),
            child: CircularProgressIndicator(),
          ),
        );
      case _DeleteStep.enterOtp:
        return _buildEnterOtp(lang);
      case _DeleteStep.deleting:
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(48),
            child: Column(
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(lang == 'ne' ? 'खाता मेट्दै...' : 'Deleting account...'),
              ],
            ),
          ),
        );
      case _DeleteStep.success:
        return _buildSuccess(lang);
    }
  }

  Widget _buildConfirmIntent(String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.red[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.red[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    LucideIcons.alertTriangle,
                    color: Colors.red,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    lang == 'ne' ? 'चेतावनी' : 'Warning',
                    style: AppFont.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.red,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildBullet(
                lang == 'ne'
                    ? 'तपाईंको प्रोफाइल र विज्ञापनहरू लुकाइनेछ'
                    : 'Your profile and ads will be hidden',
                lang,
              ),
              _buildBullet(
                lang == 'ne'
                    ? 'सबै सक्रिय विज्ञापनहरू निष्क्रिय हुनेछन्'
                    : 'All active ads will be deactivated',
                lang,
              ),
              _buildBullet(
                lang == 'ne'
                    ? '३० दिनभित्र तपाईं खाता पुनर्स्थापित गर्न सक्नुहुन्छ'
                    : 'You can recover your account within 30 days',
                lang,
              ),
              _buildBullet(
                lang == 'ne'
                    ? '३० दिनपछि सबै डाटा स्थायी रूपमा मेटिनेछ'
                    : 'After 30 days, all data will be permanently deleted',
                lang,
              ),
            ],
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
            onPressed: _requestDeletion,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              lang == 'ne'
                  ? 'हो, प्रमाणीकरण कोड पठाउनुहोस्'
                  : 'Yes, Send Verification Code',
              style: AppFont.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              lang == 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel',
              style: AppFont.inter(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBullet(String text, String lang) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '  •  ',
            style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
          ),
          Expanded(
            child: Text(
              text,
              style: AppFont.inter(fontSize: 14, color: Colors.red[800]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterOtp(String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Icon(LucideIcons.smartphone, size: 48, color: Colors.grey),
        const SizedBox(height: 16),
        Text(
          lang == 'ne'
              ? 'प्रमाणीकरण कोड प्रविष्ट गर्नुहोस्'
              : 'Enter Verification Code',
          style: AppFont.inter(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        if (_maskedPhone != null)
          Text(
            lang == 'ne'
                ? '$_maskedPhone मा कोड पठाइयो'
                : 'Code sent to $_maskedPhone',
            style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
          ),
        const SizedBox(height: 24),
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 6,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: AppFont.inter(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            letterSpacing: 8,
          ),
          decoration: InputDecoration(
            counterText: '',
            hintText: '000000',
            hintStyle: AppFont.inter(
              fontSize: 24,
              color: Colors.grey[300],
              letterSpacing: 8,
            ),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red, width: 2),
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
            onPressed: _confirmDeletion,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              lang == 'ne'
                  ? 'खाता मेटाउने पुष्टि गर्नुहोस्'
                  : 'Confirm Account Deletion',
              style: AppFont.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: _cooldown > 0 ? null : _requestDeletion,
          child: Text(
            _cooldown > 0
                ? (lang == 'ne'
                      ? 'पुन: पठाउनुहोस् ($_cooldown सेकेन्ड)'
                      : 'Resend ($_cooldown s)')
                : (lang == 'ne' ? 'कोड पुन: पठाउनुहोस्' : 'Resend Code'),
          ),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(lang == 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'),
        ),
      ],
    );
  }

  Widget _buildSuccess(String lang) {
    String deadlineText = '';
    if (_recoveryDeadline != null) {
      try {
        final deadline = DateTime.parse(_recoveryDeadline!);
        deadlineText = formatNepalTime(
          deadline,
          'MMM d, yyyy',
          context.locale.languageCode,
        );
      } catch (_) {
        deadlineText = _recoveryDeadline!;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 32),
        const Icon(LucideIcons.checkCircle, size: 64, color: Colors.amber),
        const SizedBox(height: 24),
        Text(
          lang == 'ne'
              ? 'खाता मेटाउन तालिकाबद्ध'
              : 'Account Scheduled for Deletion',
          style: AppFont.inter(fontSize: 20, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.amber[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.amber[300]!),
          ),
          child: Column(
            children: [
              Text(
                lang == 'ne'
                    ? 'तपाईंको खाता $deadlineText मा स्थायी रूपमा मेटिनेछ।'
                    : 'Your account will be permanently deleted on $deadlineText.',
                textAlign: TextAlign.center,
                style: AppFont.inter(fontSize: 14, color: Colors.amber[900]),
              ),
              const SizedBox(height: 8),
              Text(
                lang == 'ne'
                    ? 'त्यसअघि लगइन गरेर खाता पुनर्स्थापित गर्न सक्नुहुन्छ।'
                    : 'You can recover your account by logging in before then.',
                textAlign: TextAlign.center,
                style: AppFont.inter(fontSize: 13, color: Colors.amber[800]),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const MainNavScreen()),
                  (route) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              elevation: 0,
            ),
            child: Text(
              lang == 'ne' ? 'ठीक छ' : 'OK',
              style: AppFont.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
