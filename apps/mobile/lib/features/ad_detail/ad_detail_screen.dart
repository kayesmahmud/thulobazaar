import 'dart:async';
import 'dart:developer' as developer;
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show MethodChannel;
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/api/favorites_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/shop/shop_screen.dart';
import 'package:mobile/features/main_nav/main_nav_screen.dart';
import 'package:mobile/core/widgets/ad_card.dart';
import 'package:mobile/features/ad_detail/widgets/ad_image_gallery.dart';
import 'package:mobile/features/ad_detail/widgets/ad_specifications.dart';
import 'package:mobile/features/ad_detail/widgets/seller_card.dart';
import 'package:mobile/features/ad_detail/widgets/floating_contact_bar.dart';
import 'package:mobile/features/ad_detail/widgets/ad_detail_banners.dart';
import 'package:mobile/features/ad_detail/widgets/report_ad_sheet.dart';
import 'package:mobile/core/widgets/ad_banner_widget.dart';
import 'package:mobile/core/services/ad_service.dart';
import 'package:mobile/core/services/analytics_service.dart';
import 'package:mobile/core/services/notification_service.dart';
import 'package:mobile/core/services/recent_ads_service.dart';
import 'package:mobile/core/widgets/edit_ad_warning_dialog.dart';
import 'package:mobile/features/auth/signin_screen.dart';
import 'package:mobile/features/post_ad/create_ad_screen.dart';
import 'package:mobile/features/promotion/promote_ad_screen.dart';
import 'package:skeletonizer/skeletonizer.dart';

class AdDetailScreen extends StatefulWidget {
  final int? adId;
  final String? slug;

  const AdDetailScreen({super.key, this.adId, this.slug});

  @override
  State<AdDetailScreen> createState() => _AdDetailScreenState();
}

class _AdDetailScreenState extends State<AdDetailScreen> {
  final AdClient _adClient = AdClient();
  final FavoritesClient _favoritesClient = FavoritesClient();
  final ScrollController _scrollController = ScrollController();
  static const _iosShareChannel = MethodChannel('app/native_share');

  AdWithDetails? _ad;
  List<AdWithDetails> _relatedAds = [];
  bool _isLoading = true;
  String? _error;

  bool _isFavorite = false;
  bool _isFavoriteLoading = false;

  // Scroll-aware contact bar
  double _lastScrollPosition = 0;
  bool _isContactBarVisible = true;

