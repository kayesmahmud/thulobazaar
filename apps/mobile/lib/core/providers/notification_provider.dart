import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../api/notification_client.dart';
import '../models/notification_item.dart';
import '../services/socket_service.dart';

/// Provider for notification center state management.
/// Mirrors the ChatProvider pattern using ChangeNotifier.
class NotificationProvider extends ChangeNotifier {
  final NotificationClient _client = NotificationClient();
  final SocketService _socket = SocketService();

  List<NotificationItem> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  bool _hasMore = true;
  bool _hasError = false;
  bool _isOffline = false;
  int _currentPage = 1;
  StreamSubscription<dynamic>? _socketSub;

  List<NotificationItem> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  bool get hasMore => _hasMore;
  bool get hasError => _hasError;
  bool get isOffline => _isOffline;

  /// Initialize — fetch unread count and listen for real-time updates
  Future<void> initialize() async {
    await fetchUnreadCount();
    _listenToSocket();
  }

  /// Fetch unread count (for badge)
  Future<void> fetchUnreadCount() async {
    _unreadCount = await _client.getUnreadCount();
    notifyListeners();
  }

  /// Fetch notifications (paginated)
  static const _pageSize = 20;

  Future<void> fetchNotifications({bool refresh = false}) async {
    if (_isLoading) return;

    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _notifications = [];
    }

    if (!_hasMore) return;

    _isLoading = true;
    _hasError = false;
    notifyListeners();

    try {
      final items = await _client.getNotifications(
        page: _currentPage,
        limit: _pageSize,
      );
      _notifications.addAll(items);
      _currentPage++;
      // A short page is the last page. Waiting for an empty page left a
      // one-item list showing the "loading more" spinner forever, because
      // it can never scroll far enough to ask for page two.
      _hasMore = items.length >= _pageSize;
    } catch (e) {
      developer.log(
        'Error fetching notifications: $e',
        name: 'NotificationProvider',
      );
      _hasError = true;
      _isOffline = await _isOfflineError();
    }

    _isLoading = false;
    notifyListeners();
  }

  /// True when the device has no connectivity at all (drives offline vs
  /// generic-error copy in the notifications error view).
  Future<bool> _isOfflineError() async {
    try {
      final results = await Connectivity().checkConnectivity();
      return results.every((r) => r == ConnectivityResult.none);
    } catch (_) {
      return false;
    }
  }

  /// Mark single notification as read
  Future<void> markAsRead(int notificationId) async {
    final success = await _client.markAsRead(notificationId);
    if (success) {
      final idx = _notifications.indexWhere((n) => n.id == notificationId);
      if (idx != -1 && !_notifications[idx].isRead) {
        _notifications[idx] = _notifications[idx].copyWith(
          isRead: true,
          readAt: DateTime.now(),
        );
        _unreadCount = (_unreadCount - 1).clamp(0, _unreadCount);
        notifyListeners();
      }
    }
  }

  /// Mark all as read
  Future<void> markAllAsRead() async {
    final success = await _client.markAllAsRead();
    if (success) {
      _notifications = _notifications
          .map(
            (n) =>
                n.isRead ? n : n.copyWith(isRead: true, readAt: DateTime.now()),
          )
          .toList();
      _unreadCount = 0;
      notifyListeners();
    }
  }

  /// Delete a notification
  Future<void> deleteNotification(int notificationId) async {
    final success = await _client.deleteNotification(notificationId);
    if (success) {
      final wasUnread = _notifications.any(
        (n) => n.id == notificationId && !n.isRead,
      );
      _notifications.removeWhere((n) => n.id == notificationId);
      if (wasUnread) {
        _unreadCount = (_unreadCount - 1).clamp(0, _unreadCount);
      }
      notifyListeners();
    }
  }

  /// Listen to socket `notification:new` events for real-time updates
  void _listenToSocket() {
    final socket = _socket.socket;
    if (socket == null) return;

    socket.on('notification:new', (data) {
      try {
        final payload = data as Map<String, dynamic>;
        final notifData = payload['notification'] as Map<String, dynamic>?;
        final count = payload['unreadCount'] as int?;

        if (notifData != null) {
          final item = NotificationItem.fromJson(notifData);
          // Add to top of list if notifications are loaded
          _notifications.insert(0, item);
        }

        if (count != null) {
          _unreadCount = count;
        } else {
          _unreadCount++;
        }

        notifyListeners();
      } catch (e) {
        developer.log(
          'Error parsing notification socket event: $e',
          name: 'NotificationProvider',
        );
      }
    });
  }

  /// Clean up
  void reset() {
    _notifications = [];
    _unreadCount = 0;
    _currentPage = 1;
    _hasMore = true;
    _isLoading = false;
    _socketSub?.cancel();
    notifyListeners();
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    super.dispose();
  }
}
