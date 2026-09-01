import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:mobile/core/widgets/staggered_fade_in.dart';
import 'package:mobile/core/widgets/floating_widget.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/widgets/app_cached_image.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/utils/page_transitions.dart';
import 'package:mobile/features/ad_detail/ad_detail_screen.dart';
import 'package:mobile/features/post_ad/create_ad_screen.dart';
import 'package:mobile/core/widgets/edit_ad_warning_dialog.dart';
import 'package:mobile/core/widgets/load_error_view.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class MyAdsScreen extends StatefulWidget {
  const MyAdsScreen({super.key});

  @override
  State<MyAdsScreen> createState() => _MyAdsScreenState();
}

class _MyAdsScreenState extends State<MyAdsScreen>
    with SingleTickerProviderStateMixin {
  final AdClient _adClient = AdClient();
  late TabController _tabController;

  List<AdWithDetails> _allAds = [];
  bool _isLoading = true;
  String? _error;
  bool _isOffline = false;

  // Tab filters
  static const List<String> _tabs = ['All', 'Active', 'Pending', 'Rejected'];
  static final Map<String, AdStatus?> _statusMap = {
    'All': null,
    'Active': AdStatus.active,
    'Pending': AdStatus.pending,
    'Rejected': AdStatus.rejected,
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _fetchAds();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) {
      setState(() {}); // Rebuild to filter ads
    }
  }

  String _localizedTabName(String tab) {
    switch (tab) {
      case 'All':
        return 'myAds.all'.tr();
      case 'Active':
        return 'myAds.active'.tr();
      case 'Pending':
        return 'myAds.pending'.tr();
      case 'Sold':
        return 'myAds.sold'.tr();
      case 'Rejected':
        return 'myAds.rejected'.tr();
      default:
        return tab;
    }
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
    final status = _statusMap[_tabs[_tabController.index]];
    if (status == null) return _allAds;
    return _allAds.where((ad) => ad.status == status).toList();
  }

  Map<String, int> get _statusCounts {
    return {
      'All': _allAds.length,
      'Active': _allAds.where((a) => a.status == AdStatus.active).length,
      'Pending': _allAds.where((a) => a.status == AdStatus.pending).length,
      'Rejected': _allAds.where((a) => a.status == AdStatus.rejected).length,
    };
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
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          'myAds.title'.tr(),
          style: AppFont.inter(
            fontWeight: FontWeight.bold,
            color: AppTheme.textDark,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textDark),
      ),
      body: Column(
        children: [
          // Stats Row
          _buildStatsRow(),

          // Tab Bar
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: AppTheme.primary,
              unselectedLabelColor: Colors.grey,
              indicatorColor: AppTheme.primary,
              labelStyle: AppFont.inter(
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
              tabs: _tabs.map((tab) {
                final count = _statusCounts[tab] ?? 0;
                return Tab(text: '${_localizedTabName(tab)} ($count)');
              }).toList(),
            ),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : _error != null
                ? _buildErrorState()
                : _filteredAds.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: () async {
                      await _fetchAds();
                      HapticFeedback.mediumImpact();
                    },
                    color: AppTheme.primary,
                    child: ListView.builder(
                      cacheExtent: 500,
                      padding: const EdgeInsets.all(16),
                      itemCount: _filteredAds.length,
                      itemBuilder: (context, index) =>
                          _buildAdItem(_filteredAds[index]),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    final counts = _statusCounts;
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(
            'dashboard.total'.tr(),
            counts['All'] ?? 0,
            Colors.blue,
          ),
          _buildStatItem(
            'myAds.active'.tr(),
            counts['Active'] ?? 0,
            Colors.green,
          ),
          _buildStatItem(
            'myAds.pending'.tr(),
            counts['Pending'] ?? 0,
            Colors.orange,
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, int count, Color color) {
    return Column(
      children: [
        Text(
          count.toString(),
          style: AppFont.inter(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: AppFont.inter(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

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
              'myAds.noAdsFound'.tr(),
              style: AppFont.inter(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'myAds.startSelling'.tr(),
              style: AppFont.inter(color: Colors.grey[500]),
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

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          FadeScaleRoute(
            builder: (_) => AdDetailScreen(adId: ad.id, slug: ad.slug),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          children: [
            // Main Content Row
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  Hero(
                    tag: 'myads-image-${ad.id}',
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
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
                  ),
                  const SizedBox(width: 12),

                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ad.title,
                          style: AppFont.inter(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatPrice(ad.price),
                          style: AppFont.inter(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            _buildStatusBadge(ad.status.name),
                            const SizedBox(width: 8),
                            Icon(
                              LucideIcons.eye,
                              size: 14,
                              color: Colors.grey[500],
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${ad.viewCount ?? 0}',
                              style: AppFont.inter(
                                fontSize: 12,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Menu
                  PopupMenuButton<String>(
                    icon: Icon(
                      LucideIcons.moreVertical,
                      color: Colors.grey[600],
                    ),
                    onSelected: (value) async {
                      switch (value) {
                        case 'view':
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  AdDetailScreen(adId: ad.id, slug: ad.slug),
                            ),
                          );
                          break;
                        case 'edit':
                          final proceed = await confirmAdEdit(
                            context,
                            adClient: _adClient,
                            ad: ad,
                          );
                          if (!proceed) break;
                          if (!mounted) break;
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CreateAdScreen(existingAd: ad),
                            ),
                          );
                          // Refresh ads list when returning
                          if (mounted) _fetchAds();
                          break;
                        case 'delete':
                          _deleteAd(ad);
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'view',
                        child: Text('myAds.viewAd'.tr()),
                      ),
                      if (ad.status == AdStatus.pending ||
                          ad.status == AdStatus.rejected ||
                          ad.status == AdStatus.active)
                        PopupMenuItem(
                          value: 'edit',
                          child: Text(
                            ad.status == AdStatus.rejected
                                ? (context.locale.languageCode == 'ne'
                                      ? 'सम्पादन र पुन: पेश'
                                      : 'Edit & Resubmit')
                                : 'myAds.edit'.tr(),
                          ),
                        ),
                      PopupMenuItem(
                        value: 'delete',
                        child: Text(
                          'common.delete'.tr(),
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Footer with date
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(12),
                ),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.clock, size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    'Posted ${_formatDate(ad.publishedAt)}',
                    style: AppFont.inter(fontSize: 12, color: Colors.grey[500]),
                  ),
                  const Spacer(),
                  if (ad.categoryName != null)
                    Text(
                      ad.categoryName!,
                      style: AppFont.inter(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                ],
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

    switch (status.toLowerCase()) {
      case 'active':
        bgColor = Colors.green[50]!;
        textColor = Colors.green[700]!;
        label = 'myAds.active'.tr();
        break;
      case 'pending':
        bgColor = Colors.orange[50]!;
        textColor = Colors.orange[700]!;
        label = 'myAds.pending'.tr();
        break;
      case 'sold':
        bgColor = Colors.purple[50]!;
        textColor = Colors.purple[700]!;
        label = 'myAds.sold'.tr();
        break;
      case 'rejected':
        bgColor = Colors.red[50]!;
        textColor = Colors.red[700]!;
        label = 'myAds.rejected'.tr();
        break;
      default:
        bgColor = Colors.grey[100]!;
        textColor = Colors.grey[700]!;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: AppFont.inter(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  String _formatPrice(double? price) =>
      formatLocalizedPrice(price, context.locale.languageCode);

  String _formatDate(DateTime? date) {
    if (date == null) return 'Unknown';
    final now = DateTime.now();
    final diff = now.difference(date);

    final isNe = context.locale.languageCode == 'ne';
    if (diff.inDays == 0) return isNe ? 'आज' : 'Today';
    if (diff.inDays == 1) return isNe ? 'हिजो' : 'Yesterday';
    if (diff.inDays < 7)
      return isNe ? '${diff.inDays} दिन अघि' : '${diff.inDays} days ago';
    if (diff.inDays < 30) {
      final w = (diff.inDays / 7).floor();
      return isNe ? '$w हप्ता अघि' : '$w weeks ago';
    }
    final m = (diff.inDays / 30).floor();
    return isNe ? '$m महिना अघि' : '$m months ago';
  }
}