  @override
  void initState() {
    super.initState();
    _fetchAdDetails();
    _scrollController.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _handleScroll() {
    final currentPos = _scrollController.position.pixels;
    if (currentPos < 0) return; // Ignore bounce

    if (currentPos < _lastScrollPosition || currentPos < 50) {
      // Scrolling UP or near top → show
      if (!_isContactBarVisible) {
        setState(() => _isContactBarVisible = true);
      }
    } else if (currentPos > _lastScrollPosition && currentPos > 100) {
      // Scrolling DOWN past 100px → hide
      if (_isContactBarVisible) {
        setState(() => _isContactBarVisible = false);
      }
    }

    _lastScrollPosition = currentPos;
  }

  Future<void> _fetchAdDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      ApiResponse<AdWithDetails> response;

      if (widget.slug != null) {
        response = await _adClient.getAdBySlug(widget.slug!);
      } else if (widget.adId != null) {
        response = await _adClient.getAdById(widget.adId!);
      } else {
        setState(() {
          _error = 'No ad ID or slug provided';
          _isLoading = false;
        });
        return;
      }

      if (response.success && response.data != null) {
        final ad = response.data!;
        _adClient.incrementView(ad.id);

        // One view = one remarketing signal + one on-device recents entry.
        unawaited(AnalyticsService.logViewItem(ad));
        unawaited(RecentAdsService.recordView(ad));

        final related = await _adClient.getRelatedAds(
          ad.categoryId,
          limit: 4,
          excludeAdId: ad.id,
        );

        // Check favorite status if logged in
        if (mounted) {
          _checkFavoriteStatus(ad.id);
        }

        if (mounted) {
          setState(() {
            _ad = ad;
            _relatedAds = related;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = response.errorMessage;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = context.locale.languageCode == 'ne'
              ? 'विज्ञापन लोड गर्न असफल: $e'
              : 'Failed to load ad: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _checkFavoriteStatus(int adId) async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) return;

    try {
      final response = await _favoritesClient.checkFavorite(adId);
      if (mounted && response.success) {
        setState(() {
          _isFavorite = response.isFavorited;
        });
      }
    } catch (e) {
      if (kDebugMode)
        developer.log(
          'Error checking favorite status: $e',
          name: 'AdDetailScreen',
        );
    }
  }

  Future<void> _toggleFavorite() async {
    // First favourite = moment of intent — safe spot for the one-shot
    // notification permission prompt (no-op once requested).
    unawaited(NotificationService().requestPermissionsIfNeeded());

    final authProvider = context.read<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SignInScreen(
            onSuccess: () {
              if (mounted) Navigator.pop(context);
            },
          ),
        ),
      );
      return;
    }

    if (_ad == null) return;

    final previousState = _isFavorite;
    setState(() => _isFavorite = !_isFavorite); // Optimistic toggle

    try {
      ApiResult response;
      if (previousState) {
        response = await _favoritesClient.removeFromFavorites(_ad!.id);
      } else {
        response = await _favoritesClient.addToFavorites(_ad!.id);
      }

      if (mounted && !response.success) {
        setState(() => _isFavorite = previousState); // Rollback
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response.error ??
                  (context.locale.languageCode == 'ne'
                      ? 'मनपर्ने अपडेट गर्न असफल'
                      : 'Failed to update favorite'),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isFavorite = previousState); // Rollback
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: $e',
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: _isLoading
          ? _buildLoadingSkeleton()
          : _error != null
          ? _buildErrorState()
          : _buildContent(),
    );
  }

  Widget _buildLoadingSkeleton() {
    return Skeletonizer(
      enabled: true,
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: Colors.white,
            leading: Container(
              margin: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
              child: IconButton(
                icon: const Icon(LucideIcons.arrowLeft, color: Colors.black87),
                onPressed: () => Navigator.pop(context),
                padding: EdgeInsets.zero,
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(color: Colors.grey[200]),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Loading ad title placeholder text here',
                    style: AppFont.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '2 days ago • 123 views',
                    style: AppFont.inter(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Rs. 99,999',
                    style: AppFont.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  Text(
                    'Description',
                    style: AppFont.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'This is a placeholder description that spans multiple lines to create a realistic skeleton shimmer effect for the ad detail screen loading state.',
                    style: AppFont.inter(fontSize: 14, height: 1.5),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Location',
                    style: AppFont.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.mapPin, size: 24),
                        const SizedBox(width: 12),
                        Text(
                          'Kathmandu, Nepal',
                          style: AppFont.inter(fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Fake seller card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Row(
                      children: [
                        const CircleAvatar(
                          radius: 24,
                          backgroundColor: Colors.grey,
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Seller Name',
                              style: AppFont.inter(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Member since 2024',
                              style: AppFont.inter(fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.alertCircle, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              _error ?? l('somethingWentWrong', context.locale.languageCode),
              style: AppFont.inter(fontSize: 16, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchAdDetails,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
              ),
              child: Text(
                l('retry', context.locale.languageCode),
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Owner-only: confirm (with warning for live ads) then open the edit form.
  /// Open the search tab filtered to one level of this ad's location chain
  /// (province/district/area) — all ads there, no category filter.
  void _browseLocation(AdLocationLevel level) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MainNavScreen(
          initialLocationId: level.id,
          initialLocationName: level.localizedName(context.locale.languageCode),
        ),
      ),
    );
  }

  /// Open the search tab filtered to this ad's category (or subcategory),
  /// same destination as tapping a category icon on the home screen.
  void _browseCategory(AdWithDetails ad, {bool subcategory = false}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MainNavScreen(
          initialCategoryId: ad.categoryId,
          initialCategoryName: ad.localizedCategoryName(
            context.locale.languageCode,
          ),
          initialSubcategoryId: subcategory ? ad.subcategoryId : null,
        ),
      ),
    );
  }

  Future<void> _editAd(AdWithDetails ad) async {
    final proceed = await confirmAdEdit(context, adClient: _adClient, ad: ad);
    if (!proceed) return;
    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => CreateAdScreen(existingAd: ad)),
    );
    if (mounted) _fetchAdDetails();
  }

  Widget _buildContent() {
    final ad = _ad!;

    return Stack(
      children: [
        CustomScrollView(
          controller: _scrollController,
          slivers: [
            // 1. IMAGE GALLERY (Parallax)
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              backgroundColor: Colors.white,
              elevation: 0,
              leading: Container(
                margin: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                ),
                child: IconButton(
                  icon: const Icon(
                    LucideIcons.arrowLeft,
                    color: Colors.black87,
                  ),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                ),
              ),
              actions: const [],
              flexibleSpace: FlexibleSpaceBar(
                background: AdImageGallery(
                  ad: ad,
                  isFavorite: _isFavorite,
                  isFavoriteLoading: _isFavoriteLoading,
                  onToggleFavorite: _toggleFavorite,
                  onShare: () {
                    final url = 'https://thulobazaar.com.np/en/ad/${ad.slug}';
                    _shareAd(
                      text: '${ad.title} - ${_formatPrice(ad.price)}\n$url',
                      subject: ad.title,
                    );
                  },
                ),
                collapseMode: CollapseMode.parallax,
              ),
            ),

            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 2. TITLE & META
                        Text(
                          ad.title,
                          style: AppFont.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${localizedTimeAgo(ad.publishedAt, context.locale.languageCode)} • ${ad.viewCount} ${l('views', context.locale.languageCode)}',
                          style: AppFont.inter(
                            fontSize: 12,
                            color: const Color(0xFF6B7280),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // 3. PRICE + owner-only edit shortcut (far right)
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                _formatPrice(ad.price),
                                style: AppFont.inter(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF10B981),
                                ),
                              ),
                            ),
                            if (context.read<AuthProvider>().userId != null &&
                                context.read<AuthProvider>().userId ==
                                    ad.userId)
                              OutlinedButton.icon(
                                onPressed: () => _editAd(ad),
                                icon: const Icon(LucideIcons.edit, size: 16),
                                label: Text(
                                  context.locale.languageCode == 'ne'
                                      ? 'सम्पादन'
                                      : 'Edit',
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF4338CA),
                                  backgroundColor: const Color(0xFFEEF2FF),
                                  side: const BorderSide(
                                    color: Color(0xFFC7D2FE),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 8,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  textStyle: AppFont.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // 4. BADGES ROW
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            if (ad.condition != null &&
                                ad.condition!.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color:
                                      ad.condition!.toLowerCase() == 'brand new'
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFF3B82F6),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  context.locale.languageCode == 'ne'
                                      ? (ad.condition!.toLowerCase() ==
                                                'brand new'
                                            ? 'नयाँ'
                                            : 'पुरानो')
                                      : ad.condition!,
                                  style: AppFont.inter(
                                    fontSize: 12,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            if (ad.isNegotiable ||
                                ad.attributes?['isNegotiable'] == true)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF59E0B),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  context.locale.languageCode == 'ne'
                                      ? 'मोलमोलाई योग्य'
                                      : 'Negotiable',
                                  style: AppFont.inter(
                                    fontSize: 12,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            // Deeper orange than Negotiable so COD reads as the
                            // stronger buying signal without leaving the family.
                            if (ad.attributes?['isCodAvailable'] == true)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEA580C),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  context.locale.languageCode == 'ne'
                                      ? 'डेलिभरीमा नगद भुक्तानी'
                                      : 'Cash on Delivery',
                                  style: AppFont.inter(
                                    fontSize: 12,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            // Promotion badges
                            ..._buildPromotionBadges(ad),
                          ],
                        ),
                        if (ad.categoryName.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          // Tappable breadcrumb: category → all ads in it,
                          // subcategory → all ads in the subcategory.
                          Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              GestureDetector(
                                onTap: () => _browseCategory(ad),
                                child: Text(
                                  ad.localizedCategoryName(
                                    context.locale.languageCode,
                                  ),
                                  style: AppFont.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF10B981),
                                    decoration: TextDecoration.underline,
                                    decorationColor: const Color(0xFF10B981),
                                  ),
                                ),
                              ),
                              if (ad.localizedSubcategoryName(
                                    context.locale.languageCode,
                                  ) !=
                                  null) ...[
                                Text(
                                  ' > ',
                                  style: AppFont.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF10B981),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () =>
                                      _browseCategory(ad, subcategory: true),
                                  child: Text(
                                    ad.localizedSubcategoryName(
                                          context.locale.languageCode,
                                        ) ??
                                        '',
                                    style: AppFont.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF10B981),
                                      decoration: TextDecoration.underline,
                                      decorationColor: const Color(0xFF10B981),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),

                  const Divider(height: 1, color: Color(0xFFE5E7EB)),

                  // 5. DESCRIPTION
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l('description', context.locale.languageCode),
                          style: AppFont.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          ad.description,
                          style: AppFont.inter(
                            fontSize: 14,
                            color: const Color(0xFF4B5563),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 6. SPECIFICATIONS (Dynamic)
                  AdSpecifications(ad: ad),

                  // 7. LOCATION
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l('location', context.locale.languageCode),
                          style: AppFont.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                LucideIcons.mapPin,
                                color: Color(0xFFEF4444),
                                size: 24,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Tappable per level: area/district/province
                                    // each opens its own ads listing.
                                    if (ad.locationLevels.isNotEmpty)
                                      Wrap(
                                        children: [
                                          for (
                                            var i = 0;
                                            i < ad.locationLevels.length;
                                            i++
                                          ) ...[
                                            if (i > 0)
                                              Text(
                                                ', ',
                                                style: AppFont.inter(
                                                  fontSize: 14,
                                                  color: const Color(
                                                    0xFF374151,
                                                  ),
                                                ),
                                              ),
                                            GestureDetector(
                                              onTap: () => _browseLocation(
                                                ad.locationLevels[i],
                                              ),
                                              child: Text(
                                                ad.locationLevels[i]
                                                    .localizedName(
                                                      context
                                                          .locale
                                                          .languageCode,
                                                    ),
                                                style: AppFont.inter(
                                                  fontSize: 14,
                                                  color: const Color(
                                                    0xFF374151,
                                                  ),
                                                  fontWeight: FontWeight.w500,
                                                  decoration:
                                                      TextDecoration.underline,
                                                  decorationColor: const Color(
                                                    0xFF9CA3AF,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      )
                                    else
                                      Text(
                                        ad.localizedLocationName(
                                          context.locale.languageCode,
                                        ),
                                        style: AppFont.inter(
                                          fontSize: 14,
                                          color: const Color(0xFF374151),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    if (ad.locationType != null &&
                                        ad.locationType!.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Text(
                                          ad.locationType!
                                                  .replaceAll('_', ' ')
                                                  .substring(0, 1)
                                                  .toUpperCase() +
                                              ad.locationType!
                                                  .replaceAll('_', ' ')
                                                  .substring(1),
                                          style: AppFont.inter(
                                            fontSize: 12,
                                            color: const Color(0xFF6B7280),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 7.5 SAFETY TIPS (below location)
                  const SafetyTipsCard(),

                  // 8. PROMOTE THIS AD
                  _buildBoostButton(ad),

                  // 8.5. SELLER INFORMATION CARD
                  SellerCard(ad: ad),

                  // 9. REPORT LINK (hidden for ad owner)
                  Builder(
                    builder: (context) {
                      final isOwner =
                          context.read<AuthProvider>().userId == ad.userId;
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: Opacity(
                          opacity: isOwner ? 0.4 : 1.0,
                          child: GestureDetector(
                            onTap: isOwner
                                ? null
                                : () => showReportAdSheet(
                                    context,
                                    adId: ad.id,
                                    adTitle: ad.title,
                                  ),
                            child: Row(
                              children: [
                                Icon(
                                  LucideIcons.flag,
                                  color: isOwner
                                      ? const Color(0xFF9CA3AF)
                                      : const Color(0xFFEF4444),
                                  size: 16,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'report.reportThisAd'.tr(),
                                  style: AppFont.inter(
                                    color: const Color(0xFF9CA3AF),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  // 10. RELATED ADS
                  if (_relatedAds.isNotEmpty) _buildRelatedAds(),

                  // 13. AD BANNER
                  if (AdService.adsEnabled)
                    AdBannerWidget(adUnitId: AdService.adDetailBannerId),

                  // 14. BOTTOM PADDING
                  const SizedBox(height: 120),
                ],
              ),
            ),
          ],
        ),

        // FLOATING BOTTOM CONTACT BAR
        AnimatedPositioned(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          left: 0,
          right: 0,
          bottom: _isContactBarVisible ? 0 : -100,
          child: FloatingContactBar(ad: ad),
        ),
      ],
    );
  }

  Widget _buildBoostButton(AdWithDetails ad) {
    final thumbnail = ad.images.isNotEmpty
        ? ApiConfig.getAdImageUrl(ad.images.first)
        : null;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () {
              final auth = context.read<AuthProvider>();
              if (!auth.isLoggedIn) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => SignInScreen(
                      onSuccess: () {
                        if (mounted) Navigator.pop(context);
                      },
                    ),
                  ),
                );
                return;
              }
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PromoteAdScreen(
                    adId: ad.id,
                    adTitle: ad.title,
                    adThumbnail: thumbnail,
                  ),
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  const Icon(LucideIcons.rocket, color: Colors.white, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          context.locale.languageCode == 'ne'
                              ? 'यो विज्ञापन प्रवर्द्धन गर्नुहोस्'
                              : 'Promote this Ad',
                          style: AppFont.inter(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          context.locale.languageCode == 'ne'
                              ? 'प्रवर्द्धनसँग दृश्यता बढाउनुहोस्'
                              : 'Increase visibility with promotions',
                          style: AppFont.inter(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    LucideIcons.chevronRight,
                    color: Colors.white70,
                    size: 16,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRelatedAds() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            context.locale.languageCode == 'ne'
                ? 'सम्बन्धित विज्ञापनहरू'
                : "Related Ads",
            style: AppFont.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1F2937),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 280, // Height for AdCard
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: _relatedAds.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              return SizedBox(
                width: 180,
                child: AdCard(ad: _relatedAds[index], heroTagPrefix: 'related'),
              );
            },
          ),
        ),
      ],
    );
  }

  List<Widget> _buildPromotionBadges(AdWithDetails ad) {
    final now = DateTime.now();
    bool isActive(bool flag, DateTime? until) =>
        flag && (until == null || now.isBefore(until));

    final badges = <Widget>[];

    if (isActive(ad.isUrgent, ad.urgentUntil)) {
      badges.add(
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.zap, color: Colors.white, size: 12),
              const SizedBox(width: 4),
              Text(
                context.locale.languageCode == 'ne' ? 'अत्यावश्यक' : 'URGENT',
                style: AppFont.inter(
                  fontSize: 12,
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (isActive(ad.isFeatured, ad.featuredUntil)) {
      badges.add(
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.star, color: Colors.white, size: 12),
              const SizedBox(width: 4),
              Text(
                context.locale.languageCode == 'ne' ? 'विशेष' : 'FEATURED',
                style: AppFont.inter(
                  fontSize: 12,
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (isActive(ad.isSticky, ad.stickyUntil)) {
      badges.add(
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.pin, color: Colors.white, size: 12),
              const SizedBox(width: 4),
              Text(
                context.locale.languageCode == 'ne' ? 'स्टिकी' : 'STICKY',
                style: AppFont.inter(
                  fontSize: 12,
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return badges;
  }

  // Banners extracted to widgets/ad_detail_banners.dart

  // Contact Bar logic extracted to widgets/floating_contact_bar.dart
  String _formatPrice(double price) =>
      formatLocalizedPrice(price, context.locale.languageCode);

  /// Open the native share sheet.
  ///
  /// iOS goes through a native channel because share_plus locates the host
  /// view controller via `keyWindow`, which is nil under this app's UIScene /
  /// implicit-engine lifecycle — so its share sheet silently never presents.
  /// Android keeps using share_plus, which works there.
  Future<void> _shareAd({required String text, required String subject}) async {
    try {
      if (Platform.isIOS) {
        await _iosShareChannel.invokeMethod('share', {
          'text': text,
          'subject': subject,
        });
      } else {
        await Share.share(text, subject: subject);
      }
    } catch (e) {
      if (kDebugMode) {
        developer.log('Share failed: $e', name: 'AdDetailScreen');
      }
    }
  }
}
