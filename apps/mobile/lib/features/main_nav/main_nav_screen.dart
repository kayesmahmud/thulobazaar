import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/providers/chat_provider.dart';
import 'package:mobile/features/home/home_screen.dart';
import 'package:mobile/features/search/search_screen.dart';
import 'package:mobile/features/post_ad/post_ad_screen.dart';
import 'package:mobile/features/messages/messages_screen.dart';
import 'package:mobile/features/profile/profile_screen.dart';

class MainNavScreen extends StatefulWidget {
  final int initialIndex;
  final int? initialCategoryId;
  final String? initialCategoryName;
  final int? initialSubcategoryId;
  final int? initialLocationId;
  final String? initialLocationName;

  const MainNavScreen({
    super.key,
    this.initialIndex = 0,
    this.initialCategoryId,
    this.initialCategoryName,
    this.initialSubcategoryId,
    this.initialLocationId,
    this.initialLocationName,
  });

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  late int _selectedIndex;
  final GlobalKey<SearchScreenState> _searchKey = GlobalKey();
  final GlobalKey<HomeScreenState> _homeKey = GlobalKey();
  // Set by HomeScreen when the server has newer ads than the loaded feed;
  // drives the dot on the Home tab icon.
  final ValueNotifier<bool> _homeHasNewAds = ValueNotifier(false);
  late final Set<int> _visitedTabs;

  // Breadcrumb of NON-Home tabs in visit order (most recent last).
  // Home is the implicit root: an empty trail means "we're on Home".
  late final List<int> _tabHistory;

  static const int _homeIndex = 0;
  // Native bridge to send the Android app to the background (see MainActivity.kt).
  static const _appControl = MethodChannel(
    'com.thulobazaar.mobile/app_control',
  );

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    _visitedTabs = {widget.initialIndex};
    // Seed the trail: empty if we open on Home, else the deep-linked tab
    // sits above Home so back still lands on Home before backgrounding.
    _tabHistory = widget.initialIndex == _homeIndex
        ? []
        : [widget.initialIndex];

