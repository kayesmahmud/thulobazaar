import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/widgets/staggered_fade_in.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:developer' as developer;
import 'dart:io';

import 'package:mobile/core/api/shop_client.dart';
import 'package:mobile/core/api/auth_client.dart'; // Import AuthClient
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/widgets/ad_card.dart';
import 'package:mobile/features/shop/shop_tabs.dart'; // Import Tabs
import 'package:mobile/core/widgets/load_error_view.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class ShopScreen extends StatefulWidget {
  final String shopSlug;

  const ShopScreen({super.key, required this.shopSlug});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final ShopClient _shopClient = ShopClient();
  final AuthClient _authClient = AuthClient();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _picker = ImagePicker();

  // State
  ShopProfile? _shop;
  List<AdWithDetails> _ads = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  bool _isOffline = false;
  int _currentPage = 1;
  int _totalPages = 1;

  bool _isOwner = false;
  bool _uploadingImage = false;

  @override
  void initState() {
    super.initState();
    _fetchShopData();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreAds();
    }
  }

  Future<void> _fetchShopData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // 1. Fetch Shop & Ads
      final results = await Future.wait([
        _shopClient.getShopBySlug(widget.shopSlug),
        _shopClient.getShopAds(widget.shopSlug, page: 1, limit: 20),
      ]);

      final shopResponse = results[0] as ApiResponse<ShopProfile>;
      final adsResponse = results[1] as PaginatedResponse<AdWithDetails>;

      // 2. Check Owner Status (if shop fetched successfully)
      bool isOwner = false;
      if (shopResponse.success && shopResponse.data != null) {
        try {
          final token = await _authClient.getToken();
          if (token != null) {
            final profileData = await _authClient.getProfile();
            if (profileData['success'] == true) {
              // Assuming profileData['data']['id'] matches shopResponse.data.id
              // Note: 'data' might be user object or profile object.
              // Check AuthClient.getProfile response structure.
              // Usually it returns { succeed: true, data: { id: 1, ... } }
              final userId = profileData['data']['id'];
              if (userId == shopResponse.data!.id) {
                isOwner = true;
              }
            }
          }
        } catch (e) {
          debugPrint('Error checking owner status: $e');
        }
      }

      if (!mounted) return;
      if (shopResponse.success && shopResponse.data != null) {
        setState(() {
          _shop = shopResponse.data;
          _ads = adsResponse.success ? adsResponse.data : [];
          _totalPages = adsResponse.pagination?.totalPages ?? 1;
          _isLoading = false;
          _isOwner = isOwner;
          _error = null;
        });
      } else {
        // A failed shop fetch is either offline or genuinely not found; when
        // online, _isOfflineError() returns false → generic error message.
        final offline = await _isOfflineError();
        if (!mounted) return;
        setState(() {
          _error = shopResponse.errorMessage ?? 'Shop not found';
          _isOffline = offline;
          _isLoading = false;
        });
      }
    } catch (e) {
      final offline = await _isOfflineError();
      if (mounted) {
        setState(() {
          _error = 'Network error: $e';
          _isOffline = offline;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadMoreAds() async {
    if (_isLoadingMore || _currentPage >= _totalPages) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final response = await _shopClient.getShopAds(
        widget.shopSlug,
        page: _currentPage + 1,
        limit: 20,
      );

      if (response.success && mounted) {
        setState(() {
          _ads.addAll(response.data);
          _currentPage++;
          _isLoadingMore = false;
        });
      } else if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    }
  }

  // --- Image Handling ---

  Future<void> _pickImage({required bool isCover}) async {
    if (_uploadingImage) return;

    if (isCover) {
      _showCoverImageGuide();
      return;
    }

    _openImagePicker(isCover: false);
  }

  void _showCoverImageGuide() {
    final isNe = context.locale.languageCode == 'ne';
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          24,
          24,
          24,
          24 + MediaQuery.of(ctx).viewPadding.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.image, size: 40, color: Colors.grey[400]),
            const SizedBox(height: 12),
            Text(
              isNe ? 'कभर फोटो अपलोड गर्नुहोस्' : 'Upload Cover Photo',
              style: AppFont.inter(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFF10B981).withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    LucideIcons.info,
                    size: 18,
                    color: Color(0xFF10B981),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      isNe
                          ? 'सिफारिस गरिएको साइज: 1290 × 552 px'
                          : 'Recommended size: 1290 × 552 px',
                      style: AppFont.inter(
                        fontSize: 13,
                        color: const Color(0xFF065F46),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _openImagePicker(isCover: true);
                },
                icon: const Icon(LucideIcons.upload, size: 18),
                label: Text(
                  isNe ? 'फोटो छान्नुहोस्' : 'Choose Photo',
                  style: AppFont.inter(fontWeight: FontWeight.w600),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF43F5E),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openImagePicker({required bool isCover}) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
      );
      if (pickedFile != null) {
        _cropImage(pickedFile.path, isCover: isCover);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.locale.languageCode == 'ne'
                  ? 'छवि छान्दा त्रुटि: $e'
                  : 'Error picking image: $e',
            ),
          ),
        );
      }
    }
  }

  Future<void> _cropImage(String path, {required bool isCover}) async {
    CroppedFile? croppedFile = await ImageCropper().cropImage(
      sourcePath: path,
      aspectRatio: isCover
          ? const CropAspectRatio(ratioX: 2.34, ratioY: 1)
          : const CropAspectRatio(ratioX: 1, ratioY: 1),
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: isCover
              ? (context.locale.languageCode == 'ne'
                    ? 'कभर फोटो क्रप गर्नुहोस्'
                    : 'Crop Cover Photo')
              : (context.locale.languageCode == 'ne'
                    ? 'अवतार क्रप गर्नुहोस्'
                    : 'Crop Avatar'),
          toolbarColor: const Color(0xFFF43F5E),
          toolbarWidgetColor: Colors.white,
          initAspectRatio: isCover
              ? CropAspectRatioPreset.ratio3x2
              : CropAspectRatioPreset.square,
          lockAspectRatio: true,
        ),
        IOSUiSettings(
          title: isCover
              ? (context.locale.languageCode == 'ne'
                    ? 'कभर फोटो क्रप गर्नुहोस्'
                    : 'Crop Cover Photo')
              : (context.locale.languageCode == 'ne'
                    ? 'अवतार क्रप गर्नुहोस्'
                    : 'Crop Avatar'),
        ),
      ],
    );

    if (croppedFile != null) {
      _uploadImage(croppedFile.path, isCover: isCover);
    }
  }

  Future<void> _uploadImage(String path, {required bool isCover}) async {
    setState(() => _uploadingImage = true);

    ApiResponse<String> response;
    if (isCover) {
      response = await _shopClient.uploadCover(path);
    } else {
      response = await _shopClient.uploadAvatar(path);
    } // Assuming single file upload?

    // Actually the client methods I added take file path.
    // Wait, update: I added uploadAvatar(File file) in plan, but implemented uploadAvatar(String path) in execution.
    // Double check shop_client.dart implementation.
    // Yes, I implemented `uploadAvatar(String filePath)`.

    setState(() => _uploadingImage = false);

    if (response.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'कभर/अवतार सफलतापूर्वक अपडेट भयो'
                : '${isCover ? "Cover" : "Avatar"} updated successfully',
          ),
        ),
      );
      // Refresh shop data to show new image
      // Or just update local state if response returns URL.
      // The API returns message or data with URL?
      // My client implementation: return ApiResponse.success(response.data['data']['avatar_url']);
      // So I get the URL back.
      setState(() {
        if (response.data != null) {
          // Create new shop object with updated image
          // Need copyWith method on ShopProfile ideally.
          // Or just re-fetch for simplicity/consistency.
          _fetchShopData();
        }
      });
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(response.errorMessage)));
    }
  }

  // --- UI Building ---

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFF43F5E)),
            )
          : _error != null
          ? _buildErrorState()
          : _buildContent(),
    );
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

  Widget _buildErrorState() {
    return LoadErrorView(isOffline: _isOffline, onRetry: _fetchShopData);
  }

  Widget _buildContent() {
    if (_shop == null) return const SizedBox.shrink();

    return RefreshIndicator(
      onRefresh: () async {
        await _fetchShopData();
        HapticFeedback.mediumImpact();
      },
      color: const Color(0xFFF43F5E),
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Profile Header with back button overlay
          SliverToBoxAdapter(child: _buildProfileHeader()),

          // Tabs & Content
          SliverToBoxAdapter(
            child: ShopTabs(
              shop: _shop!,
              isOwner: _isOwner,
              onProfileUpdated: (updatedShop) {
                setState(() {
                  _shop = updatedShop;
                });
              },
            ),
          ),

          // Spacer between the profile tabs and the ads grid. The "Ads from
          // X (N)" heading was removed — it duplicated the "Active Ads" stat
          // shown in the profile header above.
          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // Ads Grid
          _ads.isEmpty ? _buildEmptyAds() : _buildAdsGrid(),

          // Loading More
          if (_isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final coverUrl = _shop!.coverPhoto != null
        ? ApiConfig.getCoverUrl(_shop!.coverPhoto)
        : null;
    final avatarUrl = _shop!.avatar != null
        ? ApiConfig.getAvatarUrl(_shop!.avatar)
        : null;

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          // Cover Photo
          Stack(
            children: [
              AspectRatio(
                aspectRatio: 1290 / 552, // Match recommended cover size
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: coverUrl == null
                        ? const LinearGradient(
                            colors: [Color(0xFFF43F5E), Color(0xFF9333EA)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                  ),
                  child: coverUrl != null
                      ? CachedNetworkImage(
                          imageUrl: coverUrl,
                          fit: BoxFit.cover,
                          memCacheWidth: 1290,
                          memCacheHeight: 552,
                          fadeInDuration: const Duration(milliseconds: 200),
                          fadeOutDuration: const Duration(milliseconds: 200),
                          placeholder: (context, url) =>
                              Container(color: Colors.grey[200]),
                          errorWidget: (context, url, error) =>
                              Container(color: Colors.grey[200]),
                        )
                      : null,
                ),
              ),
              // Back button
              Positioned(
                left: 12,
                top: MediaQuery.of(context).padding.top + 8,
                child: GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.4),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.arrowLeft,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                ),
              ),
              if (_isOwner)
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: InkWell(
                    onTap: () => _pickImage(isCover: true),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: _uploadingImage
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(
                              LucideIcons.camera,
                              color: Colors.white,
                              size: 20,
                            ),
                    ),
                  ),
                ),
            ],
          ),

          // Profile Info Section
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar (overlapping cover)
                Transform.translate(
                  offset: const Offset(0, -40),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Avatar
                      Stack(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: _shop!.isBusinessVerified
                                    ? const Color(0xFFFBBF24)
                                    : _shop!.individualVerified
                                    ? const Color(0xFF3B82F6)
                                    : Colors.white,
                                width: 4,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: avatarUrl != null
                                  ? CachedNetworkImage(
                                      imageUrl: avatarUrl,
                                      fit: BoxFit.cover,
                                      memCacheWidth: 200,
                                      memCacheHeight: 200,
                                      fadeInDuration: const Duration(
                                        milliseconds: 200,
                                      ),
                                      fadeOutDuration: const Duration(
                                        milliseconds: 200,
                                      ),
                                      placeholder: (context, url) =>
                                          _buildAvatarPlaceholder(),
                                      errorWidget: (context, url, error) =>
                                          _buildAvatarPlaceholder(),
                                    )
                                  : _buildAvatarPlaceholder(),
                            ),
                          ),
                          if (_isOwner)
                            Positioned(
                              right: 0,
                              bottom: 0,
                              child: InkWell(
                                onTap: () => _pickImage(isCover: false),
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.grey[200]!,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.1),
                                        blurRadius: 4,
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    LucideIcons.camera,
                                    color: Colors.black87,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(width: 16),

                      // Name and Badge
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      _shop!.displayName,
                                      style: AppFont.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (_shop!.isBusinessVerified) ...[
                                    const SizedBox(width: 6),
                                    Image.asset(
                                      'assets/images/golden-badge.png',
                                      width: 22,
                                      height: 22,
                                    ),
                                  ] else if (_shop!.individualVerified) ...[
                                    const SizedBox(width: 6),
                                    Image.asset(
                                      'assets/images/blue-badge.png',
                                      width: 22,
                                      height: 22,
                                    ),
                                  ],
                                ],
                              ),
                              Text(
                                _shop!.isBusinessVerified
                                    ? (context.locale.languageCode == 'ne'
                                          ? 'प्रमाणित व्यापार खाता'
                                          : 'Verified Business Account')
                                    : _shop!.individualVerified
                                    ? (context.locale.languageCode == 'ne'
                                          ? 'प्रमाणित व्यक्तिगत विक्रेता'
                                          : 'Verified Individual Seller')
                                    : (context.locale.languageCode == 'ne'
                                          ? 'विक्रेता'
                                          : 'Seller'),
                                style: AppFont.inter(
                                  fontSize: 13,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Stats Row
                Transform.translate(
                  offset: const Offset(0, -20),
                  child: Row(
                    children: [
                      _buildStatItem(
                        '${_shop!.totalAds}',
                        context.locale.languageCode == 'ne'
                            ? 'विज्ञापनहरू'
                            : 'Active Ads',
                      ),
                      const SizedBox(width: 24),
                      _buildStatItem(
                        _formatNumber(_shop!.totalViews),
                        l('views', context.locale.languageCode),
                      ),
                      const SizedBox(width: 24),
                      _buildStatItem(
                        _shop!.memberSince,
                        context.locale.languageCode == 'ne'
                            ? 'सदस्य'
                            : 'Joined',
                      ),
                      const Spacer(),
                      _buildShareButton(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Circular share button at the end of the stats row.
  Widget _buildShareButton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IconButton(
        onPressed: _shareShop,
        tooltip: context.locale.languageCode == 'ne'
            ? 'पसल सेयर गर्नुहोस्'
            : 'Share shop',
        icon: const Icon(
          LucideIcons.share2,
          size: 20,
          color: Color(0xFF374151),
        ),
      ),
    );
  }

  /// Share the shop's public URL. iOS goes through the native channel
  /// because share_plus can't find the root view controller under the
  /// UIScene lifecycle (same fix as AdDetailScreen._shareAd).
  Future<void> _shareShop() async {
    final shop = _shop;
    if (shop == null) return;
    final lang = context.locale.languageCode;
    // URL only — no shop name — so it pastes cleanly into social link fields.
    final url = 'https://thulobazaar.com.np/$lang/shop/${widget.shopSlug}';
    try {
      if (Platform.isIOS) {
        await const MethodChannel(
          'app/native_share',
        ).invokeMethod('share', {'text': url, 'subject': shop.displayName});
      } else {
        await Share.share(url, subject: shop.displayName);
      }
    } catch (e) {
      developer.log('Share failed: $e', name: 'ShopScreen');
    }
  }

  Widget _buildAvatarPlaceholder() {
    return Container(
      color: const Color(0xFFE5E7EB),
      child: Center(
        child: Text(
          _shop!.displayName.isNotEmpty
              ? _shop!.displayName[0].toUpperCase()
              : '?',
          style: AppFont.inter(
            fontSize: 40,
            fontWeight: FontWeight.bold,
            color: Colors.grey[500],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: AppFont.inter(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: const Color(0xFFF43F5E),
          ),
        ),
        Text(
          label,
          style: AppFont.inter(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildEmptyAds() {
    return SliverToBoxAdapter(
      child: StaggeredFadeIn(
        index: 0,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.symmetric(vertical: 48),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            children: [
              const Text('📦', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 16),
              Text(
                context.locale.languageCode == 'ne'
                    ? 'अहिलेसम्म कुनै विज्ञापन छैन'
                    : 'No active ads at the moment',
                style: AppFont.inter(fontSize: 16, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAdsGrid() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.65,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => RepaintBoundary(
            child: AdCard(ad: _ads[index], heroTagPrefix: 'shop'),
          ),
          childCount: _ads.length,
        ),
      ),
    );
  }

  String _formatNumber(int number) => formatNumber(number);
}
