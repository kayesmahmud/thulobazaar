import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/api/auth_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/profile/phone_verification_screen.dart';
import 'package:mobile/features/profile/two_factor_setup_screen.dart';
import 'package:mobile/features/profile/delete_account_screen.dart';
import 'package:intl/intl.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/utils/localized_helpers.dart';

class SecuritySettingsScreen extends StatefulWidget {
  // ... (rest of class)
  const SecuritySettingsScreen({super.key});

  @override
  State<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends State<SecuritySettingsScreen> {
  final AuthClient _authClient = AuthClient();
  bool _isLoading = false;
  bool _is2faEnabled = false;
  List<dynamic> _sessions = [];
  bool _isLoadingSessions = true;
  String? _phone;
  bool _isPhoneVerified = false;

  @override
  void initState() {
    super.initState();
    _fetchSecurityData();
  }

  Future<void> _fetchSecurityData() async {
    setState(() => _isLoadingSessions = true);
    try {
      // Fetch 2FA status from profile (or separate endpoint if available)
      // Since we added 2FA status to profile response, we can use getProfile
      final profile = await _authClient.getProfile();
      final sessionsData = await _authClient.getSessions();

      if (mounted) {
        setState(() {
          _is2faEnabled = profile['data']['twoFactorEnabled'] ?? false;
          _sessions = sessionsData['data'] ?? [];
          _phone = profile['data']['phone'];
          _isPhoneVerified = profile['data']['phoneVerified'] ?? false;
          _isLoadingSessions = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingSessions = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.locale.languageCode == 'ne'
                  ? 'सुरक्षा सेटिङहरू लोड गर्न असफल: $e'
                  : 'Failed to load security settings: $e',
            ),
          ),
        );
      }
    }
  }

  void _handle2FATap() {
    if (_is2faEnabled) {
      _showDisable2FADialog();
    } else {
      _navigateTo2FASetup();
    }
  }

