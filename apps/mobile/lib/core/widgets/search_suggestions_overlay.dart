import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/search_history_service.dart';

/// Dropdown overlay for recent search suggestions.
/// Uses CompositedTransformTarget/Follower for positioning.
class SearchSuggestionsController {
  OverlayEntry? _entry;
  List<String> _searches = [];

  bool get isShowing => _entry != null;

  Future<void> show({
    required BuildContext context,
    required LayerLink layerLink,
    required double width,
    required TextEditingController textController,
    required VoidCallback onSearch,
  }) async {
    _searches = await SearchHistoryService.getRecentSearches();
    if (_searches.isEmpty) return;
    hide();

    _entry = OverlayEntry(
      builder: (_) => _SearchSuggestionsDropdown(
        layerLink: layerLink,
        width: width,
        searches: _searches,
        textController: textController,
        onSelect: (query) {
          textController.text = query;
          textController.selection = TextSelection.collapsed(
            offset: query.length,
          );
          hide();
          onSearch();
        },
        onRemove: (query) async {
          await SearchHistoryService.removeSearch(query);
          _searches.remove(query);
          if (_searches.isEmpty) {
            hide();
          } else {
            _entry?.markNeedsBuild();
          }
        },
        onClearAll: () async {
          await SearchHistoryService.clearAll();
          _searches = [];
          hide();
        },
      ),
    );
    Overlay.of(context).insert(_entry!);
  }

  void hide() {
    _entry?.remove();
    _entry = null;
  }
}

class _SearchSuggestionsDropdown extends StatelessWidget {
  final LayerLink layerLink;
  final double width;
  final List<String> searches;
  final TextEditingController textController;
  final void Function(String) onSelect;
  final void Function(String) onRemove;
  final VoidCallback onClearAll;

  const _SearchSuggestionsDropdown({
    required this.layerLink,
    required this.width,
    required this.searches,
    required this.textController,
    required this.onSelect,
    required this.onRemove,
    required this.onClearAll,
  });

  @override
  Widget build(BuildContext context) {
    final query = textController.text.trim().toLowerCase();
    final filtered = query.isEmpty
        ? searches
        : searches.where((s) => s.toLowerCase().contains(query)).toList();

    if (filtered.isEmpty) return const SizedBox.shrink();

    return Stack(
      children: [
        // Tap-away dismissal
        Positioned.fill(
          child: GestureDetector(
            onTap: () {
              FocusScope.of(context).unfocus();
            },
            behavior: HitTestBehavior.translucent,
          ),
        ),
        Positioned(
          width: width,
          child: CompositedTransformFollower(
            link: layerLink,
            showWhenUnlinked: false,
            offset: const Offset(0, 52),
            child: Material(
              elevation: 4,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                constraints: const BoxConstraints(maxHeight: 280),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Recent Searches',
                            style: AppFont.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[600],
                            ),
                          ),
                          GestureDetector(
                            onTap: onClearAll,
                            child: Text(
                              'Clear all',
                              style: AppFont.inter(
                                fontSize: 12,
                                color: const Color(0xFF10B981),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final search = filtered[index];
                          return InkWell(
                            onTap: () => onSelect(search),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    LucideIcons.clock,
                                    size: 14,
                                    color: Colors.grey[400],
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      search,
                                      style: AppFont.inter(
                                        fontSize: 14,
                                        color: Colors.grey[800],
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => onRemove(search),
                                    child: Icon(
                                      LucideIcons.x,
                                      size: 14,
                                      color: Colors.grey[400],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
