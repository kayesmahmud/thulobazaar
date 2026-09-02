import 'package:mobile/core/utils/per_user_load.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/providers/notification_provider.dart';
import '../../core/models/notification_item.dart';
import '../../features/ad_detail/ad_detail_screen.dart';
import '../../features/messages/chat_screen.dart';
import '../../features/verification/verification_screen.dart';
import '../../features/support/ticket_detail_screen.dart';
import '../../features/support/support_tickets_screen.dart';
import '../../features/support/live_chat_screen.dart';
import '../../core/widgets/load_error_view.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen>
    with PerUserLoad {
  final ScrollController _scrollController = ScrollController();
  Timer? _autoMarkReadTimer;

  /// Runs once per signed-in user (from build): a guest has no notifications
  /// and no token, and a sign-in that returns here must fetch too.
  void _start() {
    final provider = context.read<NotificationProvider>();
    provider.fetchNotifications(refresh: true);
    _scrollController.removeListener(_onScroll);
    _scrollController.addListener(_onScroll);
    _autoMarkReadTimer?.cancel();

    // Auto mark-all-as-read after a brief delay so the user can briefly see
    // which items were unread (blue dots / highlighted bg) before they clear.
    _autoMarkReadTimer = Timer(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      final p = context.read<NotificationProvider>();
      if (p.unreadCount > 0) {
        p.markAllAsRead();
      }
    });
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<NotificationProvider>().fetchNotifications();
    }
  }

  @override
  void dispose() {
    _autoMarkReadTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      return const LoginGateScreen(kind: LoginGateKind.notifications);
    }
    loadOnceFor(auth.userId, _start);
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, provider, _) {
              if (provider.unreadCount == 0) return const SizedBox.shrink();
              return TextButton(
                onPressed: () => provider.markAllAsRead(),
                child: const Text(
                  'Mark all read',
                  style: TextStyle(fontSize: 13),
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.notifications.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          // Failed to load (offline / server) with nothing cached — show the
          // offline/error view instead of a misleading "No notifications yet".
          if (provider.hasError && provider.notifications.isEmpty) {
            return LoadErrorView(
              isOffline: provider.isOffline,
              onRetry: () => provider.fetchNotifications(refresh: true),
            );
          }

          if (provider.notifications.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () => provider.fetchNotifications(refresh: true),
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount:
                  provider.notifications.length + (provider.hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == provider.notifications.length) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  );
                }
                return _buildNotificationTile(provider.notifications[index]);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.bellOff, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.grey[500],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "We'll notify you when something happens",
            style: TextStyle(fontSize: 13, color: Colors.grey[400]),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationTile(NotificationItem notification) {
    final iconData = _getIconForType(notification.type);
    final iconColor = _getColorForType(notification.type);

    return Dismissible(
      key: ValueKey(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red[400],
        child: const Icon(LucideIcons.trash2, color: Colors.white),
      ),
      onDismissed: (_) {
        context.read<NotificationProvider>().deleteNotification(
          notification.id,
        );
      },
      child: InkWell(
        onTap: () => _onNotificationTap(notification),
        child: Container(
          color: notification.isRead ? Colors.white : const Color(0xFFF0F7FF),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(iconData, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: TextStyle(
                              fontWeight: notification.isRead
                                  ? FontWeight.w500
                                  : FontWeight.w600,
                              fontSize: 14,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                        if (!notification.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF3B82F6),
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.body,
                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatTimestamp(notification.createdAt),
                      style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _onNotificationTap(NotificationItem notification) {
    // Mark as read
    if (!notification.isRead) {
      context.read<NotificationProvider>().markAsRead(notification.id);
    }

    // Navigate based on route
    final route = notification.route;
    final adId = notification.adId;

    if (route == '/ad' && adId != null) {
      final parsedAdId = int.tryParse(adId);
      if (parsedAdId != null) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => AdDetailScreen(adId: parsedAdId)),
        );
      }
    } else if (route == '/verification') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const VerificationScreen()),
      );
    } else if (route == '/live-chat') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const LiveChatScreen()),
      );
    } else if (route == '/support') {
      final ticketId = int.tryParse(
        notification.data?['ticketId']?.toString() ?? '',
      );
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ticketId != null
              ? TicketDetailScreen(ticketId: ticketId)
              : const SupportTicketsScreen(),
        ),
      );
    } else if (route == '/chat') {
      final conversationId = int.tryParse(
        notification.data?['conversationId']?.toString() ?? '',
      );
      final senderName = notification.data?['senderName'] as String? ?? 'Chat';
      if (conversationId != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatScreen(
              conversationId: conversationId,
              recipientName: senderName,
            ),
          ),
        );
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'ad_approved':
        return LucideIcons.checkCircle;
      case 'ad_rejected':
        return LucideIcons.xCircle;
      case 'ad_suspended':
        return LucideIcons.ban;
      case 'ad_unsuspended':
        return LucideIcons.checkCircle2;
      case 'verification_approved':
        return LucideIcons.shieldCheck;
      case 'verification_rejected':
        return LucideIcons.shieldOff;
      case 'payment_confirmed':
        return LucideIcons.creditCard;
      case 'new_message':
        return LucideIcons.messageCircle;
      case 'new_inquiry':
        return LucideIcons.messageSquare;
      case 'price_drop':
        return LucideIcons.trendingDown;
      case 'ad_expiring':
      case 'ad_expired':
      case 'verification_expiring':
      case 'verification_expired':
        return LucideIcons.clock;
      case 'promotion_started':
        return LucideIcons.rocket;
      case 'promotion_expiring':
      case 'promotion_expired':
        return LucideIcons.timer;
      case 'unread_messages_reminder':
        return LucideIcons.mailWarning;
      case 'abandoned_bookmark':
      case 'weekly_bookmarks':
        return LucideIcons.bookmark;
      case 'win_back':
        return LucideIcons.sparkles;
      case 'favorite_removed':
        return LucideIcons.heartOff;
      case 'ad_views_milestone':
      case 'viewed_not_acted':
        return LucideIcons.eye;
      case 'new_ad_area':
      case 'nearby_seller':
        return LucideIcons.mapPin;
      case 'trending_area':
        return LucideIcons.trendingUp;
      case 'better_deal_nearby':
        return LucideIcons.tag;
      case 'inquiry_reply':
        return LucideIcons.reply;
      case 'welcome':
        return LucideIcons.partyPopper;
      case 'announcement':
        return LucideIcons.megaphone;
      default:
        return LucideIcons.bell;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'ad_approved':
      case 'verification_approved':
      case 'payment_confirmed':
      case 'promotion_started':
        return const Color(0xFF10B981); // green
      case 'ad_rejected':
      case 'ad_suspended':
      case 'verification_rejected':
      case 'favorite_removed':
        return const Color(0xFFDC2626); // red
      case 'ad_unsuspended':
        return const Color(0xFF10B981); // green
      case 'new_message':
      case 'new_inquiry':
      case 'unread_messages_reminder':
        return const Color(0xFF3B82F6); // blue
      case 'price_drop':
        return const Color(0xFF10B981); // green
      case 'ad_expiring':
      case 'ad_expired':
      case 'verification_expiring':
      case 'verification_expired':
      case 'promotion_expiring':
      case 'promotion_expired':
        return const Color(0xFFF59E0B); // amber
      case 'abandoned_bookmark':
      case 'weekly_bookmarks':
      case 'win_back':
        return const Color(0xFF8B5CF6); // purple
      case 'ad_views_milestone':
      case 'inquiry_reply':
        return const Color(0xFF3B82F6); // blue
      case 'viewed_not_acted':
        return const Color(0xFFF59E0B); // amber
      case 'new_ad_area':
      case 'nearby_seller':
        return const Color(0xFF14B8A6); // teal
      case 'trending_area':
        return const Color(0xFFF97316); // orange
      case 'better_deal_nearby':
        return const Color(0xFF10B981); // green
      case 'welcome':
      case 'announcement':
        return const Color(0xFF8B5CF6); // purple
      default:
        return const Color(0xFF6B7280); // gray
    }
  }

  String _formatTimestamp(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d').format(dateTime);
  }
}
