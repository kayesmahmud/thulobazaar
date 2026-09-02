import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/api/auth_client.dart';
import 'package:mobile/core/api/dio_client.dart';

class AuthProvider with ChangeNotifier {
  final AuthClient _authClient = AuthClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  bool _isLoggedIn = false;
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  bool get isLoggedIn => _isLoggedIn;
  bool get isAuthenticated => _isLoggedIn; // Alias for notification service
  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;

  /// Get user ID safely from the user map
  int? get userId => _user?['id'] as int?;

  /// Signed in with a fixed profile, touching neither network nor storage.
  @visibleForTesting
  AuthProvider.withUser(Map<String, dynamic> user)
    : _user = user,
      _isLoggedIn = true,
      _isLoading = false;

  AuthProvider() {
    _init();
    // Auto-logout when token refresh fails on a 401
    DioClient.onAuthFailure = () {
      _isLoggedIn = false;
      _user = null;
      notifyListeners();
    };
  }

  Future<void> _init() async {
    final token = await _storage.read(key: 'auth_token');
    if (token != null) {
      _isLoggedIn = true;
      try {
        final response = await _authClient.getProfile();
        if (response != null && response['success'] == true) {
          _user = response['data'];
        } else {
          // Token might be invalid
          _isLoggedIn = false;
          await _storage.delete(key: 'auth_token');
          DioClient.updateAuthToken(null);
        }
      } catch (e) {
        // Error fetching profile
        _isLoggedIn = false;
      }
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _authClient.updateProfile(data);
      if (response['success'] == true) {
        // Merge instead of replace: a partial API response must not wipe
        // existing fields (e.g. phoneVerified), which would flip the badge.
        final updated = response['data'];
        if (updated is Map<String, dynamic>) {
          _user = {...?_user, ...updated};
        }
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshProfile() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _authClient.getProfile();
      if (response['success'] == true) {
        _user = response['data'];
      }
    } catch (e) {
      if (kDebugMode)
        developer.log('Error refreshing profile: $e', name: 'AuthProvider');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String token) async {
    await _storage.write(key: 'auth_token', value: token);
    DioClient.updateAuthToken(token);
    _isLoggedIn = true;

    try {
      final response = await _authClient.getProfile();
      if (kDebugMode)
        developer.log('API Response: $response', name: 'AuthProvider');
      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>?;
        final role = data?['role'] as String? ?? 'user';
        if (role != 'user') {
          // Editors/admins should use the web dashboard
          if (kDebugMode)
            developer.log(
              'Non-user role ($role) logged in, treating as user',
              name: 'AuthProvider',
            );
        }
        _user = data;
        if (kDebugMode)
          developer.log('Parsed User: $_user', name: 'AuthProvider');
        if (kDebugMode)
          developer.log(
            'User Name: ${_user?['fullName']}',
            name: 'AuthProvider',
          );
      }
    } catch (e, stack) {
      if (kDebugMode)
        developer.log('Error fetching profile: $e', name: 'AuthProvider');
      if (kDebugMode) developer.log('$stack', name: 'AuthProvider');
    }

    notifyListeners();
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'refresh_token');
    DioClient.updateAuthToken(null);
    _isLoggedIn = false;
    _user = null;
    notifyListeners();
  }
}
