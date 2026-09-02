import 'dart:io' show Platform;
import 'package:easy_localization/easy_localization.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'widgets/auth_kit.dart';
import '../../core/api/auth_client.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
import 'signup_screen.dart';
import 'two_factor_verify_screen.dart';
import 'forgot_password_screen.dart';
import '../main_nav/main_nav_screen.dart';

class SignInScreen extends StatefulWidget {
  final bool isEmbedded;
  final VoidCallback? onSuccess;

  const SignInScreen({super.key, this.isEmbedded = false, this.onSuccess});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  static const String _rememberMeKey = 'remember_me';
  static const String _savedPhoneKey = 'saved_phone';

  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: Platform.isIOS
        ? '665688327385-lbpla4ui0ghmpq2k10mmmhj1s7cvgjfd.apps.googleusercontent.com'
        : null,
    serverClientId:
        '665688327385-bc35e5a0jfis22p5d20k089l9ivm3fge.apps.googleusercontent.com',
  );

  bool _rememberMe = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadSavedCredentials();
  }

  Future<void> _loadSavedCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    final rememberMe = prefs.getBool(_rememberMeKey) ?? false;
    final savedPhone = prefs.getString(_savedPhoneKey) ?? '';

    if (rememberMe && savedPhone.isNotEmpty) {
      setState(() {
        _rememberMe = true;
        _phoneController.text = savedPhone;
      });
    }
  }

  Future<void> _saveCredentials(String phone) async {
    final prefs = await SharedPreferences.getInstance();
    if (_rememberMe) {
      await prefs.setBool(_rememberMeKey, true);
      await prefs.setString(_savedPhoneKey, phone);
    } else {
      await prefs.remove(_rememberMeKey);
      await prefs.remove(_savedPhoneKey);
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  /// Shows the account recovery dialog when a pending-deletion user logs in.
  /// Returns true if the user chose to keep their account, false otherwise.
  Future<bool> _showAccountRecoveryDialog(
    String token,
    String? deletionDate,
  ) async {
    final lang = context.locale.languageCode;

    // Calculate days remaining
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
                  backgroundColor: AuthT.brand,
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
      // User wants to keep account — cancel deletion
      final authClient = AuthClient();
      final cancelResult = await authClient.cancelAccountDeletion();
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

    // User chose to continue with deletion — log out
    if (mounted) {
      await context.read<AuthProvider>().logout();
    }
    return false;
  }

  /// Handles post-login flow: checks for pending deletion, then proceeds to app
  Future<void> _proceedAfterLogin(
    String token,
    Map<String, dynamic> result,
  ) async {
    if (result['accountPendingDeletion'] == true) {
      // Log in first so the cancel-deletion endpoint has a valid token
      await context.read<AuthProvider>().login(token);
      if (!mounted) return;

      final keepAccount = await _showAccountRecoveryDialog(
        token,
        result['deletionDate']?.toString(),
      );
      if (!keepAccount || !mounted) return;
    } else {
      await context.read<AuthProvider>().login(token);
    }

    if (!mounted) return;
    final onSuccess = widget.onSuccess;
    if (onSuccess != null) {
      // Safety net: login has ALREADY succeeded at this point. Callers pass
      // navigation callbacks that can capture dead contexts (closed bottom
      // sheets etc.) and crash with "Null check operator used on a null
      // value" — the user then sees an error for a login that worked. If the
      // callback blows up, log it and fall back to the home screen instead.
      try {
        onSuccess();
      } catch (e, stack) {
        debugPrint('Post-login onSuccess callback failed: $e\n$stack');
        if (mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const MainNavScreen()),
            (route) => false,
          );
        }
      }
    } else {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const MainNavScreen()),
        (route) => false,
      );
    }
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
        await _proceedAfterLogin(result['token'], result);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'auth.googleLoginFailed'.tr()),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'गुगल लगइन त्रुटि: $e'
                : 'Google Login Error: $e',
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
        await _proceedAfterLogin(result['token'], result);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'auth.appleLoginFailed'.tr()),
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
                ? 'एप्पल लगइन त्रुटि: ${e.message}'
                : 'Apple Login Error: ${e.message}',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'एप्पल लगइन त्रुटि: $e'
                : 'Apple Login Error: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleLogin() async {
    final rawPhone = _phoneController.text.trim();
    final password = _passwordController.text;

    if (rawPhone.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('auth.enterPhoneAndPassword'.tr())),
      );
      return;
    }

    // Prepend Nepal country code
    final phone = "+977$rawPhone";
    setState(() => _isLoading = true);

    try {
      // Use helper to get token, then provider to set state
      final authClient = AuthClient();
      final result = await authClient.login(phone, password);

      if (!mounted) return;

      if (result['success'] == true) {
        // Check if 2FA is required
        if (result['requires2FA'] == true) {
          await _saveCredentials(rawPhone);
          if (mounted) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => TwoFactorVerifyScreen(
                  tempToken: result['tempToken'],
                  onSuccess: widget.onSuccess,
                ),
              ),
            );
          }
          return;
        }

        await _saveCredentials(rawPhone);
        await _proceedAfterLogin(result['token'], result);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message'] ??
                  (context.locale.languageCode == 'ne'
                      ? 'लगइन असफल'
                      : 'Login failed'),
            ),
          ),
        );
      }
    } catch (e, stack) {
      // Surface the real failure in logs — a swallowed stack made this class
      // of "Null check operator" login error undiagnosable for months.
      debugPrint('Phone login failed: $e\n$stack');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'त्रुटि भयो: $e'
                : 'An error occurred: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  @override
  Widget build(BuildContext context) {
    final ne = context.locale.languageCode == 'ne';
    // Devanagari sits on taller line boxes than Latin, so the same content
    // runs past the fold in Nepali and the bottom CTA needs a scroll to reach.
    // Tightening only the Nepali rhythm brings it back into view and leaves
    // the English layout byte-identical.
    final gap = ne ? 13.0 : 20.0;

    return AuthShell(
      title: 'auth.welcomeBack'.tr(),
      subtitle: 'auth.loginSubtitle'.tr(),
      onBack: widget.isEmbedded ? null : () => Navigator.pop(context),
      children: [
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
        SizedBox(height: gap),
        authDivider('auth.orSignInWithPhone'.tr(), ne),
        SizedBox(height: gap),
        AuthField(
          key: const ValueKey('signin_phone'),
          controller: _phoneController,
          label: 'auth.phoneNumber'.tr(),
          hint: 'auth.phonePlaceholder'.tr(),
          keyboardType: TextInputType.phone,
          prefix: Text('auth.phonePrefix'.tr()),
        ),
        const SizedBox(height: 16),
        AuthField(
          key: const ValueKey('signin_password'),
          controller: _passwordController,
          label: 'auth.password'.tr(),
          hint: 'auth.enterPassword'.tr(),
          obscure: true,
          icon: LucideIcons.lock,
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            SizedBox(
              height: 20,
              width: 20,
              child: Checkbox(
                value: _rememberMe,
                onChanged: (val) => setState(() => _rememberMe = val!),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
                activeColor: AuthT.brand,
                side: const BorderSide(color: Color(0xFF9CA3AF)),
              ),
            ),
            const SizedBox(width: 10),
            Text('auth.rememberMe'.tr(), style: AuthT.caption(ne)),
            const Spacer(),
            InkWell(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
              ),
              child: Text('auth.forgotPassword'.tr(), style: AuthT.link()),
            ),
          ],
        ),
        SizedBox(height: gap),
        authButton(
          label: 'auth.signIn'.tr(),
          loading: _isLoading,
          onTap: _isLoading ? null : _handleLogin,
        ),
        SizedBox(height: gap),
        authDivider('auth.dontHaveAccount'.tr(), ne),
        SizedBox(height: gap),
        authButton(
          label: 'auth.createAccount'.tr(),
          filled: false,
          onTap: () => Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => SignUpScreen(onSuccess: widget.onSuccess),
            ),
          ),
        ),
      ],
    );
  }
}