  Future<void> _navigateTo2FASetup() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => TwoFactorSetupScreen(onComplete: _fetchSecurityData),
      ),
    );
    if (result == true) _fetchSecurityData();
  }

  void _showDisable2FADialog() {
    final passwordController = TextEditingController();
    final codeController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) {
        final lang = dialogContext.locale.languageCode;
        return AlertDialog(
          title: Text(lang == 'ne' ? '2FA निष्क्रिय गर्नुहोस्' : 'Disable 2FA'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                lang == 'ne'
                    ? 'निष्क्रिय गर्न पासवर्ड र 2FA कोड आवश्यक छ'
                    : 'Enter your password and current 2FA code to disable',
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: lang == 'ne' ? 'पासवर्ड' : 'Password',
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: codeController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: InputDecoration(
                  labelText: lang == 'ne' ? '2FA कोड' : '2FA Code',
                  counterText: '',
                  border: const OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(l('cancel', lang)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () async {
                Navigator.pop(dialogContext);
                await _disable2FA(passwordController.text, codeController.text);
              },
              child: Text(
                lang == 'ne' ? 'निष्क्रिय गर्नुहोस्' : 'Disable',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _disable2FA(String password, String code) async {
    if (password.isEmpty || code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'पासवर्ड र कोड आवश्यक छ'
                : 'Password and code are required',
          ),
        ),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      final result = await _authClient.disable2FA(password, code);
      if (result['success'] == true) {
        setState(() => _is2faEnabled = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.locale.languageCode == 'ne'
                    ? '2FA निष्क्रिय गरियो'
                    : '2FA disabled successfully',
              ),
            ),
          );
        }
      } else {
        throw Exception(result['message']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.locale.languageCode == 'ne'
                  ? '2FA निष्क्रिय गर्न असफल: $e'
                  : 'Failed to disable 2FA: $e',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _revokeSession(int sessionId) async {
    try {
      final result = await _authClient.revokeSession(sessionId);
      if (result['success'] == true) {
        setState(() {
          _sessions.removeWhere((s) => s['id'] == sessionId);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.locale.languageCode == 'ne'
                    ? 'सत्र सफलतापूर्वक रद्द गरियो'
                    : 'Session revoked successfully',
              ),
            ),
          );
        }
      } else {
        throw Exception(result['message']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.locale.languageCode == 'ne'
                  ? 'सत्र रद्द गर्न असफल: $e'
                  : 'Failed to revoke session: $e',
            ),
          ),
        );
      }
    }
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (dialogContext) {
        final lang = dialogContext.locale.languageCode;
        return AlertDialog(
          title: Text(lang == 'ne' ? 'पासवर्ड परिवर्तन' : 'Change Password'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: currentPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: lang == 'ne'
                        ? 'हालको पासवर्ड'
                        : 'Current Password',
                  ),
                  validator: (v) => v?.isEmpty == true
                      ? (lang == 'ne' ? 'आवश्यक' : 'Required')
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: newPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: lang == 'ne' ? 'नयाँ पासवर्ड' : 'New Password',
                  ),
                  validator: (v) => (v?.length ?? 0) < 6
                      ? (lang == 'ne' ? 'कम्तीमा ६ अक्षर' : 'Min 6 chars')
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: confirmPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: lang == 'ne'
                        ? 'नयाँ पासवर्ड पुष्टि गर्नुहोस्'
                        : 'Confirm New Password',
                  ),
                  validator: (v) {
                    if (v?.isEmpty == true)
                      return lang == 'ne' ? 'आवश्यक' : 'Required';
                    if (v != newPasswordController.text)
                      return lang == 'ne'
                          ? 'पासवर्ड मिलेन'
                          : 'Passwords do not match';
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(l('cancel', lang)),
            ),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  Navigator.pop(dialogContext); // Close dialog first
                  _changePassword(
                    currentPasswordController.text,
                    newPasswordController.text,
                  );
                }
              },
              child: Text(lang == 'ne' ? 'परिवर्तन गर्नुहोस्' : 'Change'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _changePassword(String current, String newPass) async {
    setState(() => _isLoading = true);
    try {
      final result = await _authClient.changePassword(current, newPass);
      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.locale.languageCode == 'ne'
                    ? 'पासवर्ड सफलतापूर्वक परिवर्तन भयो'
                    : 'Password changed successfully',
              ),
            ),
          );
        }
      } else {
        throw Exception(result['message']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.locale.languageCode == 'ne'
                  ? 'पासवर्ड परिवर्तन गर्न असफल: $e'
                  : 'Failed to change password: $e',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          context.locale.languageCode == 'ne'
              ? 'सुरक्षा सेटिङहरू'
              : 'Security Settings',
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0.5,
      ),
      body: _isLoading && _sessions.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildSectionTitle(
                  context.locale.languageCode == 'ne'
                      ? 'पासवर्ड र प्रमाणीकरण'
                      : 'Password & Authentication',
                ),
                Card(
                  elevation: 0,
                  color: Colors.grey[50],
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.grey[200]!),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: Icon(
                          _isPhoneVerified
                              ? LucideIcons.badgeCheck
                              : LucideIcons.smartphoneNfc,
                          color: _isPhoneVerified
                              ? Colors.green
                              : AppTheme.primary,
                        ),
                        title: Text(
                          context.locale.languageCode == 'ne'
                              ? 'फोन प्रमाणीकरण'
                              : 'Phone Verification',
                        ),
                        subtitle: Text(
                          _isPhoneVerified
                              ? (context.locale.languageCode == 'ne'
                                    ? 'प्रमाणित: $_phone'
                                    : 'Verified: $_phone')
                              : (context.locale.languageCode == 'ne'
                                    ? 'तपाईंको फोन नम्बर प्रमाणित गर्नुहोस्'
                                    : 'Verify your phone number'),
                        ),
                        trailing: const Icon(LucideIcons.chevronRight),
                        onTap: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => PhoneVerificationScreen(
                                isChanging: _isPhoneVerified,
                                currentPhone: _isPhoneVerified ? _phone : null,
                                onVerified: _fetchSecurityData,
                              ),
                            ),
                          );
                          _fetchSecurityData();
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(
                          LucideIcons.lock,
                          color: AppTheme.primary,
                        ),
                        title: Text(
                          context.locale.languageCode == 'ne'
                              ? 'पासवर्ड परिवर्तन'
                              : 'Change Password',
                        ),
                        subtitle: Text(
                          context.locale.languageCode == 'ne'
                              ? 'तपाईंको लगइन पासवर्ड अपडेट गर्नुहोस्'
                              : 'Update your login password',
                        ),
                        trailing: const Icon(LucideIcons.chevronRight),
                        onTap: _showChangePasswordDialog,
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Icon(
                          LucideIcons.shield,
                          color: _is2faEnabled
                              ? Colors.green
                              : AppTheme.primary,
                        ),
                        title: Text(
                          context.locale.languageCode == 'ne'
                              ? 'दुई-चरण प्रमाणीकरण'
                              : 'Two-Factor Authentication',
                        ),
                        subtitle: Text(
                          _is2faEnabled
                              ? (context.locale.languageCode == 'ne'
                                    ? 'सक्रिय — निष्क्रिय गर्न ट्याप गर्नुहोस्'
                                    : 'Enabled — Tap to disable')
                              : (context.locale.languageCode == 'ne'
                                    ? '2FA सँग तपाईंको खाता सुरक्षित गर्नुहोस्'
                                    : 'Secure your account with 2FA'),
                        ),
                        trailing: const Icon(LucideIcons.chevronRight),
                        onTap: _handle2FATap,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                _buildSectionTitle(
                  context.locale.languageCode == 'ne'
                      ? 'सक्रिय सत्रहरू'
                      : 'Active Sessions',
                ),
                if (_isLoadingSessions)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (_sessions.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        context.locale.languageCode == 'ne'
                            ? 'कुनै सक्रिय सत्र भेटिएन।'
                            : 'No active sessions found.',
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _sessions.length,
                    separatorBuilder: (c, i) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final session = _sessions[index];
                      final created = DateTime.parse(session['created_at']);
                      // We don't have device info yet, so we show date
                      final dateStr = formatNepalTime(
                        created,
                        'MMM d, yyyy h:mm a',
                        context.locale.languageCode,
                      );

                      return Card(
                        elevation: 0,
                        color: Colors.grey[50],
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.grey[200]!),
                        ),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Colors.white,
                            child: Icon(
                              LucideIcons.monitor,
                              color: Colors.grey,
                            ),
                          ),
                          title: Text(
                            context.locale.languageCode == 'ne'
                                ? 'सत्र सुरु भयो'
                                : 'Session started',
                          ),
                          subtitle: Text(dateStr),
                          trailing: IconButton(
                            icon: const Icon(
                              LucideIcons.trash2,
                              color: Colors.red,
                            ),
                            onPressed: () => _revokeSession(session['id']),
                          ),
                        ),
                      );
                    },
                  ),
                const SizedBox(height: 24),
                _buildSectionTitle(
                  context.locale.languageCode == 'ne'
                      ? 'खाता व्यवस्थापन'
                      : 'Account Management',
                ),
                Card(
                  elevation: 0,
                  color: Colors.red[50],
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.red[200]!),
                  ),
                  child: ListTile(
                    leading: const Icon(LucideIcons.trash2, color: Colors.red),
                    title: Text(
                      context.locale.languageCode == 'ne'
                          ? 'खाता मेटाउनुहोस्'
                          : 'Delete Account',
                      style: const TextStyle(color: Colors.red),
                    ),
                    subtitle: Text(
                      context.locale.languageCode == 'ne'
                          ? 'तपाईंको खाता र डाटा स्थायी रूपमा मेटाउनुहोस्'
                          : 'Permanently delete your account and data',
                      style: TextStyle(color: Colors.red[300]),
                    ),
                    trailing: const Icon(
                      LucideIcons.chevronRight,
                      color: Colors.red,
                    ),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const DeleteAccountScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
    );
  }
}