    // Initialize chat if logged in
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated && authProvider.userId != null) {
        context.read<ChatProvider>().initialize(authProvider.userId!);
      }

      // Listen for auth changes to init/dispose chat
      authProvider.addListener(() {
        if (authProvider.isAuthenticated && authProvider.userId != null) {
          context.read<ChatProvider>().initialize(authProvider.userId!);
        } else {
          context.read<ChatProvider>().disconnect();
        }
      });

      // Apply initial category filter if provided
      if (widget.initialCategoryId != null &&
          widget.initialCategoryName != null) {
        _handleCategoryTap(
          widget.initialCategoryId!,
          widget.initialCategoryName!,
          subcategoryId: widget.initialSubcategoryId,
        );
      }

      // Apply initial location filter if provided
      if (widget.initialLocationId != null &&
          widget.initialLocationName != null) {
        _handleLocationTap(
          widget.initialLocationId!,
          widget.initialLocationName!,
        );
      }
    });
  }

  @override
  void dispose() {
    _homeHasNewAds.dispose();
    super.dispose();
  }

  // Home icon with a small dot that appears when newer ads exist on the
  // server than what the feed is showing; tapping Home refreshes and clears it.
  Widget _buildHomeIcon() {
    return ValueListenableBuilder<bool>(
      valueListenable: _homeHasNewAds,
      builder: (context, hasNewAds, _) {
        return Stack(
          children: [
            const Icon(LucideIcons.home),
            if (hasNewAds)
              Positioned(
                right: 0,
                top: 0,
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.0, end: 1.0),
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.elasticOut,
                  builder: (context, scale, child) {
                    return Transform.scale(scale: scale, child: child);
                  },
                  child: Container(
                    width: 9,
                    height: 9,
                    decoration: BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  // Single entry point for switching tabs — keeps the breadcrumb in sync.
  void _selectTab(int screenIndex) {
    setState(() {
      _visitedTabs.add(screenIndex);
      if (screenIndex == _homeIndex) {
        _tabHistory.clear(); // back at the root → collapse the trail
      } else {
        _tabHistory
          ..remove(screenIndex) // dedup: drop any earlier visit...
          ..add(screenIndex); // ...and push it as the most recent
      }
      _selectedIndex = screenIndex;
    });
  }

  void _handleHomeSearch(String query) {
    if (query.isEmpty) return;
    _selectTab(1);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchKey.currentState?.searchFor(query);
    });
  }

  void _handleViewAllAds() {
    _selectTab(1);
  }

  void _handleCategoryTap(
    int categoryId,
    String categoryName, {
    int? subcategoryId,
  }) {
    _selectTab(1);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchKey.currentState?.filterByCategory(
        categoryId,
        categoryName,
        subcategoryId: subcategoryId,
      );
    });
  }

  void _handleLocationTap(int locationId, String locationName) {
    _selectTab(1);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchKey.currentState?.filterByLocation(locationId, locationName);
    });
  }

  // Convert nav index to screen index (nav 2 is FAB spacer, skip it)
  int _navToScreen(int navIndex) => navIndex > 2 ? navIndex - 1 : navIndex;
  // Convert screen index to nav index
  int _screenToNav(int screenIndex) =>
      screenIndex >= 2 ? screenIndex + 1 : screenIndex;

  void _onItemTapped(int index) {
    if (index == 2) return; // FAB spacer — ignore tap
    final screenIndex = _navToScreen(index);
    if (screenIndex == _homeIndex && _selectedIndex == _homeIndex) {
      // Re-tap on the active Home tab: back to the top + refresh the feed
      // (Instagram-style), whether or not the new-ads dot is showing.
      _homeKey.currentState?.scrollToTopAndRefresh();
      return;
    }
    _selectTab(screenIndex);
  }

  // Sends the app to the background on Android (no-op elsewhere).
  // iOS has no back button and forbids programmatic backgrounding (App Store),
  // so the Platform guard keeps this iOS-safe.
  Future<void> _moveToBackground() async {
    if (Platform.isAndroid) {
      await _appControl.invokeMethod('moveToBackground');
    }
  }

  // Decides what the system back button does from the nav shell.
  // Back must NEVER close the app:
  //   trail not empty -> step back to the previous tab (Home once it empties).
  //   on Home         -> send the app to the background (stays alive in Recents).
  void _handleBackPress() {
    if (_tabHistory.isNotEmpty) {
      setState(() {
        _tabHistory.removeLast();
        _selectedIndex = _tabHistory.isEmpty ? _homeIndex : _tabHistory.last;
      });
      return;
    }
    _moveToBackground();
  }

  void _navigateToPostAd() {
    final authProvider = context.read<AuthProvider>();

    if (authProvider.isLoggedIn) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const PostAdScreen()),
      );
    } else {
      _showLoginPrompt();
    }
  }

  /// The Post Ad gate. Was a hand-rolled 110-line bottom sheet whose builder
  /// context outlived the sheet — see the crash note in git history. A pushed
  /// route has no sheet context to capture, and it matches every other gated
  /// screen instead of being a one-off.
  void _showLoginPrompt() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const LoginGateScreen(kind: LoginGateKind.postAd),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _handleBackPress();
      },
      child: Scaffold(
        body: IndexedStack(
          index: _selectedIndex,
          children: [
            if (_visitedTabs.contains(0))
              HomeScreen(
                key: _homeKey,
                onSearch: _handleHomeSearch,
                onCategoryTap: _handleCategoryTap,
                onViewAllAds: _handleViewAllAds,
                newAdsNotifier: _homeHasNewAds,
              )
            else
              const SizedBox.shrink(),
            if (_visitedTabs.contains(1))
              SearchScreen(key: _searchKey)
            else
              const SizedBox.shrink(),
            if (_visitedTabs.contains(2))
              const MessagesScreen()
            else
              const SizedBox.shrink(),
            if (_visitedTabs.contains(3))
              const ProfileScreen()
            else
              const SizedBox.shrink(),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Consumer<ChatProvider>(
            builder: (context, chatProvider, child) {
              return BottomNavigationBar(
                currentIndex: _screenToNav(_selectedIndex),
                onTap: _onItemTapped,
                type: BottomNavigationBarType.fixed,
                backgroundColor: Colors.white,
                selectedItemColor: const Color(0xFF10B981),
                unselectedItemColor: Colors.grey[400],
                selectedLabelStyle: GoogleFonts.inter(
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                unselectedLabelStyle: GoogleFonts.inter(
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
                items: [
                  BottomNavigationBarItem(
                    icon: _buildHomeIcon(),
                    activeIcon: _buildHomeIcon(),
                    label: 'nav.home'.tr(),
                  ),
                  BottomNavigationBarItem(
                    icon: const Icon(LucideIcons.search),
                    activeIcon: const Icon(LucideIcons.search),
                    label: 'nav.search'.tr(),
                  ),
                  // Spacer for FAB — invisible, FAB covers this slot
                  const BottomNavigationBarItem(
                    icon: SizedBox.shrink(),
                    label: '',
                  ),
                  BottomNavigationBarItem(
                    icon: Stack(
                      children: [
                        const Icon(LucideIcons.messageCircle),
                        if (chatProvider.unreadCount > 0)
                          Positioned(
                            right: 0,
                            top: 0,
                            child: TweenAnimationBuilder<double>(
                              key: ValueKey(chatProvider.unreadCount),
                              tween: Tween(begin: 1.4, end: 1.0),
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.elasticOut,
                              builder: (context, scale, child) {
                                return Transform.scale(
                                  scale: scale,
                                  child: child,
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                constraints: const BoxConstraints(
                                  minWidth: 14,
                                  minHeight: 14,
                                ),
                                child: Text(
                                  '${chatProvider.unreadCount}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    activeIcon: const Icon(LucideIcons.messageCircle),
                    label: 'nav.messages'.tr(),
                  ),
                  BottomNavigationBarItem(
                    icon: const Icon(LucideIcons.user),
                    activeIcon: const Icon(LucideIcons.user),
                    label: 'nav.profile'.tr(),
                  ),
                ],
              );
            },
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _navigateToPostAd,
          backgroundColor: const Color(0xFF10B981),
          shape: const CircleBorder(),
          elevation: 4,
          child: const Icon(LucideIcons.plus, color: Colors.white, size: 32),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      ),
    );
  }
}

class PlaceholderScreen extends StatelessWidget {
  final String title;
  const PlaceholderScreen({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        title,
        style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600),
      ),
    );
  }
}
