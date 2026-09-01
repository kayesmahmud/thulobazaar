import 'dart:async';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_client.dart';

enum ForgotPasswordStep { phone, otp, newPassword }

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authClient = AuthClient();

  bool _isLoading = false;
  ForgotPasswordStep _currentStep = ForgotPasswordStep.phone;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _verificationToken;

  int _otpCooldown = 0;
  int _otpExpiry = 0;
  Timer? _cooldownTimer;
  Timer? _expiryTimer;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _cooldownTimer?.cancel();
    _expiryTimer?.cancel();
    super.dispose();
  }

  bool _isValidNepaliPhone(String phone) {
    return RegExp(r'^(97|98)\d{8}$').hasMatch(phone);
  }

  String _formatTime(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '$mins:${secs.toString().padLeft(2, '0')}';
  }

  void _startCooldownTimer() {
    _cooldownTimer?.cancel();
    setState(() => _otpCooldown = 60);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_otpCooldown <= 1) {
        timer.cancel();
        if (mounted) setState(() => _otpCooldown = 0);
      } else {
        if (mounted) setState(() => _otpCooldown--);
      }
    });
  }

  void _startExpiryTimer(int expiresIn) {
    _expiryTimer?.cancel();
    setState(() => _otpExpiry = expiresIn);
    _expiryTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_otpExpiry <= 1) {
        timer.cancel();
        if (mounted) setState(() => _otpExpiry = 0);
      } else {
        if (mounted) setState(() => _otpExpiry--);
      }
    });
  }

  void _handleSendOtp() async {
    final rawPhone = _phoneController.text.trim();

    if (!_isValidNepaliPhone(rawPhone)) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.invalidPhone'.tr())));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _authClient.sendOtp(
        rawPhone,
        purpose: 'password_reset',
      );
      if (!mounted) return;

      if (result['success'] == true) {
        setState(() => _currentStep = ForgotPasswordStep.otp);
        _startCooldownTimer();
        final expiresIn = result['expiresIn'] as int? ?? 600;
        _startExpiryTimer(expiresIn);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('forgotPassword.otpSent'.tr())));
      } else {
        final cooldown = result['cooldownRemaining'] as int?;
        if (cooldown != null) {
          setState(() => _otpCooldown = cooldown);
          _startCooldownTimer();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['error'] ??
                  result['message'] ??
                  'forgotPassword.sendOtpFailed'.tr(),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleChangeNumber() {
    _cooldownTimer?.cancel();
    _expiryTimer?.cancel();
    setState(() {
      _currentStep = ForgotPasswordStep.phone;
      _otpController.clear();
      _otpCooldown = 0;
      _otpExpiry = 0;
      _verificationToken = null;
    });
  }

  void _handleVerifyOtp() async {
    final rawPhone = _phoneController.text.trim();
    final otp = _otpController.text.trim();

    if (otp.length != 6) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.enterValidOtp'.tr())));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _authClient.verifyOtp(
        rawPhone,
        otp,
        purpose: 'password_reset',
      );
      if (!mounted) return;

      if (result['success'] == true) {
        _expiryTimer?.cancel();
        setState(() {
          _verificationToken = result['verificationToken'];
          _currentStep = ForgotPasswordStep.newPassword;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('forgotPassword.otpVerified'.tr())),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['error'] ??
                  result['message'] ??
                  'forgotPassword.invalidOtp'.tr(),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleResetPassword() async {
    final rawPhone = _phoneController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (password.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('forgotPassword.passwordMinLength'.tr())),
      );
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('forgotPassword.passwordsDoNotMatch'.tr())),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _authClient.resetPassword(
        rawPhone,
        password,
        _verificationToken!,
      );
      if (!mounted) return;

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('forgotPassword.resetSuccess'.tr()),
            backgroundColor: AppTheme.success,
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['error'] ??
                  result['message'] ??
                  'forgotPassword.resetFailed'.tr(),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
          onPressed: () {
            if (_currentStep == ForgotPasswordStep.otp) {
              _handleChangeNumber();
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: Image.asset(
          'assets/images/logo.png',
          height: 28,
          fit: BoxFit.contain,
          errorBuilder: (ctx, err, stack) => Text(
            'common.appNameFallback'.tr(),
            style: AppFont.poppins(
              color: AppTheme.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Text(
              'common.appName'.tr(),
              style: AppFont.inter(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'forgotPassword.title'.tr(),
              style: AppFont.inter(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _currentStep == ForgotPasswordStep.newPassword
                  ? 'forgotPassword.createNewPassword'.tr()
                  : 'forgotPassword.subtitle'.tr(),
              style: AppFont.inter(fontSize: 16, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey[200]!),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ============== STEP 1: PHONE ==============
                  if (_currentStep == ForgotPasswordStep.phone) ...[
                    Text(
                      'forgotPassword.phoneLabel'.tr(),
                      style: AppFont.inter(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textDark,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildPhoneInput(),
                    const SizedBox(height: 8),
                    Text(
                      'auth.phoneValidation'.tr(),
                      style: AppFont.inter(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading || _otpCooldown > 0
                            ? null
                            : _handleSendOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          elevation: 0,
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
                                _otpCooldown > 0
                                    ? 'auth.resendIn'.tr(
                                        args: ['$_otpCooldown'],
                                      )
                                    : 'forgotPassword.sendOtp'.tr(),
                                style: AppFont.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],

                  // ============== STEP 2: OTP ==============
                  if (_currentStep == ForgotPasswordStep.otp) ...[
                    Center(
                      child: Column(
                        children: [
                          Text(
                            'auth.otpSentTo'.tr(
                              args: [_phoneController.text.trim()],
                            ),
                            style: AppFont.inter(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                          if (_otpExpiry > 0)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Expires in ${_formatTime(_otpExpiry)}',
                                style: AppFont.inter(
                                  fontSize: 12,
                                  color: Colors.orange[700],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    Text(
                      'auth.enterOtp'.tr(),
                      style: AppFont.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      style: AppFont.inter(fontSize: 24, letterSpacing: 8),
                      decoration: InputDecoration(
                        hintText: 'auth.otpPlaceholder'.tr(),
                        counterText: "",
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed:
                            _isLoading || _otpController.text.trim().length != 6
                            ? null
                            : _handleVerifyOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          elevation: 0,
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
                                'auth.verifyOtp'.tr(),
                                style: AppFont.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: _handleChangeNumber,
                          child: Text(
                            'auth.changeNumber'.tr(),
                            style: AppFont.inter(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: _isLoading || _otpCooldown > 0
                              ? null
                              : _handleSendOtp,
                          child: Text(
                            _otpCooldown > 0
                                ? 'auth.resendIn'.tr(args: ['$_otpCooldown'])
                                : 'auth.resendOtp'.tr(),
                            style: AppFont.inter(
                              fontSize: 13,
                              color: _otpCooldown > 0
                                  ? Colors.grey[400]
                                  : AppTheme.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],

                  // ============== STEP 3: NEW PASSWORD ==============
                  if (_currentStep == ForgotPasswordStep.newPassword) ...[
                    // Verified phone badge
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Colors.grey[200]!),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            LucideIcons.checkCircle,
                            color: AppTheme.success,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '+977 ${_phoneController.text.trim()} verified',
                            style: AppFont.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.success,
                            ),
                          ),
                        ],
                      ),
                    ),

                    Text(
                      'forgotPassword.newPassword'.tr(),
                      style: AppFont.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        hintText: 'forgotPassword.newPasswordHint'.tr(),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        suffixIcon: IconButton(
                          icon: AnimatedRotation(
                            turns: _obscurePassword ? 0 : 0.5,
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              _obscurePassword
                                  ? LucideIcons.eye
                                  : LucideIcons.eyeOff,
                              color: Colors.grey,
                            ),
                          ),
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Text(
                      'forgotPassword.confirmPassword'.tr(),
                      style: AppFont.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: _obscureConfirmPassword,
                      decoration: InputDecoration(
                        hintText: 'forgotPassword.confirmPasswordHint'.tr(),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        suffixIcon: IconButton(
                          icon: AnimatedRotation(
                            turns: _obscureConfirmPassword ? 0 : 0.5,
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              _obscureConfirmPassword
                                  ? LucideIcons.eye
                                  : LucideIcons.eyeOff,
                              color: Colors.grey,
                            ),
                          ),
                          onPressed: () => setState(
                            () => _obscureConfirmPassword =
                                !_obscureConfirmPassword,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleResetPassword,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.success,
                          elevation: 0,
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
                                'forgotPassword.resetPassword'.tr(),
                                style: AppFont.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhoneInput() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: Colors.grey[300]!)),
              color: Colors.grey[50],
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                bottomLeft: Radius.circular(8),
              ),
            ),
            child: Text(
              'auth.phonePrefix'.tr(),
              style: AppFont.inter(
                fontWeight: FontWeight.w500,
                color: AppTheme.textDark,
                fontSize: 15,
              ),
            ),
          ),
          Expanded(
            child: TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              decoration: InputDecoration(
                hintText: 'auth.phonePlaceholder'.tr(),
                counterText: "",
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              style: AppFont.inter(fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }
}
