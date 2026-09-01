import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/models/message.dart';

enum MessageAction { copy, edit, delete, report }

class _ActionItem {
  final MessageAction action;
  final String labelKey;
  final IconData icon;
  final bool destructive;

  const _ActionItem({
    required this.action,
    required this.labelKey,
    required this.icon,
    this.destructive = false,
  });
}

const _copyItem = _ActionItem(
  action: MessageAction.copy,
  labelKey: 'messages.copy',
  icon: LucideIcons.copy,
);
const _editItem = _ActionItem(
  action: MessageAction.edit,
  labelKey: 'messages.editMessage',
  icon: LucideIcons.pencil,
);
const _deleteItem = _ActionItem(
  action: MessageAction.delete,
  labelKey: 'messages.deleteMessage',
  icon: LucideIcons.trash2,
  destructive: true,
);
const _reportItem = _ActionItem(
  action: MessageAction.report,
  labelKey: 'chat.reportUser',
  icon: LucideIcons.flag,
  destructive: true,
);

List<_ActionItem> _itemsFor(Message message, bool isMe) {
  final isImage = message.type == MessageType.image;
  if (isMe) {
    return isImage ? [_deleteItem] : [_copyItem, _editItem, _deleteItem];
  }
  return isImage ? [_reportItem] : [_copyItem, _reportItem];
}

/// Shows a bottom sheet with actions for a chat message.
/// Returns the chosen action, or null if dismissed.
Future<MessageAction?> showMessageActionsSheet(
  BuildContext context, {
  required Message message,
  required bool isMe,
}) {
  if (message.isDeleted) return Future.value(null);
  return showModalBottomSheet<MessageAction>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (_) => _MessageActionsSheet(items: _itemsFor(message, isMe)),
  );
}

class _MessageActionsSheet extends StatelessWidget {
  final List<_ActionItem> items;

  const _MessageActionsSheet({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          ...items.map((item) => _buildActionTile(context, item)),
        ],
      ),
    );
  }

  Widget _buildActionTile(BuildContext context, _ActionItem item) {
    final color = item.destructive ? const Color(0xFFEF4444) : Colors.grey[800];
    return InkWell(
      onTap: () => Navigator.pop(context, item.action),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Icon(item.icon, size: 20, color: color),
            const SizedBox(width: 16),
            Text(
              item.labelKey.tr(),
              style: AppFont.inter(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
