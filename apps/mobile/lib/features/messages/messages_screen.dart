import 'package:flutter/material.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';

import '../../core/api/api_config.dart';
import '../../core/models/message.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/chat_provider.dart';
import '../../core/widgets/main_app_bar.dart';
import '../../core/widgets/team_badge.dart';
import '../../core/widgets/main_drawer.dart';
import '../../core/utils/localized_helpers.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/utils/skeleton_data.dart';
import '../../core/widgets/staggered_fade_in.dart';
import '../../core/widgets/floating_widget.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'chat_screen.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  @override
  void initState() {
    super.initState();
    // Refresh conversations when entering the screen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated) {
        context.read<ChatProvider>().loadConversations();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final chatProvider = context.watch<ChatProvider>();

    if (!authProvider.isLoggedIn) {
      return const LoginGateScreen(
        kind: LoginGateKind.messages,
        drawer: MainDrawer(),
      );
    }

    if (chatProvider.isLoading && chatProvider.conversations.isEmpty) {
      final fakeConversations = SkeletonData.fakeConversations(5);
      return Scaffold(
        appBar: const MainAppBar(),
        drawer: const MainDrawer(),
        body: Skeletonizer(
          enabled: true,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: 5,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) => _buildConversationItem(
              context,
              fakeConversations[index],
              false,
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MainAppBar(),
      drawer: const MainDrawer(),
      body: _buildChatsTab(),
    );
  }

  // ==========================================
  // CHATS TAB
  // ==========================================

  Widget _buildChatsTab() {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        if (chatProvider.isLoading && chatProvider.conversations.isEmpty) {
          final fakeConversations = SkeletonData.fakeConversations(5);
          return Skeletonizer(
            enabled: true,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: 5,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) => _buildConversationItem(
                context,
                fakeConversations[index],
                false,
              ),
            ),
          );
        }

        if (chatProvider.error != null && chatProvider.conversations.isEmpty) {
          return _buildErrorState(chatProvider);
        }

        if (chatProvider.conversations.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: () async {
            await chatProvider.loadConversations();
            HapticFeedback.mediumImpact();
          },
          child: Column(
            children: [
              _buildConnectionStatus(chatProvider),
              Expanded(
                child: ListView.separated(
                  cacheExtent: 500,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: chatProvider.conversations.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final conversation = chatProvider.conversations[index];
                    return StaggeredFadeIn(
                      index: index,
                      beginOffset: const Offset(0.1, 0),
                      child: _buildConversationItem(
                        context,
                        conversation,
                        chatProvider.isUserOnline(conversation.otherUserId),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildConnectionStatus(ChatProvider chatProvider) {
    if (chatProvider.isConnected) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.orange.shade100,
      child: Row(
        children: [
          Icon(LucideIcons.cloudOff, size: 16, color: Colors.orange.shade800),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'messages.offlineMode'.tr(),
              style: TextStyle(fontSize: 12, color: Colors.orange.shade800),
            ),
          ),
          TextButton(
            onPressed: () => chatProvider.reconnect(),
            child: Text('common.retry'.tr()),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationItem(
    BuildContext context,
    Conversation conversation,
    bool isOnline,
  ) {
    final avatarUrl = conversation.otherUserAvatar != null
        ? ApiConfig.getAvatarUrl(conversation.otherUserAvatar)
        : null;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          FadeScaleRoute(
            builder: (_) => ChatScreen(
              conversationId: conversation.id,
              recipientName: conversation.otherUserName,
              recipientAvatar: avatarUrl,
              adTitle: conversation.adTitle,
              adId: conversation.adId,
              otherUserId: conversation.otherUserId,
              recipientIsStaff: conversation.otherUserIsStaff,
            ),
          ),
        ).then((_) {
          if (context.mounted) {
            context.read<ChatProvider>().loadConversations();
          }
        });
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: avatarUrl != null
                      ? CachedNetworkImageProvider(avatarUrl)
                      : null,
                  child: avatarUrl == null
                      ? Text(
                          conversation.otherUserName.isNotEmpty
                              ? conversation.otherUserName[0].toUpperCase()
                              : '?',
                          style: AppFont.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[600],
                          ),
                        )
                      : null,
                ),
                if (isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                conversation.otherUserName,
                                style: AppFont.inter(
                                  fontSize: 15,
                                  fontWeight: conversation.hasUnread
                                      ? FontWeight.w700
                                      : FontWeight.w600,
                                  color: const Color(0xFF111827),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (conversation.otherUserIsStaff) ...[
                              const SizedBox(width: 6),
                              const TeamBadge(compact: true),
                            ],
                          ],
                        ),
                      ),
                      Text(
                        _formatTime(conversation.lastMessageAt),
                        style: AppFont.inter(
                          fontSize: 12,
                          color: conversation.hasUnread
                              ? const Color(0xFFDC143C)
                              : Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.lastMessage.isNotEmpty
                              ? conversation.lastMessage
                              : 'No messages yet',
                          style: AppFont.inter(
                            fontSize: 14,
                            fontWeight: conversation.hasUnread
                                ? FontWeight.w600
                                : FontWeight.normal,
                            color: conversation.hasUnread
                                ? Colors.grey[800]
                                : Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.hasUnread)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDC143C),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${conversation.unreadCount}',
                            style: AppFont.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (conversation.adTitle != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          LucideIcons.tag,
                          size: 14,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            conversation.adTitle!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppFont.inter(
                              fontSize: 12,
                              color: Colors.grey[500],
                            ),
                          ),
                        ),
                      ],
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

  // ==========================================
  // EMPTY / ERROR STATES
  // ==========================================

  Widget _buildErrorState(ChatProvider chatProvider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.alertCircle, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              chatProvider.error ?? 'Failed to load conversations',
              style: AppFont.inter(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => chatProvider.loadConversations(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC143C),
                foregroundColor: Colors.white,
              ),
              child: Text('common.retry'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return StaggeredFadeIn(
      index: 0,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FloatingWidget(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    LucideIcons.messageCircle,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'messages.noMessages'.tr(),
                style: AppFont.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'messages.startConversation'.tr(),
                style: AppFont.inter(fontSize: 14, color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';

    return formatNepalTime(time, 'MMM d', context.locale.languageCode);
  }
}
