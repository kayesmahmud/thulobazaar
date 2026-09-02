import 'dart:developer' as developer;
import 'api_error.dart';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';
import '../models/models.dart';
import 'dio_client.dart';

/// Message API Client - handles all messaging-related API calls
class MessageClient {
  final Dio _dio;

  MessageClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

  // ==========================================
  // CONVERSATIONS
  // ==========================================

  /// Get all conversations for the current user
  Future<ApiResponse<List<Conversation>>> getConversations() async {
    try {
      final response = await _dio.get('/messages/conversations');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final conversations = data
            .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(conversations);
      }
      return ApiResponse.failure(
        response.data['error'] ?? 'Failed to fetch conversations',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch conversations',
      );
    }
  }

  /// Create or get existing conversation
  Future<ApiResponse<Conversation>> createConversation({
    required int participantId,
    int? adId,
  }) async {
    try {
      final response = await _dio.post(
        '/messages/conversations',
        data: {'participantId': participantId, if (adId != null) 'adId': adId},
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(
          Conversation.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(
        response.data['error'] ?? 'Failed to create conversation',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to create conversation',
      );
    }
  }

  // ==========================================
  // MESSAGES
  // ==========================================

  /// Get messages for a conversation with cursor-based pagination
  Future<ApiResponse<List<Message>>> getMessages(
    int conversationId, {
    String? before,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, dynamic>{'limit': limit};
      if (before != null) queryParams['before'] = before;
      final response = await _dio.get(
        '/messages/conversations/$conversationId',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        // Express returns { data: { conversation, messages } }
        final responseData = response.data['data'];
        List<dynamic> messagesList;

        if (responseData is Map && responseData.containsKey('messages')) {
          messagesList = responseData['messages'] as List<dynamic>;
        } else if (responseData is List) {
          messagesList = responseData;
        } else {
          messagesList = [];
          if (kDebugMode)
            developer.log(
              'Unrecognized data format: ${responseData.runtimeType}',
              name: 'MessageClient',
            );
        }

        final messages = messagesList
            .map((e) => Message.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(messages);
      }
      return ApiResponse.failure(
        response.data['error'] ?? 'Failed to fetch messages',
      );
    } on DioException catch (e) {
      if (kDebugMode)
        developer.log(
          'getMessages error: ${e.type} ${e.message}',
          name: 'MessageClient',
        );
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch messages',
      );
    } catch (e) {
      if (kDebugMode)
        developer.log('getMessages unexpected: $e', name: 'MessageClient');
      return ApiResponse.failure('Unexpected error: $e');
    }
  }

  /// Send a message via REST (fallback when Socket.IO is down)
  Future<ApiResponse<Message>> sendMessage({
    required int conversationId,
    required String message,
    String type = 'text',
    String? attachmentUrl,
    // Legacy params (unused with conversation-based API)
    int? recipientId,
    int? adId,
  }) async {
    try {
      final response = await _dio.post(
        '/messages/conversations/$conversationId/messages',
        data: {
          'content': message,
          'type': type,
          if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
        },
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(
          Message.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(
        response.data['error'] ?? 'Failed to send message',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to send message',
      );
    }
  }

  /// Mark messages as read via REST
  Future<ApiResponse<void>> markAsRead(int conversationId) async {
    try {
      // Reading the conversation already updates last_read_at on the backend
      final response = await _dio.get(
        '/messages/conversations/$conversationId?limit=1',
      );
      if (response.data['success'] == true) {
        return ApiResponse.success(null);
      }
      return ApiResponse.failure('Failed to mark as read');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to mark as read',
      );
    }
  }

  // ==========================================
  // BLOCK / REPORT
  // ==========================================

  /// Fetch block status + other user id for a conversation
  /// Returns { blockedByMe, blockedMe, otherUserId }
  Future<ApiResponse<Map<String, dynamic>>> getConversationStatus(
    int conversationId,
  ) async {
    try {
      final response = await _dio.get(
        '/messages/conversations/$conversationId?limit=1',
      );
      if (response.data['success'] == true) {
        final conv =
            response.data['data']?['conversation'] as Map<String, dynamic>?;
        return ApiResponse.success({
          'blockedByMe': conv?['blockedByMe'] == true,
          'blockedMe': conv?['blockedMe'] == true,
          'otherUserId': conv?['otherUserId'],
        });
      }
      return ApiResponse.failure('Failed to fetch conversation status');
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to fetch conversation status',
      );
    }
  }

  /// Block a user (bidirectional)
  Future<ApiResponse<void>> blockUser(int userId) async {
    try {
      final response = await _dio.post(
        '/messages/block',
        data: {'userId': userId},
      );
      if (response.data['success'] == true) return ApiResponse.success(null);
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to block user',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to block user',
      );
    }
  }

  /// Unblock a previously blocked user
  Future<ApiResponse<void>> unblockUser(int userId) async {
    try {
      final response = await _dio.delete('/messages/block/$userId');
      if (response.data['success'] == true) return ApiResponse.success(null);
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to unblock user',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to unblock user',
      );
    }
  }

  /// Report a user from a conversation
  Future<ApiResponse<void>> reportUser({
    required int reportedUserId,
    required String reason,
    String? details,
    int? conversationId,
  }) async {
    try {
      final response = await _dio.post(
        '/reports/user',
        data: {
          'reportedUserId': reportedUserId,
          'reason': reason,
          if (details != null && details.isNotEmpty) 'details': details,
          if (conversationId != null) 'conversationId': conversationId,
        },
      );
      if (response.data['success'] == true) return ApiResponse.success(null);
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to report user',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to report user',
      );
    }
  }

  // ==========================================
  // IMAGE UPLOAD
  // ==========================================

  /// Upload an image for messaging
  Future<ApiResponse<String>> uploadImage(File imageFile) async {
    try {
      final String fileName = imageFile.path.split('/').last;
      String mimeType = 'image/jpeg';
      final ext = fileName.split('.').last.toLowerCase();

      if (ext == 'png')
        mimeType = 'image/png';
      else if (ext == 'gif')
        mimeType = 'image/gif';
      else if (ext == 'webp')
        mimeType = 'image/webp';

      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          imageFile.path,
          filename: fileName,
          contentType: MediaType.parse(mimeType),
        ),
      });

      final response = await _dio.post('/messages/upload', data: formData);

      if (response.data['success'] == true) {
        final url = response.data['data']['url'] as String;
        return ApiResponse.success(url);
      }
      return ApiResponse.failure('Failed to upload image');
    } on DioException catch (e) {
      if (kDebugMode)
        developer.log('Upload error: ${e.message}', name: 'MessageClient');
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to upload image',
      );
    }
  }

  // ==========================================
  // UNREAD COUNT
  // ==========================================

  /// Get unread message count
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get('/messages/unread-count');

      if (response.data['success'] == true) {
        return response.data['data']['unread_messages'] as int? ??
            response.data['data']['unreadMessages'] as int? ??
            response.data['data']['count'] as int? ??
            0;
      }
      return 0;
    } on DioException catch (e) {
      if (kDebugMode)
        developer.log('Error fetching unread count: $e', name: 'MessageClient');
      return 0;
    }
  }
}
