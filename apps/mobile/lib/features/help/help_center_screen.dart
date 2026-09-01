import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:mobile/features/contact/contact_screen.dart';
import 'package:mobile/features/support/support_tickets_screen.dart';

class _FaqItem {
  final String questionKey;
  final String answerKey;
  const _FaqItem({required this.questionKey, required this.answerKey});
}

class _FaqCategory {
  final String id;
  final String titleKey;
  final IconData icon;
  final String descriptionKey;
  final List<_FaqItem> faqs;
  const _FaqCategory({
    required this.id,
    required this.titleKey,
    required this.icon,
    required this.descriptionKey,
    required this.faqs,
  });
}

final _categories = <_FaqCategory>[
  const _FaqCategory(
    id: 'getting-started',
    titleKey: 'help.gettingStarted',
    icon: LucideIcons.rocket,
    descriptionKey: 'help.gettingStartedDesc',
    faqs: [
      _FaqItem(questionKey: 'help.q1', answerKey: 'help.a1'),
      _FaqItem(questionKey: 'help.q2', answerKey: 'help.a2'),
      _FaqItem(questionKey: 'help.q3', answerKey: 'help.a3'),
      _FaqItem(questionKey: 'help.q4', answerKey: 'help.a4'),
      _FaqItem(questionKey: 'help.q26', answerKey: 'help.a26'),
      _FaqItem(questionKey: 'help.q27', answerKey: 'help.a27'),
    ],
  ),
  const _FaqCategory(
    id: 'posting-ads',
    titleKey: 'help.postingAds',
    icon: LucideIcons.pencil,
    descriptionKey: 'help.postingAdsDesc',
    faqs: [
      _FaqItem(questionKey: 'help.q5', answerKey: 'help.a5'),
      _FaqItem(questionKey: 'help.q6', answerKey: 'help.a6'),
      _FaqItem(questionKey: 'help.q7', answerKey: 'help.a7'),
      _FaqItem(questionKey: 'help.q8', answerKey: 'help.a8'),
      _FaqItem(questionKey: 'help.q9', answerKey: 'help.a9'),
    ],
  ),
  const _FaqCategory(
    id: 'buying',
    titleKey: 'help.buying',
    icon: LucideIcons.shoppingCart,
    descriptionKey: 'help.buyingDesc',
    faqs: [
      _FaqItem(questionKey: 'help.q10', answerKey: 'help.a10'),
      _FaqItem(questionKey: 'help.q11', answerKey: 'help.a11'),
      _FaqItem(questionKey: 'help.q12', answerKey: 'help.a12'),
      _FaqItem(questionKey: 'help.q13', answerKey: 'help.a13'),
    ],
  ),
  const _FaqCategory(
    id: 'account',
    titleKey: 'help.accountProfile',
    icon: LucideIcons.user,
    descriptionKey: 'help.accountProfileDesc',
    faqs: [
      _FaqItem(questionKey: 'help.q14', answerKey: 'help.a14'),
      _FaqItem(questionKey: 'help.q15', answerKey: 'help.a15'),
      _FaqItem(questionKey: 'help.q16', answerKey: 'help.a16'),
      _FaqItem(questionKey: 'help.q17', answerKey: 'help.a17'),
    ],
  ),
  const _FaqCategory(
    id: 'payments',
    titleKey: 'help.paymentsPromotions',
    icon: LucideIcons.creditCard,
    descriptionKey: 'help.paymentsPromotionsDesc',
    faqs: [
      _FaqItem(questionKey: 'help.q18', answerKey: 'help.a18'),
      _FaqItem(questionKey: 'help.q19', answerKey: 'help.a19'),
      _FaqItem(questionKey: 'help.q20', answerKey: 'help.a20'),
      _FaqItem(questionKey: 'help.q21', answerKey: 'help.a21'),
    ],
  ),
  const _FaqCategory(
    id: 'safety',
    titleKey: 'help.safetySecurity',
    icon: LucideIcons.shield,
    descriptionKey: 'help.safetySecurityDesc',
    faqs: [
      _FaqItem(questionKey: 'help.q22', answerKey: 'help.a22'),
      _FaqItem(questionKey: 'help.q23', answerKey: 'help.a23'),
      _FaqItem(questionKey: 'help.q24', answerKey: 'help.a24'),
      _FaqItem(questionKey: 'help.q25', answerKey: 'help.a25'),
    ],
  ),
];

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String? _expandedCategoryId;
  String? _expandedFaqKey;

  List<_FaqCategory> get _filteredCategories {
    if (_searchQuery.isEmpty) return _categories;
    final query = _searchQuery.toLowerCase();
    return _categories
        .map(
          (cat) => _FaqCategory(
            id: cat.id,
            titleKey: cat.titleKey,
            icon: cat.icon,
            descriptionKey: cat.descriptionKey,
            faqs: cat.faqs
                .where(
                  (faq) =>
                      faq.questionKey.tr().toLowerCase().contains(query) ||
                      faq.answerKey.tr().toLowerCase().contains(query),
                )
                .toList(),
          ),
        )
        .where((cat) => cat.faqs.isNotEmpty)
        .toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredCategories;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          'help.title'.tr(),
          style: AppFont.poppins(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'help.searchPlaceholder'.tr(),
                hintStyle: AppFont.inter(color: Colors.grey[400]),
                prefixIcon: Icon(
                  LucideIcons.search,
                  color: Colors.grey[400],
                  size: 20,
                ),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(
                          LucideIcons.x,
                          color: Colors.grey[400],
                          size: 18,
                        ),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              style: AppFont.inter(fontSize: 15),
            ),
          ),

          // FAQ list
          Expanded(
            child: filtered.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length + 1, // +1 for bottom card
                    itemBuilder: (context, index) {
                      if (index == filtered.length) {
                        return _buildStillNeedHelpCard();
                      }
                      return _buildCategoryCard(filtered[index]);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.searchX, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(
            'help.noResults'.tr(),
            style: AppFont.inter(
              color: Colors.grey[500],
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'help.tryDifferentKeywords'.tr(),
            style: AppFont.inter(color: Colors.grey[400], fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(_FaqCategory category) {
    final isExpanded =
        _expandedCategoryId == category.id ||
        _searchQuery.isNotEmpty; // Auto-expand when searching

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // Category header
          InkWell(
            onTap: _searchQuery.isNotEmpty
                ? null
                : () => setState(() {
                    _expandedCategoryId = isExpanded ? null : category.id;
                  }),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE11D48).withAlpha(25),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      category.icon,
                      size: 20,
                      color: const Color(0xFFE11D48),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          category.titleKey.tr(),
                          style: AppFont.inter(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        Text(
                          category.descriptionKey.tr(),
                          style: AppFont.inter(
                            fontSize: 13,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_searchQuery.isEmpty)
                    Icon(
                      isExpanded
                          ? LucideIcons.chevronUp
                          : LucideIcons.chevronDown,
                      size: 20,
                      color: Colors.grey[400],
                    ),
                ],
              ),
            ),
          ),

          // FAQ items
          if (isExpanded)
            ...category.faqs.asMap().entries.map((entry) {
              final faqKey = '${category.id}-${entry.key}';
              final faq = entry.value;
              final isFaqExpanded = _expandedFaqKey == faqKey;

              return Column(
                children: [
                  Divider(height: 1, color: Colors.grey[200]),
                  InkWell(
                    onTap: () => setState(() {
                      _expandedFaqKey = isFaqExpanded ? null : faqKey;
                    }),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  faq.questionKey.tr(),
                                  style: AppFont.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF374151),
                                  ),
                                ),
                              ),
                              Icon(
                                isFaqExpanded
                                    ? LucideIcons.minus
                                    : LucideIcons.plus,
                                size: 18,
                                color: const Color(0xFFE11D48),
                              ),
                            ],
                          ),
                          if (isFaqExpanded) ...[
                            const SizedBox(height: 10),
                            Text(
                              faq.answerKey.tr(),
                              style: AppFont.inter(
                                fontSize: 13,
                                color: Colors.grey[600],
                                height: 1.5,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }),
        ],
      ),
    );
  }

  Widget _buildStillNeedHelpCard() {
    return Container(
      margin: const EdgeInsets.only(top: 8, bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.messageCircle, color: Colors.white, size: 32),
          const SizedBox(height: 12),
          Text(
            'help.stillNeedHelp'.tr(),
            style: AppFont.poppins(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'help.supportTeamHere'.tr(),
            style: AppFont.inter(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const SupportTicketsScreen(),
                      ),
                    );
                  },
                  icon: const Icon(LucideIcons.ticket, size: 16),
                  label: Text(
                    'help.supportTicket'.tr(),
                    style: AppFont.inter(fontWeight: FontWeight.w500),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ContactScreen()),
                    );
                  },
                  icon: const Icon(LucideIcons.mail, size: 16),
                  label: Text(
                    'help.contactUs'.tr(),
                    style: AppFont.inter(fontWeight: FontWeight.w500),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
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
