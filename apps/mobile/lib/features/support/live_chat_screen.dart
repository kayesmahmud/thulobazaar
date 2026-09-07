import 'package:mobile/core/utils/per_user_load.dart';
import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:easy_localization/easy_localization.dart';

import 'package:provider/provider.dart';

import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:mobile/core/models/support_ticket.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:mobile/core/utils/profanity_check.dart';
import 'package:mobile/features/support/widgets/support_photo.dart';

/// Live Chat — one endless conversation with support. Deliberately simpler
/// than a support ticket: no subject, no category, no status, nothing to
/// close. The AI assistant replies first and hands over to the team when it
/// cannot help; the user just keeps chatting either way.
const _kLiveChatPollInterval = Duration(seconds: 5);

class LiveChatScreen extends StatefulWidget {
  const LiveChatScreen({super.key});

  @override
  State<LiveChatScreen> createState() => _LiveChatScreenState();
}

class _LiveChatScreenState extends State<LiveChatScreen>
    with WidgetsBindingObserver, PerUserLoad {
  final _client = SupportClient();
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _imagePicker = ImagePicker();

  List<SupportMessage> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  File? _pendingImage;
  bool _isUploading = false;
  bool _isPolling = false;
  String? _error;
  Timer? _pollTimer;
  // Shown between the user's message and the assistant's reply: the AI needs
  // several seconds, and without it the screen looks stuck.
  bool _assistantTyping = false;
  Timer? _typingTimeout;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Signed out there is no token: getLiveChat() 401s and the screen used to
    // render the raw server error. The network starts per signed-in user from
    // build, which also covers a sign-in that returns to this screen.
  }

  void _start() {
    _load();
    _startPolling();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pollTimer?.cancel();
    _typingTimeout?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _poll();
      _startPolling();
    } else {
      _pollTimer?.cancel();
    }
  }

  void _startTyping() {
    _typingTimeout?.cancel();
    setState(() => _assistantTyping = true);
    // Safety net so the dots can never hang around when no reply arrives.
    _typingTimeout = Timer(const Duration(seconds: 30), () {
      if (mounted) setState(() => _assistantTyping = false);
    });
  }

  void _stopTyping() {
    _typingTimeout?.cancel();
    if (_assistantTyping) setState(() => _assistantTyping = false);
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(_kLiveChatPollInterval, (_) => _poll());
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final response = await _client.getLiveChat();
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (response.hasData) {
        _messages = response.data!.messages;
      } else {
        _error = response.errorMessage;
      }
    });
    _scrollToBottom();
  }

  /// Silent refresh — replies from the AI or an editor appear on their own.
  Future<void> _poll() async {
    if (_isPolling || _isSending || !mounted) return;
    _isPolling = true;
    try {
      final response = await _client.getLiveChat();
      if (!mounted || !response.hasData) return;
      final fresh = response.data!.messages;
      if (fresh.length == _messages.length) return;
      final gotReply = fresh.isNotEmpty && !fresh.last.isOwnMessage;
      setState(() => _messages = fresh);
      if (gotReply) _stopTyping();
      _scrollToBottom();
    } finally {
      _isPolling = false;
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    if (checkProfanity(text).hasProfanity) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('liveChat.profanityWarning'.tr()),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
      return;
    }

    setState(() => _isSending = true);
    final response = await _client.sendLiveChatMessage(text);
    if (!mounted) return;

    setState(() {
      _isSending = false;
      if (response.hasData) {
        _messageController.clear();
        _messages = [..._messages, response.data!];
      }
    });

    if (!response.hasData) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(response.errorMessage)));
      return;
    }
    _startTyping();
    _scrollToBottom();
  }

  Future<void> _pickImage() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 80,
    );
    if (picked == null || !mounted) return;

    final file = File(picked.path);
    if (await file.length() > kMaxSupportPhotoBytes) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('messages.imageSizeError'.tr())));
      return;
    }
    setState(() => _pendingImage = file);
  }

  /// Upload, then send the photo with whatever is typed as its caption.
  Future<void> _sendPhoto() async {
    final file = _pendingImage;
    if (file == null || _isUploading) return;
    setState(() => _isUploading = true);

    final upload = await _client.uploadImage(file);
    final sent = upload.hasData
        ? await _client.sendLiveChatMessage(
            _messageController.text.trim(),
            attachmentUrl: upload.data,
          )
        : null;
    if (!mounted) return;

    if (sent == null || !sent.hasData) {
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(supportPhotoFailureText(sent ?? upload))),
      );
      return;
    }
    setState(() {
      _isUploading = false;
      _pendingImage = null;
      _messageController.clear();
      _messages = [..._messages, sent.data!];
    });
    _startTyping();
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      return const LoginGateScreen(kind: LoginGateKind.liveChat);
    }
    loadOnceFor(auth.userId, _start);
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'liveChat.title'.tr(),
              style: AppFont.poppins(
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1F2937),
              ),
            ),
            Text(
              'liveChat.subtitle'.tr(),
              style: AppFont.inter(
                fontSize: 11,
                color: const Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFE11D48)),
      );
    }

    if (_error != null && _messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                LucideIcons.alertCircle,
                size: 40,
                color: Color(0xFFE11D48),
              ),
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: AppFont.inter(color: const Color(0xFF6B7280)),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: _load,
                child: Text('support.retry'.tr()),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: _messages.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _poll,
                  child: ListView.builder(
                    controller: _scrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    itemCount: _messages.length + (_assistantTyping ? 1 : 0),
                    itemBuilder: (context, index) => index == _messages.length
                        ? const _TypingBubble()
                        : _buildMessageBubble(_messages[index]),
                  ),
                ),
        ),
        _buildInputBar(),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: Color(0xFFFFE4E6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.headphones,
                size: 30,
                color: Color(0xFFE11D48),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'liveChat.emptyTitle'.tr(),
              style: AppFont.poppins(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'liveChat.emptyBody'.tr(),
              textAlign: TextAlign.center,
              style: AppFont.inter(
                fontSize: 13,
                color: const Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(SupportMessage msg) {
    final isOwn = msg.isOwnMessage;
    return Align(
      alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isOwn ? const Color(0xFFE11D48) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isOwn ? 16 : 4),
            bottomRight: Radius.circular(isOwn ? 4 : 16),
          ),
          border: isOwn ? null : Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          crossAxisAlignment: isOwn
              ? CrossAxisAlignment.end
              : CrossAxisAlignment.start,
          children: [
            if (!isOwn)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFE4E6),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.headphones,
                        size: 11,
                        color: Color(0xFFE11D48),
                      ),
                    ),
                    const SizedBox(width: 5),
                    // Real sender name, so an AI reply is never mistaken for
                    // a human one.
                    Text(
                      msg.sender.fullName.isNotEmpty
                          ? msg.sender.fullName
                          : 'support.supportTeam'.tr(),
                      style: AppFont.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFFE11D48),
                      ),
                    ),
                  ],
                ),
              ),
            if (msg.attachmentUrl != null)
              SupportPhotoBubble(
                url: msg.attachmentUrl!,
                caption: msg.content,
                isOwn: isOwn,
              )
            else
              Text(
                msg.content,
                style: AppFont.inter(
                  fontSize: 14,
                  height: 1.4,
                  color: isOwn ? Colors.white : const Color(0xFF1F2937),
                ),
              ),
            const SizedBox(height: 4),
            Text(
              formatNepalTime(
                msg.createdAt,
                'h:mm a',
                context.locale.languageCode,
              ),
              style: AppFont.inter(
                fontSize: 10,
                color: isOwn ? Colors.white70 : const Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            if (_pendingImage != null)
              PendingPhotoBar(
                file: _pendingImage!,
                isUploading: _isUploading,
                onCancel: () => setState(() => _pendingImage = null),
                onSend: _sendPhoto,
              ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                IconButton(
                  tooltip: 'support.attachPhoto'.tr(),
                  onPressed: _isUploading ? null : _pickImage,
                  icon: const Icon(LucideIcons.image, color: Color(0xFF6B7280)),
                ),
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    style: AppFont.inter(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'liveChat.inputPlaceholder'.tr(),
                      filled: true,
                      fillColor: const Color(0xFFF3F4F6),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    onPressed: _isSending ? null : _send,
                    icon: _isSending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(
                            LucideIcons.send,
                            color: Colors.white,
                            size: 18,
                          ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'liveChat.aiNotice'.tr(),
              textAlign: TextAlign.center,
              style: AppFont.inter(
                fontSize: 10,
                color: const Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Three softly pulsing dots in an incoming-message bubble, shown while the
/// assistant composes a reply.
class _TypingBubble extends StatefulWidget {
  const _TypingBubble();

  @override
  State<_TypingBubble> createState() => _TypingBubbleState();
}

class _TypingBubbleState extends State<_TypingBubble>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Semantics(
        label: 'liveChat.assistantTyping'.tr(),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16),
              topRight: Radius.circular(16),
              bottomRight: Radius.circular(16),
              bottomLeft: Radius.circular(4),
            ),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(3, (i) {
                  // Stagger each dot a third of the cycle apart.
                  final t = (_controller.value + i / 3) % 1.0;
                  final opacity = 0.35 + 0.65 * (1 - (t - 0.5).abs() * 2);
                  return Padding(
                    padding: EdgeInsets.only(right: i == 2 ? 0 : 5),
                    child: Opacity(
                      opacity: opacity.clamp(0.0, 1.0),
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: Color(0xFFE11D48),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  );
                }),
              );
            },
          ),
        ),
      ),
    );
  }
}
