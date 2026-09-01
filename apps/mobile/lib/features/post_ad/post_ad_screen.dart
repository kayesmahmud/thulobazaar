import 'package:flutter/material.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:provider/provider.dart';
import 'package:mobile/features/post_ad/create_ad_screen.dart';
import 'package:mobile/features/post_ad/models/ad_draft_model.dart';
import 'package:mobile/features/post_ad/services/ad_draft_service.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/widgets/main_app_bar.dart';
import 'package:mobile/core/widgets/main_drawer.dart';

class PostAdScreen extends StatefulWidget {
  const PostAdScreen({super.key});

  @override
  State<PostAdScreen> createState() => _PostAdScreenState();
}

class _PostAdScreenState extends State<PostAdScreen> {
  List<AdDraft> _drafts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDrafts();
  }

  Future<void> _loadDrafts() async {
    final drafts = await AdDraftService.loadDrafts();
    if (mounted) {
      setState(() {
        _drafts = drafts;
        _isLoading = false;
      });
    }
  }

  void _navigateToCreate({String? draftId}) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => CreateAdScreen(draftId: draftId)),
    ).then((_) => _loadDrafts());
  }

  Future<void> _deleteDraft(String id) async {
    await AdDraftService.deleteDraft(id);
    _loadDrafts();
  }

  String _formatRelativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1)
      return context.locale.languageCode == 'ne' ? 'भर्खरै' : 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.month}/${dt.day}';
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isNe = context.locale.languageCode == 'ne';

    if (!authProvider.isLoggedIn) {
      return const LoginGateScreen(
        kind: LoginGateKind.postAd,
        drawer: MainDrawer(),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: MainAppBar(
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
                onPressed: () => Navigator.pop(context),
              )
            : null,
      ),
      drawer: const MainDrawer(),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Section
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isNe
                          ? "निःशुल्क विज्ञापन पोस्ट गर्नुहोस्"
                          : "Post a Free Ad",
                      style: AppFont.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isNe
                          ? "आफ्नो सूची बनाउन तलका विवरणहरू भर्नुहोस्"
                          : "Fill in the details below to create your listing",
                      style: AppFont.inter(
                        fontSize: 16,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Saved Drafts Header Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: _drafts.isEmpty
                        ? BorderRadius.circular(12)
                        : const BorderRadius.vertical(top: Radius.circular(12)),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          isNe
                              ? "सुरक्षित ड्राफ्ट (${_drafts.length})"
                              : "Saved Drafts (${_drafts.length})",
                          style: AppFont.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: () => _navigateToCreate(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                        ),
                        icon: const Icon(LucideIcons.plus, size: 18),
                        label: Text(
                          isNe ? "नयाँ विज्ञापन" : "Start New Ad",
                          style: AppFont.inter(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),

                // Draft List
                if (_isLoading)
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      border: Border(
                        left: BorderSide(color: Colors.grey[200]!),
                        right: BorderSide(color: Colors.grey[200]!),
                        bottom: BorderSide(color: Colors.grey[200]!),
                      ),
                      borderRadius: const BorderRadius.vertical(
                        bottom: Radius.circular(12),
                      ),
                    ),
                    child: const Center(child: CircularProgressIndicator()),
                  )
                else if (_drafts.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      border: Border(
                        left: BorderSide(color: Colors.grey[200]!),
                        right: BorderSide(color: Colors.grey[200]!),
                        bottom: BorderSide(color: Colors.grey[200]!),
                      ),
                      borderRadius: const BorderRadius.vertical(
                        bottom: Radius.circular(12),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        isNe
                            ? "कुनै ड्राफ्ट छैन। नयाँ विज्ञापन सुरु गर्नुहोस्!"
                            : "No drafts yet. Start a new ad!",
                        style: AppFont.inter(
                          fontSize: 14,
                          color: Colors.grey[400],
                        ),
                      ),
                    ),
                  )
                else
                  Container(
                    decoration: BoxDecoration(
                      border: Border(
                        left: BorderSide(color: Colors.grey[200]!),
                        right: BorderSide(color: Colors.grey[200]!),
                        bottom: BorderSide(color: Colors.grey[200]!),
                      ),
                      borderRadius: const BorderRadius.vertical(
                        bottom: Radius.circular(12),
                      ),
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _drafts.length,
                      separatorBuilder: (context, index) =>
                          Divider(height: 1, color: Colors.grey[200]),
                      itemBuilder: (context, index) {
                        final draft = _drafts[index];
                        final timeStr = _formatRelativeTime(draft.updatedAt);
                        final lastEdited = isNe
                            ? "अन्तिम सम्पादन"
                            : "Last edited";
                        return _buildDraftItem(
                          context: context,
                          title: draft.displayName,
                          subtitle: "$lastEdited: $timeStr",
                          onContinue: () =>
                              _navigateToCreate(draftId: draft.id),
                          onDelete: () => _deleteDraft(draft.id),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDraftItem({
    required BuildContext context,
    required String title,
    required String subtitle,
    required VoidCallback onContinue,
    required VoidCallback onDelete,
  }) {
    final isNe = context.locale.languageCode == 'ne';
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: AppFont.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: AppFont.inter(fontSize: 14, color: Colors.grey[500]),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onContinue,
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.grey[50],
                    side: BorderSide(color: Colors.grey[200]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    isNe ? "जारी राख्नुहोस्" : "Continue",
                    style: AppFont.inter(
                      color: Colors.black87,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: onDelete,
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: BorderSide(color: Colors.red[100]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    isNe ? "हटाउनुहोस्" : "Delete",
                    style: AppFont.inter(
                      color: Colors.red,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
