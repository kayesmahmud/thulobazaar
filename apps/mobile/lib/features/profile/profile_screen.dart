import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:flutter/services.dart';
import 'package:mobile/core/widgets/staggered_fade_in.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:mobile/core/widgets/app_cached_image.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import 'package:mobile/features/auth/signin_screen.dart';
// import 'package:mobile/features/profile/edit_profile_screen.dart';
import 'package:mobile/features/profile/security_settings_screen.dart';
import 'package:mobile/features/profile/phone_verification_screen.dart';
import 'package:mobile/features/verification/verification_screen.dart';
import 'package:mobile/features/profile/delete_account_screen.dart';
import 'package:mobile/features/payment/payment_history_screen.dart';
import 'package:mobile/core/theme/app_theme.dart';
import '../../core/api/auth_client.dart';
import '../../core/api/api_config.dart';
import '../../core/api/favorites_client.dart';
import '../../core/widgets/location_picker.dart';
import '../auth/signin_screen.dart';
import '../auth/signup_screen.dart';
import 'package:mobile/core/utils/page_transitions.dart';
import '../ad_detail/ad_detail_screen.dart';
import 'package:intl/intl.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import '../main_nav/main_nav_screen.dart'; // For restarting app on logout

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  final _authClient = AuthClient();
  final _favoritesClient = FavoritesClient();
  bool isLoggedIn = false;
  bool _isLoading = true;
  Map<String, dynamic>? _user;
  late TabController _tabController;

  // Favorites state
  List<FavoriteAd> _favorites = [];
  bool _favoritesLoading = true;
  String? _favoritesError;
  final Set<int> _removingAdIds = {};

  // Location state
  SelectedLocation? _selectedLocation;

  // Form dirty tracking
  bool _hasChanges = false;
  String _originalName = '';

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _nameController.addListener(_checkForChanges);
    // User data is already loaded by AuthProvider
    _populateControllers();
  }

  void _onTabChanged() {
    // Load favorites when switching to the Wishlist tab (index 2)
    if (_tabController.index == 2 && _favorites.isEmpty && !_favoritesLoading) {
      _loadFavorites();
    }
  }

  Future<void> _loadFavorites() async {
    setState(() {
      _favoritesLoading = true;
      _favoritesError = null;
    });

    final response = await _favoritesClient.getFavorites();

    if (mounted) {
      setState(() {
        _favoritesLoading = false;
        if (response.success) {
          _favorites = response.data;
        } else {
          _favoritesError = response.error;
        }
      });
    }
  }

  Future<void> _removeFavorite(int adId) async {
    final removedIndex = _favorites.indexWhere((f) => f.adId == adId);
    if (removedIndex == -1) return;
    final removedItem = _favorites[removedIndex];

    // Trigger fade-out animation
    setState(() => _removingAdIds.add(adId));

    // Wait for animation to finish
    await Future.delayed(const Duration(milliseconds: 300));

    if (!mounted) return;
    setState(() {
      _removingAdIds.remove(adId);
      _favorites.removeAt(removedIndex);
    });

    final response = await _favoritesClient.removeFromFavorites(adId);
    if (!response.success && mounted) {
      setState(() => _favorites.insert(removedIndex, removedItem)); // Rollback
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            response.error ??
                (context.locale.languageCode == 'ne'
                    ? 'हटाउन असफल'
                    : 'Failed to remove'),
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _checkForChanges() {
    final hasChanges =
        _nameController.text.trim() != _originalName ||
        _selectedLocation != null;
    if (hasChanges != _hasChanges) {
      setState(() => _hasChanges = hasChanges);
    }
  }

  void _populateControllers() {
    // We defer this slightly to ensure build is done if accessing provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        _originalName = user['fullName'] ?? '';
        setState(() {
          _nameController.text = _originalName;
          _emailController.text = user['email'] ?? '';
          _phoneController.text = user['phone'] ?? '';
        });
        // Load favorites initially
        _loadFavorites();
      }
    });
  }

  void _handleLogout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) {
      // Navigate to Home or Stay on Guest Profile - reset to MainNav
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const MainNavScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _openLocationPicker() async {
    final result = await LocationPicker.show(
      context,
      initialLocation: _selectedLocation,
    );

    if (result != null && mounted) {
      setState(() {
        _selectedLocation = result;
      });
      _checkForChanges();
    }
  }

  Future<void> _openPhoneChange() async {
    final authProvider = context.read<AuthProvider>();
    final currentPhone = authProvider.user?.phone;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PhoneVerificationScreen(
          isChanging: true,
          currentPhone: currentPhone,
          onVerified: () async {
            await authProvider.refreshProfile();
            if (mounted) _populateControllers();
          },
        ),
      ),
    );
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _nameController.removeListener(_checkForChanges);
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    if (authProvider.isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!authProvider.isLoggedIn) {
      return const LoginGateScreen(kind: LoginGateKind.profile);
    }

    // Ensure controllers are populated if not already (e.g. initial load)
    if (_nameController.text.isEmpty && authProvider.user != null) {
      _nameController.text = authProvider.user!['fullName'] ?? '';
      _emailController.text = authProvider.user!['email'] ?? '';
      _phoneController.text = authProvider.user!['phone'] ?? '';
    }

    _user = authProvider.user; // Update local ref for build methods

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildUserHeader(),
            const SizedBox(height: 16),
            _buildTabBar(),
            Container(
              color: Colors.white,
              constraints: const BoxConstraints(minHeight: 500),
              child: _buildTabContent(),
            ),
            const SizedBox(height: 100), // Bottom padding
          ],
        ),
      ),
    );
  }

  // --- GUEST VIEW COMPONENTS ---

  AppBar _buildGuestAppBar() {
    return AppBar(
      title: Text(
        context.locale.languageCode == 'ne' ? 'प्रोफाइल' : "Profile",
        style: GoogleFonts.inter(
          fontWeight: FontWeight.bold,
          color: AppTheme.textDark,
        ),
      ),
      centerTitle: false,
      backgroundColor: Colors.white,
      elevation: 0,
      actions: [
        IconButton(
          onPressed: () {},
          icon: const Icon(LucideIcons.settings, color: Colors.black),
        ),
      ],
    );
  }

  Widget _buildGuestBody(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildGuestHeaderCard(context),
          const SizedBox(height: 24),
          _buildSectionHeader(
            context.locale.languageCode == 'ne'
                ? 'खाता सेटिङहरू'
                : "Account Settings",
          ),
          _buildMenuItem(
            context,
            icon: LucideIcons.settings,
            title: context.locale.languageCode == 'ne'
                ? 'सेटिङहरू'
                : "Settings",
            onTap: () {},
          ),
          _buildMenuItem(
            context,
            icon: LucideIcons.helpCircle,
            title: context.locale.languageCode == 'ne'
                ? 'सहायता केन्द्र'
                : "Help Center",
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildGuestHeaderCard(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.user, size: 48, color: Colors.grey),
          ),
          const SizedBox(height: 16),
          Text(
            context.locale.languageCode == 'ne'
                ? 'थुलो बजारमा स्वागत छ'
                : "Welcome to Thulo Bazaar",
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.locale.languageCode == 'ne'
                ? 'तपाईंको विज्ञापन र सन्देशहरू व्यवस्थापन गर्न लगइन गर्नुहोस्'
                : "Log in to manage your ads and messages",
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SignInScreen()),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne' ? 'साइन इन' : "Sign In",
                    style: GoogleFonts.inter(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SignUpScreen()),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne' ? 'साइन अप' : "Sign Up",
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
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

  // --- LOGGED IN USER VIEW COMPONENTS ---

  Widget _buildUserHeader() {
    final String? avatar = _user?['avatar'];
    if (kDebugMode) developer.log('User Data: $_user', name: 'ProfileScreen');
    final String fullName = _user?['fullName'] ?? 'User';
    if (kDebugMode)
      developer.log('Rendered Name: $fullName', name: 'ProfileScreen');
    final _lang = context.locale.languageCode;
    final String createdAt = _user?['createdAt'] != null
        ? (_lang == 'ne'
              ? "${formatNepalTime(DateTime.parse(_user!['createdAt']), 'MMM yyyy', _lang)} देखि सदस्य"
              : "Member since ${formatNepalTime(DateTime.parse(_user!['createdAt']), 'MMM yyyy', _lang)}")
        : (_lang == 'ne' ? "२०२५ देखि सदस्य" : "Member since 2025");

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Gradient Banner Part
          Container(
            height: 120, // Height for the pink gradient area
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFF43F5E), Color(0xFFEC4899)], // Pink gradient
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Align(
                alignment: Alignment.topLeft,
                child: IconButton(
                  onPressed: () {
                    if (Navigator.canPop(context)) {
                      Navigator.pop(context);
                    } else {
                      // From bottom nav — go to home tab
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const MainNavScreen(),
                        ),
                        (route) => false,
                      );
                    }
                  },
                  icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
                ),
              ),
            ),
          ),

          // Profile Info Part (Overlapping)
          Transform.translate(
            offset: const Offset(0, -40), // Move up to overlap gradient
            child: Column(
              children: [
                // Avatar with White Border
                Container(
                  padding: const EdgeInsets.all(4), // White border thickness
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(color: Colors.grey[200]!),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child:
                          avatar != null &&
                              ApiConfig.getAvatarUrl(avatar).isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: ApiConfig.getAvatarUrl(avatar),
                              fit: BoxFit.cover,
                              width: 80,
                              height: 80,
                              memCacheWidth: 200,
                              memCacheHeight: 200,
                              fadeInDuration: const Duration(milliseconds: 200),
                              fadeOutDuration: const Duration(
                                milliseconds: 200,
                              ),
                              placeholder: (context, url) =>
                                  Container(color: Colors.grey[100]),
                              errorWidget: (context, url, error) => const Icon(
                                LucideIcons.user,
                                color: Colors.grey,
                                size: 40,
                              ),
                            )
                          : const Icon(
                              LucideIcons.user,
                              color: Colors.grey,
                              size: 40,
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 12),
                Text(
                  fullName,
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textDark,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Builder(
                      builder: (context) {
                        final bizStatus =
                            _user?['businessVerificationStatus'] as String? ??
                            '';
                        final isBusinessVerified =
                            bizStatus == 'approved' || bizStatus == 'verified';
                        final isIndividualVerified =
                            _user?['individualVerified'] == true;
                        final String label;
                        final Color bgColor;
                        final Color textColor;
                        if (isBusinessVerified) {
                          label = context.locale.languageCode == 'ne'
                              ? 'प्रमाणित व्यापार खाता'
                              : 'Verified Business Account';
                          bgColor = const Color(0xFFFEF3C7);
                          textColor = const Color(0xFFD97706);
                        } else if (isIndividualVerified) {
                          label = context.locale.languageCode == 'ne'
                              ? 'प्रमाणित व्यक्तिगत विक्रेता'
                              : 'Verified Individual Seller';
                          bgColor = const Color(0xFFDBEAFE);
                          textColor = const Color(0xFF2563EB);
                        } else {
                          label = context.locale.languageCode == 'ne'
                              ? 'विक्रेता'
                              : 'Seller';
                          bgColor = Colors.grey[100]!;
                          textColor = Colors.grey[600]!;
                        }
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            label,
                            style: GoogleFonts.inter(
                              color: textColor,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 8),
                    Text(
                      createdAt,
                      style: GoogleFonts.inter(
                        color: Colors.grey[500],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        labelColor: AppTheme.primary,
        unselectedLabelColor: Colors.grey,
        indicatorColor: AppTheme.primary,
        indicatorSize: TabBarIndicatorSize.tab,
        tabs: [
          const Tab(icon: Icon(LucideIcons.user)),
          const Tab(icon: Icon(LucideIcons.lock)),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.heart),
                const SizedBox(width: 4),
                Text("${_favorites.length}", style: GoogleFonts.inter()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    return SizedBox(
      height: 600, // Fixed height for TabBarView
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildPersonalInfoTab(),
          _buildSecurityTab(),
          _buildSavedAdsTab(),
        ],
      ),
    );
  }

  Widget _buildPersonalInfoTab() {
    final bizStatus = _user?['businessVerificationStatus'] as String? ?? '';
    final isBusinessVerified =
        bizStatus == 'approved' || bizStatus == 'verified';
    final isIndividualVerified = _user?['individualVerified'] == true;
    final isNameLocked = isBusinessVerified || isIndividualVerified;
    final isNepali = context.locale.languageCode == 'ne';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Full Name
          Row(
            children: [
              Text(
                isNepali ? 'पूरा नाम' : "Full Name",
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              if (isNameLocked) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        LucideIcons.lock,
                        size: 10,
                        color: Color(0xFFB45309),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isNepali ? 'लक' : 'Locked',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFB45309),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _nameController,
            enabled: !isNameLocked,
            decoration: InputDecoration(
              filled: isNameLocked,
              fillColor: isNameLocked ? Colors.grey[50] : null,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[200]!),
              ),
            ),
            style: GoogleFonts.inter(
              color: isNameLocked ? Colors.grey[500] : AppTheme.textDark,
            ),
          ),
          if (isNameLocked) ...[
            const SizedBox(height: 6),
            Text(
              isNepali
                  ? 'तपाईंको खाता प्रमाणित भएकाले नाम परिवर्तन गर्न मिल्दैन। प्रमाणीकरण समाप्त भएपछि वा रद्द गरेपछि मात्र परिवर्तन गर्न सकिनेछ।'
                  : 'Your name cannot be changed because your account is verified. You can edit it after your verification expires or is revoked.',
              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
          const SizedBox(height: 20),

          // Email Address
          Row(
            children: [
              Text(
                context.locale.languageCode == 'ne'
                    ? 'इमेल ठेगाना'
                    : "Email Address",
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(width: 4),
              Text(
                context.locale.languageCode == 'ne'
                    ? '(परिवर्तन गर्न सकिँदैन)'
                    : "(Cannot be changed)",
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            readOnly: true,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.grey[50],
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[200]!),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[200]!),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Phone Number
          Text(
            context.locale.languageCode == 'ne' ? 'फोन नम्बर' : "Phone Number",
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Builder(
            builder: (context) {
              final isPhoneVerified = _user?['phoneVerified'] ?? false;
              return GestureDetector(
                onTap: _openPhoneChange,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: isPhoneVerified
                        ? const Color(0xFFECFDF5)
                        : Colors.orange.withOpacity(0.08),
                    border: Border.all(
                      color: isPhoneVerified
                          ? const Color(0xFFA7F3D0)
                          : Colors.orange.withOpacity(0.4),
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isPhoneVerified
                            ? LucideIcons.checkCircle
                            : LucideIcons.alertCircle,
                        color: isPhoneVerified
                            ? const Color(0xFF10B981)
                            : Colors.orange,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _phoneController.text.isNotEmpty
                            ? _phoneController.text
                            : (context.locale.languageCode == 'ne'
                                  ? 'फोन नम्बर थपिएको छैन'
                                  : 'No phone added'),
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textDark,
                        ),
                      ),
                      if (isPhoneVerified) ...[
                        const SizedBox(width: 8),
                        Text(
                          l('verified', context.locale.languageCode),
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF10B981),
                            fontSize: 13,
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(
                        isPhoneVerified
                            ? (context.locale.languageCode == 'ne'
                                  ? 'परिवर्तन गर्नुहोस्'
                                  : "Change")
                            : (context.locale.languageCode == 'ne'
                                  ? 'प्रमाणित गर्नुहोस्'
                                  : "Verify"),
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        LucideIcons.chevronRight,
                        size: 12,
                        color: AppTheme.primary,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),

          // Location
          Text(
            l('location', context.locale.languageCode),
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: _openLocationPicker,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                border: Border.all(color: Colors.grey[200]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.mapPin, color: Colors.grey[600], size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _selectedLocation?.shortDisplayName ??
                          _user?['locationName'] ??
                          (context.locale.languageCode == 'ne'
                              ? 'स्थान चयन गर्नुहोस्'
                              : "Select Location"),
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textDark,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    context.locale.languageCode == 'ne'
                        ? 'परिवर्तन गर्नुहोस्'
                        : "Change",
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    LucideIcons.chevronRight,
                    size: 12,
                    color: AppTheme.primary,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(color: Colors.grey[300]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    l('cancel', context.locale.languageCode),
                    style: GoogleFonts.inter(
                      color: Colors.grey[700],
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: () async {
                    final newName = _nameController.text.trim();
                    if (newName.isEmpty) return;
                    try {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            context.locale.languageCode == 'ne'
                                ? 'परिवर्तन सेभ हुँदैछ...'
                                : 'Saving changes...',
                          ),
                        ),
                      );

                      // Build update payload
                      final updateData = <String, dynamic>{'fullName': newName};

                      // Add location if selected
                      if (_selectedLocation?.finalLocationId != null) {
                        updateData['locationId'] =
                            _selectedLocation!.finalLocationId;
                      }

                      await context.read<AuthProvider>().updateProfile(
                        updateData,
                      );
                      if (context.mounted) {
                        _originalName = newName;
                        _selectedLocation = null;
                        setState(() => _hasChanges = false);
                        ScaffoldMessenger.of(context).hideCurrentSnackBar();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              context.locale.languageCode == 'ne'
                                  ? 'प्रोफाइल सफलतापूर्वक अपडेट भयो!'
                                  : 'Profile updated successfully!',
                            ),
                            backgroundColor: Colors.green,
                          ),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).hideCurrentSnackBar();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              context.locale.languageCode == 'ne'
                                  ? 'अपडेट गर्न असफल: $e'
                                  : 'Failed to update: $e',
                            ),
                          ),
                        );
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _hasChanges
                        ? const Color(0xFFE91E63)
                        : const Color(0xFFF48FB1),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: _hasChanges ? 2 : 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne'
                        ? 'सेभ गर्नुहोस्'
                        : "Save Changes",
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
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

  Widget _buildSecurityTab() {
    final bool isPhoneVerified = _user?['phoneVerified'] ?? false;
    final String? phone = _user?['phone'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Phone Verification Status Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isPhoneVerified
                  ? Colors.green.withOpacity(0.1)
                  : Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isPhoneVerified
                    ? Colors.green.withOpacity(0.3)
                    : Colors.orange.withOpacity(0.3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isPhoneVerified
                      ? LucideIcons.shieldCheck
                      : LucideIcons.alertTriangle,
                  color: isPhoneVerified ? Colors.green : Colors.orange,
                  size: 32,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isPhoneVerified
                            ? (context.locale.languageCode == 'ne'
                                  ? 'फोन प्रमाणित भयो'
                                  : 'Phone Verified')
                            : (context.locale.languageCode == 'ne'
                                  ? 'तपाईंको फोन प्रमाणित गर्नुहोस्'
                                  : 'Verify Your Phone'),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isPhoneVerified
                              ? Colors.green[800]
                              : Colors.orange[800],
                          fontSize: 16,
                        ),
                      ),
                      if (phone != null)
                        Text(
                          phone,
                          style: TextStyle(
                            color: isPhoneVerified
                                ? Colors.green[800]
                                : Colors.orange[800],
                          ),
                        ),
                    ],
                  ),
                ),
                if (!isPhoneVerified)
                  ElevatedButton(
                    onPressed: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PhoneVerificationScreen(
                            onVerified: () =>
                                context.read<AuthProvider>().refreshProfile(),
                          ),
                        ),
                      );
                      // Force refresh regardless of callback sometimes
                      if (mounted)
                        context.read<AuthProvider>().refreshProfile();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                    child: Text(
                      context.locale.languageCode == 'ne'
                          ? 'प्रमाणित गर्नुहोस्'
                          : 'Verify',
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          Text(
            context.locale.languageCode == 'ne'
                ? 'सुरक्षा सेटिङहरू'
                : 'Security Settings',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Security Options List
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey[200]!),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(
                    LucideIcons.shield,
                    color: AppTheme.primary,
                  ),
                  title: Text(
                    context.locale.languageCode == 'ne'
                        ? 'सुरक्षा केन्द्र'
                        : 'Security Center',
                  ),
                  subtitle: Text(
                    context.locale.languageCode == 'ne'
                        ? 'पासवर्ड, 2FA, सक्रिय सत्रहरू'
                        : 'Password, 2FA, Active Sessions',
                  ),
                  trailing: const Icon(LucideIcons.chevronRight),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const SecuritySettingsScreen(),
                      ),
                    );
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(
                    LucideIcons.badgeCheck,
                    color: AppTheme.primary,
                  ),
                  title: Text(
                    context.locale.languageCode == 'ne'
                        ? 'प्रमाणीकरण केन्द्र'
                        : 'Verification Center',
                  ),
                  subtitle: Text(
                    context.locale.languageCode == 'ne'
                        ? 'पहिचान, व्यापार, ब्याज'
                        : 'Identity, Business, Badges',
                  ),
                  trailing: const Icon(LucideIcons.chevronRight),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VerificationScreen(),
                      ),
                    );
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(
                    LucideIcons.receipt,
                    color: AppTheme.primary,
                  ),
                  title: Text(
                    context.locale.languageCode == 'ne' ? 'बिलिङ' : 'Billing',
                  ),
                  subtitle: Text(
                    context.locale.languageCode == 'ne'
                        ? 'भुक्तानी इतिहास र रसिदहरू'
                        : 'Payment history & receipts',
                  ),
                  trailing: const Icon(LucideIcons.chevronRight),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const PaymentHistoryScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          Text(
            context.locale.languageCode == 'ne'
                ? 'खाता व्यवस्थापन'
                : 'Account Management',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey[200]!),
            ),
            child: ListTile(
              leading: const Icon(LucideIcons.trash2, color: Colors.red),
              title: Text(
                context.locale.languageCode == 'ne'
                    ? 'खाता हटाउनुहोस्'
                    : 'Delete Account',
              ),
              subtitle: Text(
                context.locale.languageCode == 'ne'
                    ? 'तपाईंको खाता र डाटा स्थायी रूपमा हटाउनुहोस्'
                    : 'Permanently delete your account and data',
              ),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const DeleteAccountScreen(),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppTheme.primary, size: 22),
        ),
        title: Text(
          title,
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            color: AppTheme.textDark,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
        ),
        trailing: const Icon(
          LucideIcons.chevronRight,
          size: 16,
          color: Colors.grey,
        ),
        onTap: onTap,
      ),
    );
  }

  Widget _buildSavedAdsTab() {
    if (_favoritesLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (_favoritesError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.alertCircle, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _favoritesError!,
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadFavorites,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
              child: Text(l('retry', context.locale.languageCode)),
            ),
          ],
        ),
      );
    }

    if (_favorites.isEmpty) {
      return StaggeredFadeIn(
        index: 0,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.heart,
                  size: 48,
                  color: Colors.grey[400],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                context.locale.languageCode == 'ne'
                    ? 'अहिलेसम्म सेभ गरिएको विज्ञापन छैन'
                    : "No saved ads yet",
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                context.locale.languageCode == 'ne'
                    ? 'बुकमार्क आइकनमा क्लिक गरेर विज्ञापनहरू सेभ गर्नुहोस्'
                    : "Save ads by clicking the bookmark icon",
                style: GoogleFonts.inter(color: Colors.grey[500]),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const MainNavScreen(initialIndex: 1),
                  ),
                  (route) => false,
                ),
                icon: const Icon(LucideIcons.search),
                label: Text(
                  context.locale.languageCode == 'ne'
                      ? 'विज्ञापन खोज्नुहोस्'
                      : "Search Ads",
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await _loadFavorites();
        HapticFeedback.mediumImpact();
      },
      color: AppTheme.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _favorites.length,
        itemBuilder: (context, index) {
          final favorite = _favorites[index];
          final isRemoving = _removingAdIds.contains(favorite.adId);
          return AnimatedOpacity(
            opacity: isRemoving ? 0.0 : 1.0,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
            child: AnimatedSize(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
              child: isRemoving
                  ? const SizedBox(width: double.infinity)
                  : _buildSavedAdItem(favorite),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSavedAdItem(FavoriteAd favorite) {
    final ad = favorite.ad;
    final imageUrl = ad.primaryImage != null
        ? ApiConfig.getAdImageUrl(ad.primaryImage)
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Main Content
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                Hero(
                  tag: 'profile-image-${ad.id}',
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 90,
                      height: 90,
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
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: AppTheme.textDark,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          if (ad.categoryName != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                ad.categoryName!,
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                          ],
                          if (ad.locationName != null)
                            Expanded(
                              child: Text(
                                ad.locationName!,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        ad.price != null
                            ? formatLocalizedPrice(
                                ad.price!,
                                context.locale.languageCode,
                              )
                            : (context.locale.languageCode == 'ne'
                                  ? 'मूल्यको लागि सम्पर्क गर्नुहोस्'
                                  : 'Price on request'),
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Action Buttons
          Container(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => Navigator.push(
                      context,
                      FadeScaleRoute(
                        builder: (_) =>
                            AdDetailScreen(adId: ad.id, slug: ad.slug),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            LucideIcons.eye,
                            size: 16,
                            color: AppTheme.primary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            context.locale.languageCode == 'ne'
                                ? 'हेर्नुहोस्'
                                : "View",
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Container(width: 1, height: 40, color: Colors.grey[200]),
                Expanded(
                  child: InkWell(
                    onTap: () => _removeFavorite(favorite.adId),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            LucideIcons.trash2,
                            size: 16,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 6),
                          Text(
                            context.locale.languageCode == 'ne'
                                ? 'हटाउनुहोस्'
                                : "Remove",
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[600],
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatNumber(double number) {
    return number
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title.toUpperCase(),
          style: GoogleFonts.inter(
            color: Colors.grey[500],
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 1), // Separator line effect
      child: ListTile(
        leading: Icon(icon, color: Colors.grey[700], size: 22),
        title: Text(
          title,
          style: GoogleFonts.inter(fontSize: 15, color: Colors.grey[900]),
        ),
        trailing: const Icon(
          LucideIcons.chevronRight,
          size: 14,
          color: Colors.grey,
        ),
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      ),
    );
  }
}
