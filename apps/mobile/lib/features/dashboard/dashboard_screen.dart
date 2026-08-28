import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/widgets/app_cached_image.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/ad_detail/ad_detail_screen.dart';
import 'package:mobile/features/main_nav/main_nav_screen.dart';
import 'package:mobile/features/post_ad/create_ad_screen.dart';
import 'package:mobile/features/post_ad/post_ad_screen.dart';
import 'package:mobile/features/promotion/promote_ad_screen.dart';
import 'package:mobile/core/widgets/staggered_fade_in.dart';
import 'package:mobile/core/widgets/count_up_text.dart';
import 'package:mobile/core/widgets/floating_widget.dart';
import 'package:mobile/core/widgets/edit_ad_warning_dialog.dart';
import 'package:mobile/core/widgets/load_error_view.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class DashboardScreen extends StatefulWidget {
  final String initialFilter;

  const DashboardScreen({super.key, this.initialFilter = 'Active'});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final AdClient _adClient = AdClient();
  late String _selectedFilter;

  List<AdWithDetails> _allAds = [];
  bool _isLoading = true;
  String? _error;
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    _selectedFilter = widget.initialFilter;
    _fetchAds();
  }

  Future<void> _fetchAds() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _adClient.getMyAds(limit: 100);
    if (!mounted) return;

    if (response.success) {
      setState(() {
        _isLoading = false;
        _allAds = response.data;
        _error = null;
      });
    } else {
      // getMyAds swallows network errors into success == false, so classify
      // connectivity here to show the right offline/error message.
      final offline = await _isOfflineError();
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = response.errorMessage ?? 'Failed to load ads';
        _isOffline = offline;
      });
    }
  }

  /// True when the device has no connectivity at all (drives offline vs
  /// generic-error copy in [LoadErrorView]).
  Future<bool> _isOfflineError() async {
    try {
      final results = await Connectivity().checkConnectivity();
      return results.every((r) => r == ConnectivityResult.none);
    } catch (_) {
      return false;
    }
  }

  List<AdWithDetails> get _filteredAds {
    switch (_selectedFilter) {
      case 'Active':
        return _allAds.where((ad) => ad.status == AdStatus.active).toList();
      case 'Pending':
        return _allAds.where((ad) => ad.status == AdStatus.pending).toList();
      case 'Rejected':
        return _allAds.where((ad) => ad.status == AdStatus.rejected).toList();
      default:
        return _allAds;
    }
  }

  Map<String, int> get _statusCounts {
    return {
      'Active': _allAds.where((a) => a.status == AdStatus.active).length,
      'Pending': _allAds.where((a) => a.status == AdStatus.pending).length,
      'Rejected': _allAds.where((a) => a.status == AdStatus.rejected).length,
    };
  }

  int get _totalViews {
    return _allAds.fold(0, (sum, ad) => sum + (ad.viewCount ?? 0));
  }

  Future<void> _deleteAd(AdWithDetails ad) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('dashboard.deleteAd'.tr()),
        content: Text('dashboard.confirmDelete'.tr(args: [ad.title])),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('common.delete'.tr()),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final response = await _adClient.deleteAd(ad.id);
      if (response.success) {
        setState(() {
          _allAds.removeWhere((a) => a.id == ad.id);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('dashboard.adDeleted'.tr()),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.error ?? 'dashboard.failedToDelete'.tr()),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final userName =
        authProvider.user?['fullName'] ??
        authProvider.user?['businessName'] ??
        'User';
    final counts = _statusCounts;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: _isLoading
            ? Column(
                children: [
                  _buildTopBar(),
                  _buildGradientHeader(userName, counts),
                  Expanded(
                    child: Skeletonizer(
                      enabled: true,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: 4,
                        itemBuilder: (context, index) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Container(
                            height: 100,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 68,
                                  height: 68,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                        width: 150,
                                        height: 14,
                                        color: Colors.white,
                                      ),
                                      const SizedBox(height: 8),
                                      Container(
                                        width: 80,
                                        height: 12,
                                        color: Colors.white,
                                      ),
                                      const SizedBox(height: 8),
                                      Container(
                                        width: 60,
                                        height: 12,
                                        color: Colors.white,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              )
            : _error != null
            ? Column(
                children: [
                  _buildTopBar(),
                  _buildGradientHeader(userName, counts),
                  Expanded(child: _buildErrorState()),
                ],
              )
            : RefreshIndicator(
                onRefresh: () async {
                  await _fetchAds();
                  HapticFeedback.mediumImpact();
                },
                color: AppTheme.primary,
                child: CustomScrollView(
                  slivers: [
                    // Top App Bar
                    SliverToBoxAdapter(child: _buildTopBar()),

                    // Gradient Header with Stats
                    SliverToBoxAdapter(
                      child: _buildGradientHeader(userName, counts),
                    ),

                    // White card section with rounded top
                    SliverToBoxAdapter(
                      child: Container(
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(24),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // My Listings Header
                            Padding(
                              padding: const EdgeInsets.fromLTRB(
                                20,
                                24,
                                20,
                                16,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'dashboard.myListings'.tr(),
                                    style: GoogleFonts.inter(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textDark,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'dashboard.manageAds'.tr(),
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Filter Chips
                            _buildFilterChips(counts),

                            // Pending info banner
                            if (_selectedFilter == 'Pending')
                              _buildPendingBanner(),

                            const SizedBox(height: 8),
                          ],
                        ),
                      ),
                    ),

                    // Ads List (or empty state)
                    if (_filteredAds.isEmpty)
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: Container(
                          color: Colors.white,
                          child: _buildEmptyState(),
                        ),
                      )
                    else
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => Container(
                            color: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: _buildAdItem(_filteredAds[index]),
                          ),
                          childCount: _filteredAds.length,
                        ),
                      ),
                  ],
                ),
              ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.white,
      child: Row(
        children: [
          IconButton(
            icon: const Icon(LucideIcons.menu, color: Colors.black87),
            onPressed: () => Navigator.pop(context),
          ),
          const Spacer(),
          Image.asset(
            'assets/images/logo.png',
            height: 32,
            errorBuilder: (context, error, stackTrace) => Text(
              'common.appNameFallback'.tr(),
              style: GoogleFonts.poppins(
                color: AppTheme.primary,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const Spacer(),
          const SizedBox(width: 48), // Balance the menu icon
        ],
      ),
    );
  }

  Widget _buildGradientHeader(String userName, Map<String, int> counts) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)], // Purple to Pink
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'dashboard.title'.tr(),
            style: GoogleFonts.inter(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'dashboard.welcomeBack'.tr(args: [userName]),
            style: GoogleFonts.inter(
              fontSize: 15,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          const SizedBox(height: 20),

          // Stats Row
          Row(
            children: [
              _buildStatCard(
                icon: LucideIcons.barChart3,
                iconBgColor: const Color(0xFF3B82F6),
                value: _allAds.length,
                label: 'dashboard.total'.tr(),
              ),
              const SizedBox(width: 12),
              _buildStatCard(
                icon: LucideIcons.checkCircle,
                iconBgColor: const Color(0xFF22C55E),
                value: counts['Active'] ?? 0,
                label: 'dashboard.active'.tr(),
              ),
              const SizedBox(width: 12),
              _buildStatCard(
                icon: LucideIcons.eye,
                iconBgColor: const Color(0xFFEC4899),
                value: _totalViews,
                label: 'dashboard.views'.tr(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconBgColor,
    required int value,
    required String label,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: Colors.white, size: 18),
            ),
            const SizedBox(height: 8),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: CountUpText(
                value: value,
                formatter: _formatCompactNumber,
                style: GoogleFonts.inter(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChips(Map<String, int> counts) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: _buildFilterChip(
              'Active',
              counts['Active'] ?? 0,
              Colors.green,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildFilterChip(
              'Pending',
              counts['Pending'] ?? 0,
              Colors.orange,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildFilterChip(
              'Rejected',
              counts['Rejected'] ?? 0,
              Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, int count, Color activeColor) {
    final isSelected = _selectedFilter == label;

    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = label),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? activeColor : Colors.grey[300]!,
            width: 1,
          ),
        ),
        child: Center(
          child: Text(
            _localizedFilterLabel(label, count),
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.white : Colors.grey[700],
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }

  String _localizedFilterLabel(String label, int count) {
    switch (label) {
      case 'Active':
        return 'dashboard.activeCount'.tr(args: ['$count']);
      case 'Pending':
        return 'dashboard.pendingCount'.tr(args: ['$count']);
      case 'Rejected':
        return 'dashboard.rejectedCount'.tr(args: ['$count']);
      default:
        return '$label ($count)';
    }
  }

  Widget _buildPendingBanner() {
    final lang = context.locale.languageCode;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.amber.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.amber.shade200),
        ),
        child: Row(
          children: [
            Icon(LucideIcons.clock, size: 20, color: Colors.amber[700]),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                lang == 'ne'
                    ? 'तपाईंको विज्ञापन समीक्षाको लागि पर्खिरहेको छ। सम्पादकले स्वीकृत गरेपछि यो सक्रिय हुनेछ। तपाईं अझै पनि पेन्डिङ विज्ञापनहरू सम्पादन गर्न सक्नुहुन्छ।'
                    : 'Your ads are awaiting review. They will go live once an editor approves them. You can still edit pending ads.',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.amber[900],
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Codes with a dedicated translation; anything else gets the generic line.
  static const _aiHoldCodes = {
    'stock_photo',
    'unclear_photos',
    'details_mismatch',
    'suspicious_price',
    'duplicate',
    'policy_check',
  };

  String _aiHoldMessage(String? code) =>
      code != null && _aiHoldCodes.contains(code)
      ? 'dashboard.aiHold.$code'.tr()
      : 'dashboard.aiHold.generic'.tr();

  Widget _buildErrorState() {
    return LoadErrorView(isOffline: _isOffline, onRetry: _fetchAds);
  }

  Widget _buildEmptyState() {
    return StaggeredFadeIn(
      index: 0,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FloatingWidget(
              child: Icon(
                LucideIcons.package,
                size: 64,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'dashboard.noAdsFound'.tr(),
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'dashboard.startSelling'.tr(),
              style: GoogleFonts.inter(color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdItem(AdWithDetails ad) {
    final imageUrl = ad.thumbnail != null
        ? ApiConfig.getAdImageUrl(ad.thumbnail)
        : (ad.images.isNotEmpty
              ? ApiConfig.getAdImageUrl(ad.images.first)
              : null);

    final isActive = ad.status == AdStatus.active;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image and Details Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 80,
                  height: 80,
                  color: Colors.grey[100],
                  child: imageUrl != null
                      ? AppCachedImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                          memCacheWidth: 200,
                        )
                      : Icon(LucideIcons.image, color: Colors.grey[400]),
                ),
              ),
              const SizedBox(width: 14),

              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ad.title,
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppTheme.textDark,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildStatusBadge(ad.status.name),
                        const SizedBox(width: 10),
                        Icon(
                          LucideIcons.calendar,
                          size: 13,
                          color: Colors.grey[500],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatDate(ad.publishedAt),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          LucideIcons.eye,
                          size: 14,
                          color: Colors.grey[500],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatCompactNumber(ad.viewCount ?? 0),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          // AI hold-reason banner: the AI couldn't auto-approve this ad and
          // says why — mapped from the whitelisted code, never raw AI text.
          if (ad.status == AdStatus.pending && ad.aiHeld) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F3FF),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFDDD6FE)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    LucideIcons.sparkles,
                    size: 16,
                    color: Color(0xFF7C3AED),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _aiHoldMessage(ad.aiReasonCode),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            height: 1.4,
                            color: const Color(0xFF5B21B6),
                          ),
                        ),
                        const SizedBox(height: 6),
                        // Nudge toward the Edit button right below this card's
                        // banner — fixing the ad beats waiting for review.
                        Text(
                          'dashboard.aiHold.editNudge'.tr(),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            height: 1.4,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF6D28D9),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),

          // Price Row
          Row(
            children: [
              Text(
                'dashboard.price'.tr(),
                style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[600]),
              ),
              const Spacer(),
              Text(
                _formatPrice(ad.price),
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Promote Button (only for active ads)
          if (isActive)
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => PromoteAdScreen(
                      adId: ad.id,
                      adTitle: ad.title,
                      adThumbnail: imageUrl,
                    ),
                  ),
                );
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.zap, size: 18, color: Colors.white),
                    const SizedBox(width: 6),
                    Text(
                      'dashboard.promote'.tr(),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          if (isActive) const SizedBox(height: 10),

          // Edit button (pending/rejected/active; live ads confirm first)
          if (ad.status == AdStatus.pending ||
              ad.status == AdStatus.rejected ||
              ad.status == AdStatus.active) ...[
            _buildActionButton(
              icon: LucideIcons.edit,
              label: ad.status == AdStatus.rejected
                  ? (context.locale.languageCode == 'ne'
                        ? 'सम्पादन र पुन: पेश'
                        : 'Edit & Resubmit')
                  : (context.locale.languageCode == 'ne' ? 'सम्पादन' : 'Edit'),
              color: ad.status == AdStatus.rejected
                  ? Colors.orange
                  : Colors.indigo,
              filled: true,
              onTap: () async {
                final proceed = await confirmAdEdit(
                  context,
                  adClient: _adClient,
                  ad: ad,
                );
                if (!proceed) return;
                if (!mounted) return;
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => CreateAdScreen(existingAd: ad),
                  ),
                );
                if (mounted) _fetchAds();
              },
            ),
            const SizedBox(height: 10),
          ],

          // Action Buttons Row
          Row(
            children: [
              // View Button
              Expanded(
                child: _buildActionButton(
                  icon: LucideIcons.eye,
                  label: 'dashboard.view'.tr(),
                  color: Colors.blue,
                  filled: true,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            AdDetailScreen(adId: ad.id, slug: ad.slug),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 10),

              // Delete Button (outlined)
              Expanded(
                child: _buildActionButton(
                  icon: LucideIcons.trash2,
                  label: 'common.delete'.tr(),
                  color: Colors.red,
                  filled: false,
                  onTap: () => _deleteAd(ad),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required bool filled,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: filled ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color, width: 1.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: filled ? Colors.white : color),
            const SizedBox(width: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: filled ? Colors.white : color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;
    IconData? icon;

    switch (status.toLowerCase()) {
      case 'active':
        bgColor = Colors.green[50]!;
        textColor = Colors.green[700]!;
        label = 'dashboard.active'.tr();
        icon = LucideIcons.check;
        break;
      case 'pending':
        bgColor = Colors.orange[50]!;
        textColor = Colors.orange[700]!;
        label = 'myAds.pending'.tr();
        icon = LucideIcons.clock;
        break;
      case 'sold':
        bgColor = Colors.purple[50]!;
        textColor = Colors.purple[700]!;
        label = 'myAds.sold'.tr();
        icon = LucideIcons.check;
        break;
      case 'rejected':
        bgColor = Colors.red[50]!;
        textColor = Colors.red[700]!;
        label = 'myAds.rejected'.tr();
        icon = LucideIcons.x;
        break;
      default:
        bgColor = Colors.grey[100]!;
        textColor = Colors.grey[700]!;
        label = status;
        icon = null;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(LucideIcons.home, 'nav.home'.tr(), 0),
              _buildNavItem(LucideIcons.search, 'nav.search'.tr(), 1),
              _buildFabButton(),
              _buildNavItem(LucideIcons.messageSquare, 'nav.messages'.tr(), 2),
              _buildNavItem(LucideIcons.user, 'nav.profile'.tr(), 3),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    return GestureDetector(
      onTap: () {
        // Navigate back to main nav and switch to the appropriate tab
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => MainNavScreen(initialIndex: index)),
          (route) => false,
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.grey, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 11, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildFabButton() {
    return GestureDetector(
      onTap: () {
        // Post Ad is a pushed route, not a tab: MainNavScreen's IndexedStack
        // only has children 0-3, so initialIndex: 4 threw. Push the same screen
        // the main nav FAB pushes, and keep the dashboard underneath to return to.
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const PostAdScreen()),
        );
      },
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF10B981), Color(0xFF059669)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF10B981).withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(LucideIcons.plus, color: Colors.white, size: 28),
      ),
    );
  }

  String _formatCompactNumber(int num) {
    if (num >= 1000000) return '${(num / 1000000).toStringAsFixed(1)}M';
    if (num >= 1000) return '${(num / 1000).toStringAsFixed(1)}K';
    return num.toString();
  }

  String _formatPrice(double? price) =>
      formatLocalizedPrice(price, context.locale.languageCode);

  String _formatDate(DateTime? date) {
    if (date == null) return 'Unknown';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}
