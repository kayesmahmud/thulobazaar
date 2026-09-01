import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/features/search/search_filter_modal.dart';
import 'package:mobile/core/widgets/main_app_bar.dart';
import 'package:mobile/core/widgets/main_drawer.dart';
import 'package:mobile/core/widgets/ad_card.dart';
import 'package:mobile/core/widgets/staggered_fade_in.dart';
import 'package:mobile/core/widgets/search_suggestions_overlay.dart';
import 'package:mobile/core/services/notification_service.dart';
import 'package:mobile/core/services/search_history_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:mobile/core/utils/skeleton_data.dart';
import 'package:mobile/core/widgets/load_error_view.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => SearchScreenState();
}

class SearchScreenState extends State<SearchScreen> {
  final AdClient _adClient = AdClient();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _searchFocusNode = FocusNode();
  final LayerLink _searchLayerLink = LayerLink();
  final SearchSuggestionsController _suggestionsController =
      SearchSuggestionsController();

  // State
  List<AdWithDetails> _ads = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasError = false;
  bool _isOffline = false;
  int _currentPage = 1;
  int _totalPages = 1;
  // Monotonic id for the latest fetch. A response only applies if its id still
  // matches, so a stale in-flight request can't overwrite newer results.
  int _fetchSeq = 0;

  // Filters
  SearchFilters _filters = SearchFilters();

  @override
  void initState() {
    super.initState();
    _fetchAds();
    _scrollController.addListener(_onScroll);
    _searchFocusNode.addListener(_onSearchFocusChanged);
  }

