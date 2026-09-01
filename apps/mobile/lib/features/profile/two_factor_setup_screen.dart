import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_client.dart';

class TwoFactorSetupScreen extends StatefulWidget {
  final VoidCallback? onComplete;

  const TwoFactorSetupScreen({super.key, this.onComplete});

  @override
  State<TwoFactorSetupScreen> createState() => _TwoFactorSetupScreenState();
}

enum _SetupStep { loading, qrCode, verify, backupCodes }

class _TwoFactorSetupScreenState extends State<TwoFactorSetupScreen> {
  final _authClient = AuthClient();
  final _codeController = TextEditingController();

  _SetupStep _step = _SetupStep.loading;
  String? _qrCodeBase64;
  String? _secret;
  List<String>? _backupCodes;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initSetup();
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _initSetup() async {
    try {
      final result = await _authClient.setup2FA();
      if (!mounted) return;

      if (result['success'] == true) {
        setState(() {
          _qrCodeBase64 = result['data']['qrCode'];
          _secret = result['data']['secret'];
          _step = _SetupStep.qrCode;
        });
      } else {
        setState(() => _error = result['message'] ?? 'Failed to setup 2FA');
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  Future<void> _verifyCode() async {
    final code = _codeController.text.trim();
    if (code.length != 6) {
      setState(
        () => _error = context.locale.languageCode == 'ne'
            ? '६-अंकको कोड प्रविष्ट गर्नुहोस्'
            : 'Enter a 6-digit code',
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await _authClient.verify2FASetup(code);
      if (!mounted) return;

      if (result['success'] == true) {
        final codes = (result['data']['backupCodes'] as List).cast<String>();
        setState(() {
          _backupCodes = codes;
          _step = _SetupStep.backupCodes;
        });
      } else {
        setState(() => _error = result['message'] ?? 'Verification failed');
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _copyBackupCodes() {
    if (_backupCodes == null) return;
    Clipboard.setData(ClipboardData(text: _backupCodes!.join('\n')));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          context.locale.languageCode == 'ne'
              ? 'ब्याकअप कोडहरू कपि गरियो'
              : 'Backup codes copied',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;

    return Scaffold(
      appBar: AppBar(
        title: Text(lang == 'ne' ? '2FA सेटअप' : '2FA Setup'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0.5,
      ),
      body: _error != null && _step == _SetupStep.loading
          ? _buildError()
          : _step == _SetupStep.loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: _buildCurrentStep(lang),
            ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.alertCircle, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _error = null;
                  _step = _SetupStep.loading;
                });
                _initSetup();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStep(String lang) {
    switch (_step) {
      case _SetupStep.qrCode:
        return _buildQrStep(lang);
      case _SetupStep.verify:
        return _buildVerifyStep(lang);
      case _SetupStep.backupCodes:
        return _buildBackupCodesStep(lang);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildQrStep(String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          lang == 'ne'
              ? 'चरण १: QR कोड स्क्यान गर्नुहोस्'
              : 'Step 1: Scan QR Code',
          style: AppFont.inter(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          lang == 'ne'
              ? 'Google Authenticator वा कुनै TOTP एपले यो QR कोड स्क्यान गर्नुहोस्'
              : 'Scan this QR code with Google Authenticator or any TOTP app',
          textAlign: TextAlign.center,
          style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),
        if (_qrCodeBase64 != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Image.memory(
              base64Decode(_qrCodeBase64!.split(',').last),
              width: 200,
              height: 200,
            ),
          ),
        const SizedBox(height: 24),
        Text(
          lang == 'ne'
              ? 'वा म्यानुअल कोड प्रयोग गर्नुहोस्:'
              : 'Or enter this code manually:',
          style: AppFont.inter(fontSize: 13, color: Colors.grey[600]),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () {
            if (_secret != null) {
              Clipboard.setData(ClipboardData(text: _secret!));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(lang == 'ne' ? 'कपि गरियो' : 'Copied')),
              );
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    _secret ?? '',
                    style: AppFont.robotoMono(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(LucideIcons.copy, size: 16, color: Colors.grey),
              ],
            ),
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => setState(() => _step = _SetupStep.verify),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              lang == 'ne' ? 'अर्को' : 'Next',
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

  Widget _buildVerifyStep(String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          lang == 'ne'
              ? 'चरण २: कोड प्रमाणित गर्नुहोस्'
              : 'Step 2: Verify Code',
          style: AppFont.inter(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          lang == 'ne'
              ? 'तपाईंको authenticator एपबाट ६-अंकको कोड प्रविष्ट गर्नुहोस्'
              : 'Enter the 6-digit code from your authenticator app',
          textAlign: TextAlign.center,
          style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 32),
        TextField(
          controller: _codeController,
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
              borderSide: const BorderSide(color: AppTheme.primary, width: 2),
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
            onPressed: _isLoading ? null : _verifyCode,
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
                    lang == 'ne' ? 'प्रमाणित गर्नुहोस्' : 'Verify & Enable',
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
          onPressed: () => setState(() {
            _step = _SetupStep.qrCode;
            _error = null;
            _codeController.clear();
          }),
          child: Text(lang == 'ne' ? 'पछाडि जानुहोस्' : 'Go Back'),
        ),
      ],
    );
  }

  Widget _buildBackupCodesStep(String lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Icon(LucideIcons.checkCircle, size: 48, color: Colors.green),
        const SizedBox(height: 16),
        Text(
          lang == 'ne' ? '2FA सक्रिय भयो!' : '2FA Enabled!',
          style: AppFont.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.amber[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.amber[300]!),
          ),
          child: Row(
            children: [
              const Icon(
                LucideIcons.alertTriangle,
                color: Colors.amber,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  lang == 'ne'
                      ? 'यी ब्याकअप कोडहरू सुरक्षित रूपमा सेभ गर्नुहोस्। यो फेरि देखाइने छैन।'
                      : 'Save these backup codes securely. They won\'t be shown again.',
                  style: AppFont.inter(fontSize: 13, color: Colors.amber[900]),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            children: [
              if (_backupCodes != null)
                ...List.generate((_backupCodes!.length / 2).ceil(), (i) {
                  final idx1 = i * 2;
                  final idx2 = i * 2 + 1;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            _backupCodes![idx1],
                            style: AppFont.robotoMono(fontSize: 14),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        if (idx2 < _backupCodes!.length)
                          Expanded(
                            child: Text(
                              _backupCodes![idx2],
                              style: AppFont.robotoMono(fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                          ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: _copyBackupCodes,
          icon: const Icon(LucideIcons.copy, size: 16),
          label: Text(lang == 'ne' ? 'सबै कपि गर्नुहोस्' : 'Copy All Codes'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.primary,
            side: const BorderSide(color: AppTheme.primary),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              widget.onComplete?.call();
              Navigator.pop(context, true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              lang == 'ne' ? 'सम्पन्न' : 'Done',
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
