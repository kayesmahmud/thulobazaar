import 'dart:async';
import 'dart:io' show Platform;
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import 'widgets/auth_kit.dart';
import '../../core/api/auth_client.dart';
import '../../core/services/analytics_service.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
import '../main_nav/main_nav_screen.dart';
import 'signin_screen.dart';

enum SignUpStep { phone, otp, details }

class SignUpScreen extends StatefulWidget {
  final VoidCallback? onSuccess;

  const SignUpScreen({super.key, this.onSuccess});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authClient = AuthClient();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: Platform.isIOS
        ? '665688327385-lbpla4ui0ghmpq2k10mmmhj1s7cvgjfd.apps.googleusercontent.com'
        : null,
    serverClientId:
        '665688327385-bc35e5a0jfis22p5d20k089l9ivm3fge.apps.googleusercontent.com',
  );

  bool _isLoading = false;
  SignUpStep _currentStep = SignUpStep.phone;
  bool _agreedToTerms = false;
  String? _verificationToken;

  // OTP timers
  int _otpCooldown = 0;
  int _otpExpiry = 0;
  Timer? _cooldownTimer;
  Timer? _expiryTimer;

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _fullNameController.dispose();
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

  void _handleGoogleLogin() async {
    setState(() => _isLoading = true);
    try {
      final account = await _googleSignIn.signIn();
      if (account == null) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final auth = await account.authentication;
      final idToken = auth.idToken;

      if (idToken == null) throw Exception("Failed to get Google ID Token");

      final authClient = AuthClient();
      final result = await authClient.googleLogin(idToken);

      if (!mounted) return;

      if (result['success'] == true) {
        final token = result['token'];
        // OAuth registers on first login, so only a brand-new account counts
        // as a sign_up conversion — returning users would inflate the metric.
        if (result['isNewUser'] == true) {
          AnalyticsService.logSignUp('google');
        }
        await context.read<AuthProvider>().login(token);

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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message'] ??
                  (context.locale.languageCode == 'ne'
                      ? 'गुगल साइन अप असफल'
                      : 'Google Sign Up failed'),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'गुगल साइन अप त्रुटि: $e'
                : 'Google Sign Up Error: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleAppleLogin() async {
    setState(() => _isLoading = true);
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final identityToken = credential.identityToken;
      if (identityToken == null) {
        throw Exception('Failed to get Apple identity token');
      }

      final authClient = AuthClient();
      final result = await authClient.appleLogin(
        identityToken,
        givenName: credential.givenName,
        familyName: credential.familyName,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        final token = result['token'];
        if (result['isNewUser'] == true) {
          AnalyticsService.logSignUp('apple');
        }
        await context.read<AuthProvider>().login(token);

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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message'] ??
                  (context.locale.languageCode == 'ne'
                      ? 'एप्पल साइन अप असफल'
                      : 'Apple Sign Up failed'),
            ),
          ),
        );
      }
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'एप्पल साइन अप त्रुटि: ${e.message}'
                : 'Apple Sign Up Error: ${e.message}',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'एप्पल साइन अप त्रुटि: $e'
                : 'Apple Sign Up Error: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
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
      final result = await _authClient.sendOtp(rawPhone);
      if (!mounted) return;

      if (result['success'] == true) {
        setState(() => _currentStep = SignUpStep.otp);
        _startCooldownTimer();
        final expiresIn = result['expiresIn'] as int? ?? 600;
        _startExpiryTimer(expiresIn);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('auth.otpSentSuccess'.tr())));
      } else {
        // Handle cooldown from API response
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
                  (context.locale.languageCode == 'ne'
                      ? 'OTP पठाउन असफल'
                      : 'Failed to send OTP'),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne' ? 'त्रुटि: $e' : 'Error: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleChangeNumber() {
    _cooldownTimer?.cancel();
    _expiryTimer?.cancel();
    setState(() {
      _currentStep = SignUpStep.phone;
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
      final verifyResult = await _authClient.verifyOtp(rawPhone, otp);
      if (!mounted) return;

      if (verifyResult['success'] == true) {
        _expiryTimer?.cancel();
        setState(() {
          _verificationToken = verifyResult['verificationToken'];
          _currentStep = SignUpStep.details;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('auth.phoneVerifiedComplete'.tr())),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              verifyResult['error'] ??
                  verifyResult['message'] ??
                  (context.locale.languageCode == 'ne'
                      ? 'अमान्य OTP'
                      : 'Invalid OTP'),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: ${e.toString().replaceAll("Exception: ", "")}',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleCreateAccount() async {
    final rawPhone = _phoneController.text.trim();
    final fullName = _fullNameController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (fullName.length < 2) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.nameMinLength'.tr())));
      return;
    }

    if (password.length < 8) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.passwordMinLength'.tr())));
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.passwordsDoNotMatch'.tr())));
      return;
    }

    if (!_agreedToTerms) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.agreeToTerms'.tr())));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final registerResult = await _authClient.register(
        rawPhone,
        password,
        fullName,
        _verificationToken!,
      );

      if (!mounted) return;

      if (registerResult['success'] == true) {
        final authToken = registerResult['token'];

        // Phone registration is unambiguous: this endpoint only ever creates.
        AnalyticsService.logSignUp('phone');

        if (authToken != null) {
          await context.read<AuthProvider>().login(authToken);
        }

        if (!mounted) return;
        if (widget.onSuccess != null) {
          widget.onSuccess!();
        } else {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const MainNavScreen()),
            (route) => false,
          );
        }
      } else {
        throw Exception(
          registerResult['error'] ??
              registerResult['message'] ??
              (context.locale.languageCode == 'ne'
                  ? 'दर्ता असफल'
                  : 'Registration failed'),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: ${e.toString().replaceAll("Exception: ", "")}',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
  @override
  Widget build(BuildContext context) {
    final ne = context.locale.languageCode == 'ne';
    final stage = _currentStep;
    final details = stage == SignUpStep.details;
    final phone = _phoneController.text.trim();

    return AuthShell(
      title: details
          ? 'auth.completeRegistration'.tr()
          : 'auth.createAccount'.tr(),
      subtitle: details ? 'auth.fillDetails'.tr() : 'auth.joinSubtitle'.tr(),
      step: stage.index + 1,
      totalSteps: SignUpStep.values.length,
      // Back from the OTP step returns to the number, it does not leave sign-up.
      onBack: stage == SignUpStep.otp
          ? _handleChangeNumber
          : () => Navigator.pop(context),
      children: [
        // ============== STEP 1: PHONE ==============
        if (stage == SignUpStep.phone) ...[
          googleButton(
            label: 'auth.continueWithGoogle'.tr(),
            onTap: _isLoading ? null : _handleGoogleLogin,
          ),
          if (Platform.isIOS) ...[
            const SizedBox(height: 12),
            SignInWithAppleButton(
              onPressed: _isLoading ? () {} : _handleAppleLogin,
              style: SignInWithAppleButtonStyle.black,
              borderRadius: BorderRadius.circular(14),
              height: 52,
            ),
          ],
          const SizedBox(height: 20),
          authDivider('auth.orRegisterWithPhone'.tr(), ne),
          const SizedBox(height: 20),
          AuthField(
            controller: _phoneController,
            label: 'auth.phoneRequired'.tr(),
            hint: 'auth.phonePlaceholder'.tr(),
            keyboardType: TextInputType.phone,
            maxLength: 10,
            prefix: Text('auth.phonePrefix'.tr()),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 8),
          Text('auth.phoneValidation'.tr(), style: AuthT.caption(ne)),
          const SizedBox(height: 20),
          authButton(
            label: _otpCooldown > 0
                ? 'auth.resendIn'.tr(args: ['$_otpCooldown'])
                : 'auth.sendOtp'.tr(),
            loading: _isLoading,
            onTap: _isLoading || _otpCooldown > 0 ? null : _handleSendOtp,
          ),
        ],

        // ============== STEP 2: OTP ==============
        if (stage == SignUpStep.otp) ...[
          Center(
            child: Column(
              children: [
                Text('auth.otpSentTo'.tr(args: [phone]),
                    style: AuthT.caption(ne), textAlign: TextAlign.center),
                if (_otpExpiry > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'auth.otpExpiresIn'.tr(args: [_formatTime(_otpExpiry)]),
                      style: AuthT.caption(ne)
                          .copyWith(color: const Color(0xFFB45309)),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          AuthField(
            controller: _otpController,
            label: 'auth.enterOtp'.tr(),
            hint: 'auth.otpPlaceholder'.tr(),
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
                fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: 8),
            // Without this the Verify button stays disabled after the sixth
            // digit until some other rebuild happens to land.
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 20),
          authButton(
            label: 'auth.verifyOtp'.tr(),
            loading: _isLoading,
            onTap: _isLoading || _otpController.text.trim().length != 6
                ? null
                : _handleVerifyOtp,
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton(
                onPressed: _handleChangeNumber,
                child: Text('auth.changeNumber'.tr(), style: AuthT.caption(ne)),
              ),
              TextButton(
                onPressed:
                    _isLoading || _otpCooldown > 0 ? null : _handleSendOtp,
                child: Text(
                  _otpCooldown > 0
                      ? 'auth.resendIn'.tr(args: ['$_otpCooldown'])
                      : 'auth.resendOtp'.tr(),
                  style: _otpCooldown > 0
                      ? AuthT.caption(ne)
                      : AuthT.link().copyWith(fontSize: 13),
                ),
              ),
            ],
          ),
        ],

        // ============== STEP 3: DETAILS ==============
        if (details) ...[
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.checkCircle,
                    color: AppTheme.success, size: 18),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'auth.phoneVerified'.tr(args: [phone]),
                    style: AuthT.label(ne)
                        .copyWith(color: const Color(0xFF047857)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          AuthField(
            controller: _fullNameController,
            label: 'auth.fullName'.tr(),
            hint: 'auth.enterFullName'.tr(),
            icon: LucideIcons.user,
            textCapitalization: TextCapitalization.words,
          ),
          const SizedBox(height: 16),
          AuthField(
            controller: _passwordController,
            label: 'auth.passwordRequired'.tr(),
            hint: 'auth.atLeast8Chars'.tr(),
            obscure: true,
            icon: LucideIcons.lock,
          ),
          const SizedBox(height: 16),
          AuthField(
            controller: _confirmPasswordController,
            label: 'auth.confirmPassword'.tr(),
            hint: 'auth.reEnterPassword'.tr(),
            obscure: true,
            icon: LucideIcons.lock,
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 24,
                width: 24,
                child: Checkbox(
                  value: _agreedToTerms,
                  onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4)),
                  activeColor: AuthT.brand,
                  side: const BorderSide(color: Color(0xFF9CA3AF)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text('auth.iAgreeTo'.tr(), style: AuthT.caption(ne)),
                    InkWell(
                      onTap: () => _openUrl(
                          'https://thulobazaar.com.np/en/support/terms-of-service'),
                      child: Text('auth.termsAndConditions'.tr(),
                          style: AuthT.link().copyWith(fontSize: 13)),
                    ),
                    Text('auth.and'.tr(), style: AuthT.caption(ne)),
                    InkWell(
                      onTap: () => _openUrl(
                          'https://thulobazaar.com.np/en/support/privacy-policy'),
                      child: Text('auth.privacyPolicy'.tr(),
                          style: AuthT.link().copyWith(fontSize: 13)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          authButton(
            label: 'auth.createAccount'.tr(),
            loading: _isLoading,
            fill: AppTheme.success,
            onTap: _isLoading || !_agreedToTerms ? null : _handleCreateAccount,
          ),
        ],

        const SizedBox(height: 20),
        authDivider('auth.alreadyHaveAccount'.tr(), ne),
        const SizedBox(height: 20),
        authButton(
          label: 'auth.signInInstead'.tr(),
          filled: false,
          onTap: () => Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => SignInScreen(onSuccess: widget.onSuccess),
            ),
          ),
        ),
      ],
    );
  }
}
