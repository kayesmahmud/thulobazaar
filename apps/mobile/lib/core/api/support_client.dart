import 'package:dio/dio.dart';
import 'api_error.dart';
import '../models/models.dart';
import 'dio_client.dart';

class SupportClient {
  final Dio _dio;

  SupportClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

  Future<ApiResponse<List<SupportTicket>>> getTickets({
    String? status,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final params = <String, dynamic>{'limit': limit, 'offset': offset};
      if (status != null) params['status'] = status;

      final response = await _dio.get(
        '/support/tickets',
        queryParameters: params,
      );

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final tickets = data
            .map((e) => SupportTicket.fromMap(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(tickets);
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to fetch tickets',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to fetch tickets',
      );
    }
  }

  Future<ApiResponse<SupportTicket>> createTicket({
    required String subject,
    required String message,
    String category = 'general',
  }) async {
    try {
      final response = await _dio.post(
        '/support/tickets',
        data: {'subject': subject, 'category': category, 'message': message},
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(
          SupportTicket.fromMap(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to create ticket',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to create ticket',
      );
    }
  }

  Future<ApiResponse<SupportTicketDetail>> getTicketDetail(int ticketId) async {
    try {
      final response = await _dio.get('/support/tickets/$ticketId');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          SupportTicketDetail.fromMap(
            response.data['data'] as Map<String, dynamic>,
          ),
        );
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to fetch ticket',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to fetch ticket',
      );
    }
  }

  Future<ApiResponse<void>> submitCsat(
    int ticketId,
    int score, {
    String? comment,
  }) async {
    try {
      final response = await _dio.post(
        '/support/tickets/$ticketId/csat',
        data: {
          'score': score,
          if (comment != null && comment.trim().isNotEmpty)
            'comment': comment.trim(),
        },
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(null);
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to submit rating',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to submit rating',
      );
    }
  }

  Future<ApiResponse<SupportMessage>> sendMessage(
    int ticketId,
    String content,
  ) async {
    try {
      final response = await _dio.post(
        '/support/tickets/$ticketId/messages',
        data: {'content': content},
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(
          SupportMessage.fromMap(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to send message',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to send message',
      );
    }
  }

  /// Live Chat: the user's single ongoing conversation.
  Future<ApiResponse<LiveChatThread>> getLiveChat() async {
    try {
      final response = await _dio.get('/support/live-chat');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          LiveChatThread.fromMap(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to load live chat',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to load live chat',
      );
    }
  }

  /// Sends a live chat message, starting the conversation if there is none yet.
  Future<ApiResponse<SupportMessage>> sendLiveChatMessage(
    String content,
  ) async {
    try {
      final response = await _dio.post(
        '/support/live-chat/messages',
        data: {'content': content},
      );

      if (response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return ApiResponse.success(
          SupportMessage.fromMap(data['message'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(
        apiMessage(response.data) ?? 'Failed to send message',
      );
    } on DioException catch (e) {
      return ApiResponse.failure(
        apiMessage(e.response?.data) ?? 'Failed to send message',
      );
    }
  }
}
