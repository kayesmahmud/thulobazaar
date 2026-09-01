import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import '../../core/theme/app_theme.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:mobile/core/widgets/main_app_bar.dart';
import 'package:mobile/core/widgets/main_drawer.dart';
import 'package:mobile/core/widgets/ad_card.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/data/mock_filter_data.dart';
import 'package:mobile/core/widgets/ad_banner_widget.dart';
import 'package:mobile/core/services/ad_service.dart';
import 'package:mobile/core/widgets/staggered_fade_in.dart';
import 'package:mobile/core/widgets/tap_scale.dart';
import 'package:mobile/core/widgets/search_suggestions_overlay.dart';
import 'package:mobile/core/services/notification_service.dart';
import 'package:mobile/core/services/search_history_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:mobile/core/utils/skeleton_data.dart';
import 'package:mobile/core/widgets/load_error_view.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class HomeScreen extends StatefulWidget {
  final void Function(String query)? onSearch;
  final void Function(int categoryId, String categoryName)? onCategoryTap;
  final VoidCallback? onViewAllAds;

  /// Flipped to true when the server has a newer ad than the feed is showing;
  /// the nav shell listens to it to show a dot on the Home tab icon.
  final ValueNotifier<bool>? newAdsNotifier;

  const HomeScreen({
    super.key,
    this.onSearch,
    this.onCategoryTap,
    this.onViewAllAds,
    this.newAdsNotifier,
  });

  @override
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  // First page keeps the original dense 60-ad grid; further pages append via
  // infinite scroll (same pattern as SearchScreen).
  static const int _latestPageSize = 60;

  // How often to quietly ask the server whether a newer ad has arrived
  // (drives the dot on the Home tab icon). Runs only while foregrounded.
  static const Duration _newAdCheckInterval = Duration(minutes: 3);

  final AdClient _adClient = AdClient();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ScrollController _categoryScrollController = ScrollController();
  bool _categoryCanScrollLeft = false;
  bool _categoryCanScrollRight = false;
  // Which half the row is showing — drives the active dot.
  int _categoryPage = 0;
  // Fires exactly once, then never again for this screen.
  Timer? _categoryNudgeTimer;
  bool _categoryNudged = false;
  // Set the moment the user touches the row; retires the pending nudge.
  bool _categoryUserTook = false;
  // True only while WE animate, so the nudge isn't mistaken for user input.
  bool _categoryAutoScrolling = false;
  Timer? _newAdCheckTimer;
  final FocusNode _searchFocusNode = FocusNode();
  final LayerLink _searchLayerLink = LayerLink();
  final SearchSuggestionsController _suggestionsController =
      SearchSuggestionsController();

  // State
  List<CategoryWithSubcategories> _categories = [];
  List<AdWithDetails> _featuredAds = [];
  List<AdWithDetails> _latestAds = [];
  // Pre-sliced lists to avoid .take().toList() in build
  List<AdWithDetails> _displayLatestAds = [];
  List<AdWithDetails> _displayFeaturedAds = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  int _latestPage = 1;
  int _latestTotalPages = 1;
  // Monotonic id for the latest fetch. A response only applies if its id still
  // matches, so a stale in-flight request can't overwrite newer results.
  int _fetchSeq = 0;
  // Set when the initial fetch fails, so we can show a retry state instead of
  // the misleading "No ads yet" empty message.
  bool _loadFailed = false;
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchData();
    _scrollController.addListener(_onScroll);
    _searchFocusNode.addListener(_onSearchFocusChanged);
    _startNewAdChecks();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _searchFocusNode.removeListener(_onSearchFocusChanged);
    _searchFocusNode.dispose();
    _suggestionsController.hide();
    _searchController.dispose();
    _scrollController.dispose();
    _categoryScrollController.dispose();
    _categoryNudgeTimer?.cancel();
    _newAdCheckTimer?.cancel();
    super.dispose();
  }

  // Pause the new-ad polling while the app is backgrounded; on return, check
  // immediately (the user may have been away for a while) and resume the timer.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkForNewAds();
      _startNewAdChecks();
    } else if (state == AppLifecycleState.paused) {
      _newAdCheckTimer?.cancel();
    }
  }

  void _startNewAdChecks() {
    _newAdCheckTimer?.cancel();
    _newAdCheckTimer = Timer.periodic(
      _newAdCheckInterval,
      (_) => _checkForNewAds(),
    );
  }

  /// Best-effort check for ads newer than the top of the loaded feed.
  /// Fetches a single ad, so it stays cheap enough to poll.
  Future<void> _checkForNewAds() async {
    final notifier = widget.newAdsNotifier;
    if (notifier == null || notifier.value) return;
    if (_isLoading || _latestAds.isEmpty) return;

    try {
      final response = await _adClient.getLatestAds(page: 1, limit: 1);
      if (!mounted || !response.success || response.data.isEmpty) return;
      if (response.data.first.id != _latestAds.first.id) {
        notifier.value = true;
      }
    } catch (_) {
      // The dot is a hint, not critical state — the next tick will retry.
    }
  }

  /// Called by the nav shell when the Home tab is re-tapped: glide back to
  /// the top of the feed, then reload it so the newest ads are visible.
  Future<void> scrollToTopAndRefresh() async {
    if (_scrollController.hasClients && _scrollController.offset > 0) {
      await _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    }
    await _fetchData();
    HapticFeedback.mediumImpact();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreLatestAds();
    }
  }

  void _onSearchFocusChanged() {
    if (_searchFocusNode.hasFocus) {
      _suggestionsController.show(
        context: context,
        layerLink: _searchLayerLink,
        width: MediaQuery.of(context).size.width - 32,
        textController: _searchController,
        onSearch: _submitSearch,
      );
    } else {
      _suggestionsController.hide();
    }
  }

  void _submitSearch() {
    _suggestionsController.hide();
    _searchFocusNode.unfocus();
    final query = _searchController.text.trim();
    if (query.isNotEmpty) {
      SearchHistoryService.addSearch(query);
      // First search = moment of intent — safe spot for the one-shot
      // notification permission prompt (no-op once requested).
      unawaited(NotificationService().requestPermissionsIfNeeded());
      widget.onSearch?.call(query);
    }
  }

  Future<void> _fetchData() async {
    // Claim the latest sequence id; any older in-flight fetch (including a
    // pending load-more) is now stale.
    final int reqId = ++_fetchSeq;

    setState(() {
      _isLoading = true;
      _loadFailed = false;
      _latestPage = 1;
    });

    try {
      // Fetch all data in parallel
      final results = await Future.wait([
        _adClient.getCategories(),
        _adClient.getFeaturedAds(limit: 12),
        _adClient.getLatestAds(page: 1, limit: _latestPageSize),
      ]);

      if (reqId != _fetchSeq || !mounted) return;

      final featuredResp = results[1] as PaginatedResponse<AdWithDetails>;
      final latestResp = results[2] as PaginatedResponse<AdWithDetails>;

      // The ad endpoints don't throw on network failure — they return a
      // response with success == false. If both ad feeds failed, treat it as a
      // load failure so we show the offline/error state instead of an empty
      // "No ads yet".
      if (!latestResp.success && !featuredResp.success) {
        final offline = await _isOfflineError();
        if (reqId != _fetchSeq || !mounted) return;
        setState(() {
          _loadFailed = true;
          _isOffline = offline;
          _isLoading = false;
        });
        return;
      }

      setState(() {
        _categories = results[0] as List<CategoryWithSubcategories>;
        _featuredAds = featuredResp.data;
        _latestAds = latestResp.data;
        _latestTotalPages = latestResp.pagination.totalPages;
        // Featured ads already get their own carousel above, so keep them out
        // of the Latest feed to avoid showing the same ad twice.
        _displayLatestAds = _latestAds.where((ad) => !ad.isFeatured).toList();
        // Up to 6 rows of 2 = 12 cards; the grid shrinks to the real count
        // (2 ads -> 1 row, 4 ads -> 2 rows, ...).
        _displayFeaturedAds = _featuredAds.take(12).toList();
        _isLoading = false;
      });
      // The feed now shows the newest ads, so retire the Home-tab dot.
      widget.newAdsNotifier?.value = false;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _updateCategoryScrollEdges();
        _nudgeCategoryRowOnce();
      });
    } catch (e) {
      final offline = await _isOfflineError();
      if (reqId != _fetchSeq || !mounted) return;
      setState(() {
        _isLoading = false;
        _loadFailed = true;
        _isOffline = offline;
      });
    }
  }

  /// Append the next page of the full catalog to the Latest feed when the
  /// user scrolls near the bottom (same pattern as SearchScreen).
  Future<void> _loadMoreLatestAds() async {
    if (_isLoading || _isLoadingMore || _latestPage >= _latestTotalPages) {
      return;
    }

    // Tie this page to the current fetch generation; if a refresh happens
    // mid-load we must not append a page from the previous feed.
    final int reqId = _fetchSeq;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final response = await _adClient.getLatestAds(
        page: _latestPage + 1,
        limit: _latestPageSize,
      );

      if (!mounted) return;
      if (reqId != _fetchSeq) {
        // A refresh superseded us — discard this page.
        setState(() => _isLoadingMore = false);
        return;
      }

      if (response.success) {
        setState(() {
          _latestAds.addAll(response.data);
          _displayLatestAds = _latestAds.where((ad) => !ad.isFeatured).toList();
          _latestPage++;
          _isLoadingMore = false;
        });
      } else {
        setState(() {
          _isLoadingMore = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingMore = false;
      });
    }
  }

  /// Decide whether a failed fetch was caused by the device being offline
  /// (vs. the server being unreachable for some other reason). This drives
  /// which message + icon the [LoadErrorView] shows.
  ///
  /// We check the device's connectivity rather than always assuming "offline":
  /// the device is offline only when every connectivity result is `none`. If
  /// the check itself fails for any reason, we fall back to the generic error.
  Future<bool> _isOfflineError() async {
    try {
      final results = await Connectivity().checkConnectivity();
      return results.every((r) => r == ConnectivityResult.none);
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MainAppBar(),
      drawer: const MainDrawer(),
      body: RefreshIndicator(
        onRefresh: () async {
          await _fetchData();
          HapticFeedback.mediumImpact();
        },
        color: const Color(0xFF10B981),
        child: _loadFailed && !_isLoading
            ? _buildErrorState()
            : Skeletonizer(
                enabled: _isLoading,
                child: CustomScrollView(
                  controller: _scrollController,
                  slivers: [
                    SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeroSection(context),

                          const SizedBox(height: 24),
                          _buildSectionHeader('home.browseCategories'.tr(), ""),
                          const SizedBox(height: 12),
                          _buildCategoriesList(),

                          // Featured ads first — small highlight strip
                          const SizedBox(height: 24),
                          _buildFeaturedHeader(),
                          const SizedBox(height: 12),
                          _buildFeaturedAdsGrid(
                            _isLoading
                                ? SkeletonData.fakeAds(6)
                                : _displayFeaturedAds,
                          ),

                          if (!_isLoading && AdService.adsEnabled)
                            AdBannerWidget(adUnitId: AdService.homeBannerTopId),

                          // Latest/newest feed below
                          const SizedBox(height: 24),
                          _buildSectionHeader(
                            'home.latestAds'.tr(),
                            'home.viewAllAds'.tr(),
                            onTap: widget.onViewAllAds,
                          ),
                          const SizedBox(height: 12),
                        ],
                      ),
                    ),

                    // Full catalog as a lazy SliverGrid: off-screen cards (and their
                    // network images) aren't built until scrolled near the viewport;
                    // more pages append as the user nears the bottom.
                    _buildLatestSliverGrid(
                      _isLoading ? SkeletonData.fakeAds(6) : _displayLatestAds,
                    ),

                    if (_isLoadingMore)
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Center(
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                              ),
                            ),
                          ),
                        ),
                      ),

                    const SliverToBoxAdapter(child: SizedBox(height: 50)),
                  ],
                ),
              ),
      ),
    );
  }

  /// Full-screen failure state. Wrapped in a scrollable that fills the
  /// viewport so RefreshIndicator's pull-to-refresh keeps working here.
  Widget _buildErrorState() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: LoadErrorView(isOffline: _isOffline, onRetry: _fetchData),
          ),
        );
      },
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF6366f1), Color(0xFFA855F7), Color(0xFFEC4899)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'home.heroTitle'.tr(),
            style: AppFont.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          // Search Bar
          CompositedTransformTarget(
            link: _searchLayerLink,
            child: TextField(
              controller: _searchController,
              focusNode: _searchFocusNode,
              onSubmitted: (_) => _submitSearch(),
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                hintText: 'home.searchPlaceholder'.tr(),
                hintStyle: AppFont.inter(fontSize: 14, color: Colors.grey),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 0,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                suffixIcon: GestureDetector(
                  onTap: _submitSearch,
                  child: Container(
                    margin: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      LucideIcons.search,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
    String title,
    String actionText, {
    VoidCallback? onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: AppFont.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textDark,
            ),
          ),
          if (actionText.isNotEmpty)
            GestureDetector(
              onTap: onTap,
              child: Text(
                actionText,
                style: AppFont.inter(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCategoriesList() {
    // When API categories are loaded, use them as source of truth
    // This guarantees every tap has a valid category ID
    if (_categories.isNotEmpty) {
      final items = _categories.map((apiCat) {
        final localizedName = apiCat.localizedName(context.locale.languageCode);
        final mockMatch = _findMockCategory(apiCat.slug, apiCat.name);
        final icon = mockMatch?['icon'] as String? ?? apiCat.icon ?? '📁';
        final shortName = context.locale.languageCode == 'ne'
            ? localizedName
            : (mockMatch?['shortName'] as String? ?? localizedName);
        return _buildApiCategoryItem(
          apiCat.slug,
          icon,
          shortName,
          apiCat.id,
          localizedName,
        );
      }).toList();
      return _buildTwoRowCategoryCarousel(items);
    }

    // Fallback: show hardcoded categories while loading (taps disabled)
    final items = MockFilterData.categories
        .map(
          (cat) => _buildStaticEmojiCategoryItem(
            cat['slug'] as String?,
            cat['icon'] as String,
            (cat['shortName'] ?? cat['name']) as String,
          ),
        )
        .toList();
    return _buildTwoRowCategoryCarousel(items);
  }

  /// Arrange category items into two rows that scroll horizontally together,
  /// so each column pairs a top and bottom icon (Bikroy-style).
  Widget _buildTwoRowCategoryCarousel(List<Widget> items) {
    final half = (items.length / 2).ceil();
    final topRow = items.sublist(0, half);
    final bottomRow = items.sublist(half);
    final content = SingleChildScrollView(
      controller: _categoryScrollController,
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(left: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top-align items so a 2-line label (e.g. "Home & Living") doesn't
          // center its column and push the icon out of line with its neighbours.
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: topRow),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: bottomRow,
          ),
        ],
      ),
    );

    // Scroll notifications only keep the arrows' can-scroll state current.
    // Nothing repeats on its own, so the screen is idle at 0% CPU at rest.
    return Column(
      children: [
        Listener(
          // Only POINTER events count as the user taking over. Scroll
          // notifications don't, because the one-time nudge emits those too and
          // would otherwise cancel itself on its own first frame.
          onPointerDown: (_) => _onCategoryUserInteraction(),
          onPointerMove: (_) => _onCategoryUserInteraction(),
          onPointerUp: (_) => _onCategoryUserInteraction(),
          onPointerCancel: (_) => _onCategoryUserInteraction(),
          child: NotificationListener<ScrollNotification>(
            onNotification: (_) {
              _updateCategoryScrollEdges();
              return false;
            },
            child: Stack(
              alignment: Alignment.center,
              children: [
                content,
                _buildCategoryArrowButton(isLeft: true),
                _buildCategoryArrowButton(isLeft: false),
              ],
            ),
          ),
        ),
        _buildCategoryDots(),
      ],
    );
  }

  /// Two page dots under the row — the permanent "there's a second half" cue.
  /// Free at rest: two small boxes that repaint only when the scroll position
  /// crosses the halfway point.
  Widget _buildCategoryDots() {
    final scrollable = _categoryCanScrollLeft || _categoryCanScrollRight;
    if (!scrollable) return const SizedBox(height: 12);
    return Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(2, (i) {
          final active = i == _categoryPage;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: active ? 18 : 6,
            height: 6,
            decoration: BoxDecoration(
              color: active ? AppTheme.primary : Colors.grey[300],
              borderRadius: BorderRadius.circular(3),
            ),
          );
        }),
      ),
    );
  }

  /// The user grabbed the row — cancel the pending nudge so we never move the
  /// content under a finger that's already reaching for a category.
  void _onCategoryUserInteraction() {
    if (!_categoryAutoScrolling && !_categoryUserTook) {
      _categoryUserTook = true;
      _categoryNudgeTimer?.cancel();
    }
    _updateCategoryScrollEdges();
  }

  /// ONE nudge shortly after the categories land: the row slides right far
  /// enough to expose the next tile, then springs back to the start. It teaches
  /// the gesture once and then the screen goes completely idle — unlike a
  /// repeating timer, which wakes the device every few seconds forever even
  /// with the phone face-down. Returning to 0 also means it can never leave the
  /// user looking at a different set of categories than they reached for.
  void _nudgeCategoryRowOnce() {
    if (_categoryNudged || _categoryUserTook) return;
    if (!mounted || MediaQuery.of(context).disableAnimations) return;
    _categoryNudged = true;
    _categoryNudgeTimer = Timer(const Duration(milliseconds: 900), () async {
      if (!mounted || _categoryUserTook) return;
      if (!_categoryScrollController.hasClients) return;
      final max = _categoryScrollController.position.maxScrollExtent;
      if (max <= 0) return;
      _categoryAutoScrolling = true;
      try {
        // Travel the FULL width once, so the hidden categories are actually
        // seen rather than merely hinted at. A short 64px twitch was firing
        // correctly but read as a glitch, not as "there is more over here".
        await _categoryScrollController.animateTo(
          max,
          duration: const Duration(milliseconds: 650),
          curve: Curves.easeInOut,
        );
        // Hold long enough to actually read the second half.
        await Future<void>.delayed(const Duration(milliseconds: 800));
        if (!mounted || _categoryUserTook) return;
        if (!_categoryScrollController.hasClients) return;
        await _categoryScrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 550),
          curve: Curves.easeInOut,
        );
      } finally {
        _categoryAutoScrolling = false;
      }
    });
  }

  /// Translucent round scroll arrow. Shown WHENEVER there is more to see on
  /// that side — not gated behind a touch, which was the old behaviour and made
  /// the hint appear only after the user already knew to scroll. Being a plain
  /// widget, it costs nothing at rest: no timer, no animation, 0% idle CPU.
  Widget _buildCategoryArrowButton({required bool isLeft}) {
    final canScroll = isLeft ? _categoryCanScrollLeft : _categoryCanScrollRight;
    final visible = canScroll;
    return Positioned(
      left: isLeft ? 4 : null,
      right: isLeft ? null : 4,
      child: IgnorePointer(
        ignoring: !visible,
        child: AnimatedOpacity(
          opacity: visible ? 1 : 0,
          duration: const Duration(milliseconds: 200),
          child: GestureDetector(
            onTap: () => _scrollCategoryRow(isLeft: isLeft),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.black.withValues(alpha: 0.35),
              ),
              child: Icon(
                isLeft ? Icons.chevron_left : Icons.chevron_right,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _updateCategoryScrollEdges() {
    if (!_categoryScrollController.hasClients) return;
    final position = _categoryScrollController.position;
    final canLeft = position.pixels > 4;
    final canRight = position.pixels < position.maxScrollExtent - 4;
    final page =
        position.maxScrollExtent > 0 &&
            position.pixels > position.maxScrollExtent / 2
        ? 1
        : 0;
    if (canLeft != _categoryCanScrollLeft ||
        canRight != _categoryCanScrollRight ||
        page != _categoryPage) {
      setState(() {
        _categoryCanScrollLeft = canLeft;
        _categoryCanScrollRight = canRight;
        _categoryPage = page;
      });
    }
  }

  void _scrollCategoryRow({required bool isLeft}) {
    if (!_categoryScrollController.hasClients) return;
    const jump = 160.0;
    final target = (_categoryScrollController.offset + (isLeft ? -jump : jump))
        .clamp(0.0, _categoryScrollController.position.maxScrollExtent);
    _categoryScrollController.animateTo(
      target,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
    _updateCategoryScrollEdges();
  }

  /// Find matching hardcoded category by slug or name for icon/shortName lookup
  Map<String, dynamic>? _findMockCategory(String slug, String name) {
    final normalizedSlug = slug.toLowerCase();
    final normalizedName = name.toLowerCase();
    for (final mock in MockFilterData.categories) {
      final mockSlug = (mock['slug'] as String).toLowerCase();
      final mockName = (mock['name'] as String).toLowerCase();
      if (mockSlug == normalizedSlug || mockName == normalizedName) {
        return mock;
      }
    }
    return null;
  }

  /// Custom category icon (single source of truth in assets/category-icons),
  /// falling back to the emoji if the image is missing.
  Widget _categoryIcon(String? slug, String emoji) {
    if (slug == null || slug.isEmpty) {
      return Text(emoji, style: const TextStyle(fontSize: 35));
    }
    // Icon is 10% larger than the box padding implies; the tile keeps its
    // 66px size because the surrounding padding shrinks to match (12 -> 10).
    return Image.asset(
      'assets/category-icons/$slug.png',
      width: 46,
      height: 46,
      fit: BoxFit.contain,
      cacheWidth: 184,
      cacheHeight: 184,
      errorBuilder: (_, _, _) =>
          Text(emoji, style: const TextStyle(fontSize: 35)),
    );
  }

  Widget _buildStaticCategoryItem(IconData icon, String label) {
    bool isProperty = label == "Property";
    return Container(
      margin: const EdgeInsets.only(right: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isProperty ? const Color(0xFFF43F5E) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Icon(
              icon,
              size: 24,
              color: isProperty ? Colors.white : AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: AppFont.inter(fontSize: 12, color: AppTheme.textDark),
          ),
        ],
      ),
    );
  }

  /// Category item backed by API data — tap always works
  Widget _buildApiCategoryItem(
    String? slug,
    String emoji,
    String name,
    int categoryId,
    String categoryName,
  ) {
    return Container(
      margin: const EdgeInsets.only(right: 16),
      child: TapScale(
        onTap: () {
          widget.onCategoryTap?.call(categoryId, categoryName);
        },
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(14),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1A0F172A),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: _categoryIcon(slug, emoji),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 70,
              // Reserve 2 lines so 1- and 2-line labels keep every item the
              // same height — otherwise short labels get vertically centered
              // and their icons drift out of line with the rest of the row.
              height: 30,
              child: Text(
                name,
                style: AppFont.inter(
                  fontSize: 11,
                  height: 1.3,
                  color: AppTheme.textDark,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Fallback category item shown while loading (no tap action)
  Widget _buildStaticEmojiCategoryItem(
    String? slug,
    String emoji,
    String name,
  ) {
    return Container(
      margin: const EdgeInsets.only(right: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(14),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x1A0F172A),
                  blurRadius: 8,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: _categoryIcon(slug, emoji),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 70,
            // Reserve 2 lines so every item stays the same height (see
            // _buildApiCategoryItem) and icons line up across the row.
            height: 30,
            child: Text(
              name,
              style: AppFont.inter(
                fontSize: 11,
                height: 1.3,
                color: AppTheme.textDark,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(CategoryWithSubcategories category) {
    return Container(
      margin: const EdgeInsets.only(right: 16),
      child: GestureDetector(
        onTap: () {
          // TODO: Navigate to browse with category filter
        },
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Text(
                category.icon ?? "📁",
                style: const TextStyle(fontSize: 24),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 60,
              child: Text(
                category.localizedName(context.locale.languageCode),
                style: AppFont.inter(fontSize: 11, color: AppTheme.textDark),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLatestSliverGrid(List<AdWithDetails> ads) {
    if (ads.isEmpty) {
      return SliverToBoxAdapter(
        child: StaggeredFadeIn(
          index: 0,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Center(
              child: Text(
                'home.noAdsYet'.tr(),
                style: AppFont.inter(color: Colors.grey[500]),
              ),
            ),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.65,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
        ),
        delegate: SliverChildBuilderDelegate((context, index) {
          // Clamp the stagger index so the last of 60 cards doesn't wait
          // ~5s (delayPerItem * index); caps the cascade at ~0.5s.
          return StaggeredFadeIn(
            index: index.clamp(0, 6),
            child: RepaintBoundary(
              child: AdCard(ad: ads[index], heroTagPrefix: 'latest'),
            ),
          );
        }, childCount: ads.length),
      ),
    );
  }

  Widget _buildFeaturedHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.star, color: Colors.amber, size: 24),
              const SizedBox(width: 8),
              Text(
                'home.featuredAds'.tr(),
                style: AppFont.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'home.featuredSubtitle'.tr(),
            style: AppFont.inter(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedAdsGrid(List<AdWithDetails> ads) {
    if (ads.isEmpty) {
      return StaggeredFadeIn(
        index: 0,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Center(
            child: Text(
              'home.noFeaturedAds'.tr(),
              style: AppFont.inter(color: Colors.grey[500]),
            ),
          ),
        ),
      );
    }

    // 2-column grid that grows with the data: 2 ads -> 1 row, 4 -> 2 rows,
    // capped at 12 (6 rows) by the take(12) above. Non-scrollable; it sits in
    // the page's CustomScrollView between the featured header and Latest Ads.
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        children: ads
            .asMap()
            .entries
            .map(
              (entry) => StaggeredFadeIn(
                index: entry.key.clamp(0, 6),
                child: RepaintBoundary(
                  child: AdCard(ad: entry.value, heroTagPrefix: 'featured'),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}