  @override
  void dispose() {
    _searchFocusNode.removeListener(_onSearchFocusChanged);
    _searchFocusNode.dispose();
    _suggestionsController.hide();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onSearchFocusChanged() {
    if (_searchFocusNode.hasFocus) {
      _suggestionsController.show(
        context: context,
        layerLink: _searchLayerLink,
        width: MediaQuery.of(context).size.width - 92,
        textController: _searchController,
        onSearch: _onSearch,
      );
    } else {
      _suggestionsController.hide();
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreAds();
    }
  }

  Future<void> _fetchAds({bool refresh = false}) async {
    // Claim the latest sequence id; any older in-flight fetch is now stale.
    final int reqId = ++_fetchSeq;

    if (refresh) {
      setState(() {
        _currentPage = 1;
        _ads = [];
      });
    }

    setState(() {
      _isLoading = _ads.isEmpty;
      _hasError = false;
    });

    try {
      final response = await _adClient.searchAds(
        _filters,
        page: _currentPage,
        limit: 20,
      );

      // A newer fetch started while we were awaiting — drop this result.
      if (reqId != _fetchSeq || !mounted) return;

      if (response.success) {
        setState(() {
          _ads = response.data;
          _totalPages = response.pagination?.totalPages ?? 1;
          _isLoading = false;
        });
      } else {
        // searchAds returns success == false on network failure too (it does
        // not throw), so classify offline vs server error here.
        final offline = await _isOfflineError();
        if (reqId != _fetchSeq || !mounted) return;
        setState(() {
          _hasError = true;
          _isOffline = offline;
          _isLoading = false;
        });
      }
    } catch (e) {
      // Request threw (no network, host unreachable, timeout) — classify it.
      final offline = await _isOfflineError();
      if (reqId != _fetchSeq || !mounted) return;
      setState(() {
        _hasError = true;
        _isOffline = offline;
        _isLoading = false;
      });
    }
  }

  /// Returns true when the device has no connectivity at all, so the error
  /// view can show "you're offline" rather than a generic message.
  Future<bool> _isOfflineError() async {
    try {
      final results = await Connectivity().checkConnectivity();
      return results.every((r) => r == ConnectivityResult.none);
    } catch (_) {
      return false;
    }
  }

  Future<void> _loadMoreAds() async {
    if (_isLoadingMore || _currentPage >= _totalPages) return;

    // Tie this page to the current filter set; if filters change mid-load we
    // must not append a page that belongs to the previous category/query.
    final int reqId = _fetchSeq;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final response = await _adClient.searchAds(
        _filters,
        page: _currentPage + 1,
        limit: 20,
      );

      if (!mounted) return;
      if (reqId != _fetchSeq) {
        // A refresh/filter change superseded us — discard this page.
        setState(() => _isLoadingMore = false);
        return;
      }

      if (response.success) {
        setState(() {
          _ads.addAll(response.data);
          _currentPage++;
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

  void _onSearch() {
    _suggestionsController.hide();
    _searchFocusNode.unfocus();
    final query = _searchController.text.trim();
    if (query.isNotEmpty) {
      SearchHistoryService.addSearch(query);
      // First search = moment of intent — safe spot for the one-shot
      // notification permission prompt (no-op once requested).
      unawaited(NotificationService().requestPermissionsIfNeeded());
    }
    setState(() {
      _filters = _filters.copyWith(query: query);
    });
    _fetchAds(refresh: true);
  }

  /// Called from HomeScreen search to trigger search with a query
  void searchFor(String query) {
    _searchController.text = query;
    _onSearch();
  }

  /// Called from HomeScreen category carousel to filter by category
  void filterByCategory(
    int categoryId,
    String categoryName, {
    int? subcategoryId,
  }) {
    _searchController.clear();
    _applyFilters(
      SearchFilters(
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        categoryName: categoryName,
      ),
    );
  }

  /// Called from ad detail location taps: all ads in a province/district/area
  /// (backend includes every child location automatically).
  void filterByLocation(int locationId, String locationName) {
    _searchController.clear();
    _applyFilters(
      SearchFilters(locationId: locationId, locationName: locationName),
    );
  }

  void _applyFilters(SearchFilters newFilters) {
    setState(() {
      _filters = newFilters;
    });
    _fetchAds(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: const MainAppBar(),
      drawer: const MainDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            // Sticky Header (Search & Filters)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.only(top: 16, bottom: 8),
              child: Column(
                children: [
                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Expanded(
                          child: CompositedTransformTarget(
                            link: _searchLayerLink,
                            child: SizedBox(
                              height: 48,
                              child: TextField(
                                controller: _searchController,
                                focusNode: _searchFocusNode,
                                onSubmitted: (_) => _onSearch(),
                                decoration: InputDecoration(
                                  hintText: context.locale.languageCode == 'ne'
                                      ? "केही पनि खोज्नुहोस्..."
                                      : "Search for anything...",
                                  hintStyle: AppFont.inter(
                                    color: Colors.grey[500],
                                  ),
                                  filled: true,
                                  fillColor: Colors.grey[100],
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 13,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: Colors.grey[300]!,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: Colors.grey[300]!,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: const BorderSide(
                                      color: Color(0xFF10B981),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          height: 48,
                          width: 48,
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: IconButton(
                            icon: const Icon(
                              LucideIcons.search,
                              color: Colors.white,
                            ),
                            onPressed: _onSearch,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Filter Chips (Horizontal Scroll)
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        _buildFilterChip(
                          context,
                          _filters.locationName ??
                              (context.locale.languageCode == 'ne'
                                  ? 'सम्पूर्ण नेपाल'
                                  : "All Nepal"),
                          icon: LucideIcons.mapPin,
                          openSection: "Locations",
                          isActive: _filters.locationId != null,
                        ),
                        _buildFilterChip(
                          context,
                          _filters.categoryName ??
                              (context.locale.languageCode == 'ne'
                                  ? 'वर्ग'
                                  : "Category"),
                          icon: LucideIcons.layoutGrid,
                          openSection: "Categories",
                          isActive: _filters.categoryId != null,
                        ),
                        _buildFilterChip(
                          context,
                          _filters.condition != null
                              ? (_filters.condition?.toLowerCase() ==
                                        'brand new'
                                    ? (context.locale.languageCode == 'ne'
                                          ? 'नयाँ'
                                          : 'Brand New')
                                    : (context.locale.languageCode == 'ne'
                                          ? 'पुरानो'
                                          : 'Used'))
                              : (context.locale.languageCode == 'ne'
                                    ? 'अवस्था'
                                    : "Condition"),
                          icon: LucideIcons.tag,
                          openSection: "Condition",
                          isActive: _filters.condition != null,
                        ),
                        _buildFilterChip(
                          context,
                          context.locale.languageCode == 'ne'
                              ? "क्रमबद्ध"
                              : "Sort by",
                          icon: LucideIcons.arrowUpDown,
                          openSection: "Sort By",
                          isActive: _filters.sortBy != null,
                        ),
                        InkWell(
                          onTap: () => _showFilterModal(context),
                          child: Container(
                            width: 36,
                            height: 36,
                            margin: const EdgeInsets.only(left: 8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.grey[300]!),
                            ),
                            child: Icon(
                              LucideIcons.slidersHorizontal,
                              size: 18,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),

            // Ad Grid or Loading/Error State
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      final fakeAds = SkeletonData.fakeAds(6);
      return Skeletonizer(
        enabled: true,
        child: GridView.builder(
          padding: EdgeInsets.fromLTRB(
            16,
            16,
            16,
            16 + MediaQuery.paddingOf(context).bottom,
          ),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.65,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
          ),
          itemCount: 6,
          itemBuilder: (context, index) =>
              AdCard(ad: fakeAds[index], heroTagPrefix: 'search-shimmer'),
        ),
      );
    }

    if (_hasError) {
      return StaggeredFadeIn(
        index: 0,
        child: LoadErrorView(
          isOffline: _isOffline,
          onRetry: () => _fetchAds(refresh: true),
        ),
      );
    }

    if (_ads.isEmpty) {
      return StaggeredFadeIn(
        index: 0,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.inbox, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(
                'No ads found',
                style: AppFont.inter(fontSize: 16, color: Colors.grey[600]),
              ),
              const SizedBox(height: 8),
              Text(
                'Try adjusting your filters',
                style: AppFont.inter(fontSize: 14, color: Colors.grey[500]),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await _fetchAds(refresh: true);
        HapticFeedback.mediumImpact();
      },
      color: const Color(0xFF10B981),
      child: GridView.builder(
        controller: _scrollController,
        cacheExtent: 500,
        padding: EdgeInsets.fromLTRB(
          16,
          16,
          16,
          16 + MediaQuery.paddingOf(context).bottom,
        ),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.65,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
        ),
        itemCount: _ads.length + (_isLoadingMore ? 2 : 0),
        itemBuilder: (context, index) {
          if (index >= _ads.length) {
            return const Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            );
          }

          final ad = _ads[index];
          return StaggeredFadeIn(
            index: index,
            child: RepaintBoundary(
              child: AdCard(ad: ad, heroTagPrefix: 'search'),
            ),
          );
        },
      ),
    );
  }

  void _showFilterModal(BuildContext context, {String? expandSection}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => SearchFilterModal(
          initialExpandedSection: expandSection,
          currentFilters: _filters,
          onApplyFilters: _applyFilters,
        ),
      ),
    );
  }

  Widget _buildFilterChip(
    BuildContext context,
    String label, {
    IconData? icon,
    String? openSection,
    bool isActive = false,
  }) {
    return InkWell(
      onTap: () => _showFilterModal(context, expandSection: openSection),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFECFDF5) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? const Color(0xFF10B981) : Colors.grey[300]!,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 16,
                color: isActive ? const Color(0xFF10B981) : Colors.grey[700],
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: AppFont.inter(
                fontSize: 13,
                color: isActive ? const Color(0xFF10B981) : Colors.grey[800],
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              LucideIcons.chevronDown,
              size: 16,
              color: isActive ? const Color(0xFF10B981) : Colors.grey[500],
            ),
          ],
        ),
      ),
    );
  }
}
