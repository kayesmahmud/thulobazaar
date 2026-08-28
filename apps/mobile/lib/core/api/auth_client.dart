import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dio_client.dart';

class AuthClient {
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

  // ==========================================
  // PROFILE ENDPOINTS (/api/profile/*)
  // ==========================================

  // Get Profile
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get('/profile');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Update Profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/profile', data: data);
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ==========================================
  // AUTH ENDPOINTS (/api/auth/*)
  // ==========================================

  // Send OTP
  Future<Map<String, dynamic>> sendOtp(
    String phone, {
    String purpose = 'registration',
  }) async {
    try {
      final response = await _dio.post(
        '/auth/send-otp',
        data: {'phone': phone, 'purpose': purpose},
      );
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Verify OTP
  Future<Map<String, dynamic>> verifyOtp(
    String phone,
    String otp, {
    String purpose = 'registration',
  }) async {
    try {
      final response = await _dio.post(
        '/auth/verify-otp',
        data: {'phone': phone, 'otp': otp, 'purpose': purpose},
      );
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Reset Password (forgot password flow — no auth required)
  Future<Map<String, dynamic>> resetPassword(
    String phone,
    String newPassword,
    String verificationToken,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/reset-password',
        data: {
          'phone': phone,
          'newPassword': newPassword,
          'verificationToken': verificationToken,
        },
      );
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Phone Login
  Future<Map<String, dynamic>> login(String phone, String password) async {
    try {
      final response = await _dio.post(
        '/auth/phone-login',
        data: {'phone': phone, 'password': password},
      );

      // Don't save tokens if 2FA is required
      if (response.data['success'] == true &&
          response.data['requires2FA'] != true) {
        await _saveTokens(response.data);
      }

      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Phone Registration
  Future<Map<String, dynamic>> register(
    String phone,
    String password,
    String fullName,
    String verificationToken,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/register-phone',
        data: {
          'phone': phone,
          'password': password,
          'fullName': fullName,
          'verificationToken': verificationToken,
        },
      );

      if (response.data['success'] == true) {
        await _saveTokens(response.data);
      }

      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Google Login
  Future<Map<String, dynamic>> googleLogin(String idToken) async {
    try {
      final response = await _dio.post(
        '/auth/google-token',
        data: {'idToken': idToken},
      );

      if (response.data['success'] == true) {
        await _saveTokens(response.data);
      }

      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Apple Login
  Future<Map<String, dynamic>> appleLogin(
    String identityToken, {
    String? givenName,
    String? familyName,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/apple-token',
        data: {
          'identityToken': identityToken,
          if (givenName != null || familyName != null)
            'fullName': {
              if (givenName != null) 'givenName': givenName,
              if (familyName != null) 'familyName': familyName,
            },
        },
      );

      if (response.data['success'] == true) {
        await _saveTokens(response.data);
      }

      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ==========================================
  // SECURITY ENDPOINTS (/api/auth)
  // ==========================================

  // Change Password
  Future<Map<String, dynamic>> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/change-password',
        data: {'currentPassword': currentPassword, 'newPassword': newPassword},
      );
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Update Phone
  /// [oldNumberOtpToken] proves the caller controls the number being replaced.
  /// The server requires it to change an already-verified number; it is null
  /// for a first-time verification, where there is nothing to protect yet.
  Future<Map<String, dynamic>> updatePhone(
    String phone,
    String verificationToken, {
    String? oldNumberOtpToken,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/update-phone',
        data: {
          'phone': phone,
          'verificationToken': verificationToken,
          if (oldNumberOtpToken != null) 'oldNumberOtpToken': oldNumberOtpToken,
        },
      );
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Get Active Sessions
  Future<Map<String, dynamic>> getSessions() async {
    try {
      final response = await _dio.get('/auth/sessions');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Revoke Session
  Future<Map<String, dynamic>> revokeSession(int sessionId) async {
    try {
      final response = await _dio.delete('/auth/sessions/$sessionId');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ==========================================
  // 2FA ENDPOINTS (/api/auth/2fa/*)
  // ==========================================

  // Setup 2FA — returns QR code + secret
  Future<Map<String, dynamic>> setup2FA() async {
    try {
      final response = await _dio.post('/auth/2fa/setup');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Verify 2FA setup — returns backup codes
  Future<Map<String, dynamic>> verify2FASetup(String code) async {
    try {
      final response = await _dio.post(
        '/auth/2fa/verify-setup',
        data: {'code': code},
      );
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Disable 2FA — requires password + TOTP code
  Future<Map<String, dynamic>> disable2FA(String password, String code) async {
    try {
      final response = await _dio.post(
        '/auth/2fa/disable',
        data: {'password': password, 'code': code},
      );
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Verify 2FA during login — uses temp token
  Future<Map<String, dynamic>> verify2FALogin(
    String tempToken,
    String code,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/2fa/verify-login',
        data: {'tempToken': tempToken, 'code': code},
      );

      if (response.data['success'] == true) {
        await _saveTokens(response.data);
      }

      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ==========================================
  // ACCOUNT DELETION ENDPOINTS
  // ==========================================

  // Request account deletion — sends OTP
  Future<Map<String, dynamic>> requestAccountDeletion() async {
    try {
      final response = await _dio.post('/auth/account/delete-request');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Confirm account deletion with OTP
  Future<Map<String, dynamic>> confirmAccountDeletion(String otp) async {
    try {
      final response = await _dio.post(
        '/auth/account/delete-confirm',
        data: {'otp': otp},
      );
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Cancel pending account deletion (reactivate account)
  Future<Map<String, dynamic>> cancelAccountDeletion() async {
    try {
      final response = await _dio.post('/auth/account/cancel-deletion');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  // Helper: Save Tokens
  Future<void> _saveTokens(Map<String, dynamic> data) async {
    if (data['token'] != null) {
      await _storage.write(key: 'auth_token', value: data['token']);
      DioClient.updateAuthToken(data['token'] as String?);
    }
    if (data['refreshToken'] != null) {
      await _storage.write(key: 'refresh_token', value: data['refreshToken']);
    }
  }

  // Helper: Handle Error
  Map<String, dynamic> _handleError(DioException e) {
    if (e.response != null) {
      return e.response!.data as Map<String, dynamic>;
    }
    return {
      'success': false,
      'message': 'Network error occurred. Please check your connection.',
    };
  }

  // Get Token
  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  // Logout
  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'refresh_token');
    DioClient.updateAuthToken(null);
  }
}
