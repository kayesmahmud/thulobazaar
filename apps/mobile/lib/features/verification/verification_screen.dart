import 'package:flutter/material.dart';
import 'package:mobile/core/widgets/login_gate.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../core/api/auth_client.dart';
import '../../core/api/verification_client.dart';
import '../../core/models/verification_models.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/utils/localized_helpers.dart';
import '../profile/profile_screen.dart';
import 'verification_widgets.dart';
import 'individual_verification_form.dart';
import 'business_verification_form.dart';
import 'widgets/offer_cards.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({Key? key}) : super(key: key);

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final VerificationClient _client = VerificationClient();
  final AuthClient _authClient = AuthClient();

  bool _isLoading = true;
  String? _error;

  // Phone verification
  bool _isPhoneVerified = true; // default true to avoid flash
  String? _phone;

  // Status data
  VerificationStatusResponse? _statusResponse;
  VerificationPricingResponse? _pricing;

  // Inline duration selector state
  String? _selectedType; // 'individual' | 'business' | null
  PricingOption? _selectedDuration;
  // 'free' | 'paid' | null. When eligible-for-free, user picks; otherwise auto-set to 'paid'.
  String? _selectedOffer;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _client.getVerificationStatus(),
        _client.getVerificationPricing(),
        _authClient.getProfile(),
      ]);

      final statusResponse = results[0] as VerificationStatusResponse;
      final pricingResponse = results[1] as VerificationPricingResponse?;
      final profileData = results[2] as Map<String, dynamic>;

      if (!statusResponse.success) {
        throw Exception(statusResponse.error ?? 'Failed to load status');
      }

      _statusResponse = statusResponse;
      _pricing = pricingResponse;

      final profile = profileData['data'];
      if (profile != null) {
        _isPhoneVerified = profile['phoneVerified'] == true;
        _phone = profile['phone'] as String?;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // --- Convenience getters ---
  IndividualVerificationStatus? get _ind =>
      _statusResponse?.individualVerification;
  BusinessVerificationStatus? get _biz => _statusResponse?.businessVerification;

  String get _individualStatus => _ind?.status ?? 'unverified';
  String get _businessStatus => _biz?.status ?? 'unverified';
  String? get _individualRejectionReason => _ind?.request?.rejectionReason;
  String? get _businessRejectionReason => _biz?.request?.rejectionReason;
  int? get _individualDaysRemaining => _ind?.daysRemaining;
  int? get _businessDaysRemaining => _biz?.daysRemaining;
  String? get _individualExpiresAt => _ind?.expiresAt;
  String? get _businessExpiresAt => _biz?.expiresAt;

  void _onCardTap(String type) {
    // Phone verification gate
    if (!_isPhoneVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'कृपया पहिले आफ्नो फोन नम्बर प्रमाणित गर्नुहोस्'
                : 'Please verify your phone number first',
          ),
        ),
      );
      return;
    }

    final status = type == 'individual' ? _individualStatus : _businessStatus;
    final request = type == 'individual' ? _ind?.request : _biz?.request;

    // Verified or pending — no action for this type
    if (status == 'verified' || status == 'pending') return;

    // Block if the OTHER verification type is active or pending
    final otherStatus = type == 'individual'
        ? _businessStatus
        : _individualStatus;
    if (otherStatus == 'verified' || otherStatus == 'pending') {
      final lang = context.locale.languageCode;
      final otherLabel = type == 'individual'
          ? (lang == 'ne' ? 'व्यापार' : 'business')
          : (lang == 'ne' ? 'व्यक्तिगत' : 'individual');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            otherStatus == 'verified'
                ? (lang == 'ne'
                      ? 'तपाईंसँग पहिले नै सक्रिय $otherLabel प्रमाणीकरण छ। कृपया म्याद सकिएपछि आवेदन दिनुहोस्।'
                      : 'You already have an active $otherLabel verification. Wait for it to expire before applying.')
                : (lang == 'ne'
                      ? 'तपाईंसँग पहिले नै लंबित $otherLabel प्रमाणीकरण अनुरोध छ।'
                      : 'You already have a pending $otherLabel verification request.'),
          ),
        ),
      );
      return;
    }

    // Rejected with free resubmission — go straight to form
    if (status == 'rejected' && request?.canResubmitFree == true) {
      _navigateToForm(
        type: type,
        durationDays: request?.durationDays ?? 180,
        price: 0,
        isFree: true,
        isResubmission: true,
      );
      return;
    }

    // Toggle inline picker (offer cards or duration selector)
    setState(() {
      if (_selectedType == type) {
        _selectedType = null;
        _selectedDuration = null;
        _selectedOffer = null;
      } else {
        _selectedType = type;
        _selectedDuration = null;
        // If user is NOT eligible for free, skip OfferCards and go straight to paid duration selector.
        final eligibleForFree =
            _pricing != null &&
            _pricing!.freeVerification.enabled &&
            _pricing!.freeVerification.isEligible &&
            _pricing!.freeVerification.types.contains(type);
        _selectedOffer = eligibleForFree ? null : 'paid';
      }
    });
  }

  void _onSelectFreeOffer() {
    if (_selectedType == null || _pricing == null) return;
    final options = _selectedType == 'individual'
        ? _pricing!.individual
        : _pricing!.business;
    PricingOption? freeOption;
    for (final opt in options) {
      if (opt.durationDays == _pricing!.freeVerification.durationDays) {
        freeOption = opt;
        break;
      }
    }
    if (freeOption == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'निःशुल्क प्रमाणीकरण मूल्य कन्फिगर गरिएको छैन। समर्थनलाई सम्पर्क गर्नुहोस्।'
                : 'Free verification pricing is not configured. Contact support.',
          ),
        ),
      );
      return;
    }
    setState(() {
      _selectedOffer = 'free';
      _selectedDuration = freeOption;
    });
    _navigateToForm(
      type: _selectedType!,
      durationDays: freeOption.durationDays,
      price: 0,
      isFree: true,
      isResubmission: false,
    );
  }

  void _onSelectPaidOffer() {
    setState(() => _selectedOffer = 'paid');
  }

  void _onProceed() {
    if (_selectedType == null || _selectedDuration == null) return;
    final isFree = _selectedDuration!.finalPrice <= 0;
    _navigateToForm(
      type: _selectedType!,
      durationDays: _selectedDuration!.durationDays,
      price: isFree ? 0 : _selectedDuration!.finalPrice,
      isFree: isFree,
      isResubmission: false,
    );
  }

  void _navigateToForm({
    required String type,
    required int durationDays,
    required double price,
    required bool isFree,
    required bool isResubmission,
  }) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => type == 'individual'
            ? IndividualVerificationForm(
                durationDays: durationDays,
                price: price,
                isFreeVerification: isFree,
                isResubmission: isResubmission,
              )
            : BusinessVerificationForm(
                durationDays: durationDays,
                price: price,
                isFreeVerification: isFree,
                isResubmission: isResubmission,
              ),
      ),
    );

    if (result == true) {
      _selectedType = null;
      _selectedDuration = null;
      _selectedOffer = null;
      _loadData();
    }
  }

  // --- Inline duration selector widget ---
  Widget _buildDurationSelector(String type) {
    if (_pricing == null) return const SizedBox.shrink();

    final options = type == 'individual'
        ? _pricing!.individual
        : _pricing!.business;

    if (options.isEmpty) return const SizedBox.shrink();

    return AnimatedSize(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                Expanded(
                  child: Text(
                    context.locale.languageCode == 'ne'
                        ? 'अवधि छान्नुहोस्'
                        : 'Select Duration',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[900],
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() {
                    _selectedType = null;
                    _selectedDuration = null;
                  }),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      LucideIcons.x,
                      size: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
              ],
            ),

            // Campaign discount banner
            if (_pricing?.campaign != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.purple.shade400, Colors.indigo.shade400],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Text(
                      _pricing!.campaign!.bannerEmoji ?? '🎉',
                      style: const TextStyle(fontSize: 24),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_pricing!.campaign!.name} — ${_pricing!.campaign!.discountPercentage.toInt()}% OFF',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            context.locale.languageCode == 'ne'
                                ? '${_pricing!.campaign!.daysRemaining} दिन बाँकी'
                                : '${_pricing!.campaign!.daysRemaining} days left',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // 2-col grid of duration options
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.2,
              ),
              itemCount: options.length,
              itemBuilder: (context, index) {
                final option = options[index];
                final isSelected = _selectedDuration?.id == option.id;
                return _DurationOptionCard(
                  option: option,
                  isSelected: isSelected,
                  hasCampaign: option.hasCampaignDiscount,
                  onTap: () => setState(() => _selectedDuration = option),
                );
              },
            ),

            // Selected summary + Proceed button
            if (_selectedDuration != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.indigo.shade50, Colors.purple.shade50],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            context.locale.languageCode == 'ne'
                                ? 'छानिएको योजना:'
                                : 'Selected Plan:',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${type == 'individual' ? (context.locale.languageCode == 'ne' ? 'व्यक्तिगत' : 'Individual') : (context.locale.languageCode == 'ne' ? 'व्यापार' : 'Business')} — ${_selectedDuration!.durationLabel}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            _selectedDuration!.finalPrice <= 0
                                ? (context.locale.languageCode == 'ne'
                                      ? 'निःशुल्क'
                                      : 'FREE')
                                : formatLocalizedPrice(
                                    _selectedDuration!.finalPrice,
                                    context.locale.languageCode,
                                  ),
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: _selectedDuration!.finalPrice <= 0
                                  ? Colors.green
                                  : Colors.indigo,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: _onProceed,
                      icon: const Icon(LucideIcons.arrowRight, size: 18),
                      label: Text(l('proceed', context.locale.languageCode)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 14,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // --- Detail strips (show below card pair for rejection/expiry info) ---

  List<Widget> _buildDetailStrips() {
    final strips = <Widget>[];

    // Rejection reasons
    final lang = context.locale.languageCode;
    if (_individualStatus == 'rejected' && _individualRejectionReason != null) {
      strips.add(
        _buildRejectionStrip(
          lang == 'ne' ? 'व्यक्तिगत' : 'Individual',
          _individualRejectionReason!,
        ),
      );
    }
    if (_businessStatus == 'rejected' && _businessRejectionReason != null) {
      strips.add(
        _buildRejectionStrip(
          lang == 'ne' ? 'व्यापार' : 'Business',
          _businessRejectionReason!,
        ),
      );
    }

    // Expiry warnings
    if (_individualStatus == 'verified' &&
        (_ind?.isExpiringSoon ?? false) &&
        _individualDaysRemaining != null) {
      strips.add(
        _buildExpiryStrip(
          lang == 'ne' ? 'व्यक्तिगत' : 'Individual',
          _individualDaysRemaining!,
        ),
      );
    }
    if (_businessStatus == 'verified' &&
        (_biz?.isExpiringSoon ?? false) &&
        _businessDaysRemaining != null) {
      strips.add(
        _buildExpiryStrip(
          lang == 'ne' ? 'व्यापार' : 'Business',
          _businessDaysRemaining!,
        ),
      );
    }

    return strips;
  }

  Widget _buildRejectionStrip(String label, String reason) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade100),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.alertCircle, size: 16, color: Colors.red.shade600),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.locale.languageCode == 'ne'
                      ? '$label प्रमाणीकरण अस्वीकृत'
                      : '$label Verification Rejected',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: Colors.red.shade900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  reason,
                  style: TextStyle(fontSize: 12, color: Colors.red.shade700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExpiryStrip(String label, int days) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade200),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.clock, size: 16, color: Colors.amber.shade700),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              context.locale.languageCode == 'ne'
                  ? '$label प्रमाणीकरण $days दिनमा समाप्त हुन्छ'
                  : '$label verification expires in $days days',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.amber.shade800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      return const LoginGateScreen(kind: LoginGateKind.verification);
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          context.locale.languageCode == 'ne' ? 'प्रमाणीकरण' : 'Verification',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildErrorState()
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Phone verification warning
                    if (!_isPhoneVerified) ...[
                      GestureDetector(
                        onTap: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ProfileScreen(),
                            ),
                          );
                          _loadData();
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.orange.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                LucideIcons.smartphone,
                                color: Colors.orange.shade700,
                                size: 22,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      context.locale.languageCode == 'ne'
                                          ? 'फोन प्रमाणीकरण आवश्यक'
                                          : 'Phone Verification Required',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.orange.shade900,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _phone != null
                                          ? (context.locale.languageCode == 'ne'
                                                ? 'तपाईंको फोन $_phone प्रमाणित भएको छैन। प्रमाणित गर्न ट्याप गर्नुहोस्।'
                                                : 'Your phone $_phone is not verified. Tap to verify.')
                                          : (context.locale.languageCode == 'ne'
                                                ? 'प्रमाणीकरणको लागि आफ्नो फोन नम्बर प्रमाणित गर्नुहोस्।'
                                                : 'Verify your phone number to apply for verification.'),
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.orange.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                LucideIcons.arrowRight,
                                color: Colors.orange.shade600,
                                size: 18,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],

                    // Campaign banner (if active)
                    if (_pricing?.campaign != null)
                      CampaignBanner(campaign: _pricing!.campaign!),

                    // Dynamic status banner
                    VerificationStatusBanner(
                      individualStatus: _individualStatus,
                      businessStatus: _businessStatus,
                      individualName: _ind?.fullName,
                      businessName: _biz?.businessName,
                      individualRejectionReason: _individualRejectionReason,
                      businessRejectionReason: _businessRejectionReason,
                      individualCreatedAt: _ind?.request?.createdAt,
                      businessCreatedAt: _biz?.request?.createdAt,
                      individualDaysRemaining: _individualDaysRemaining,
                      businessDaysRemaining: _businessDaysRemaining,
                    ),

                    // Side-by-side verification tiles
                    IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: VerificationStatusCard(
                              type: 'individual',
                              title: context.locale.languageCode == 'ne'
                                  ? 'व्यक्तिगत प्रमाणीकरण'
                                  : 'Individual Verification',
                              subtitle: context.locale.languageCode == 'ne'
                                  ? 'सरकारी परिचयपत्रले आफ्नो व्यक्तिगत पहिचान प्रमाणित गर्नुहोस्'
                                  : 'Verify your personal identity with a government-issued ID',
                              status: _individualStatus,
                              isSelected: _selectedType == 'individual',
                              rejectionReason: _individualRejectionReason,
                              daysRemaining: _individualDaysRemaining,
                              isExpiringSoon: _ind?.isExpiringSoon ?? false,
                              expiresAt: _individualExpiresAt,
                              onTap: () => _onCardTap('individual'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: VerificationStatusCard(
                              type: 'business',
                              title: context.locale.languageCode == 'ne'
                                  ? 'व्यापार प्रमाणीकरण'
                                  : 'Business Verification',
                              subtitle: context.locale.languageCode == 'ne'
                                  ? 'दर्ता कागजातहरूले आफ्नो व्यापार प्रमाणित गर्नुहोस्'
                                  : 'Verify your business with registration documents',
                              status: _businessStatus,
                              isSelected: _selectedType == 'business',
                              rejectionReason: _businessRejectionReason,
                              daysRemaining: _businessDaysRemaining,
                              isExpiringSoon: _biz?.isExpiringSoon ?? false,
                              expiresAt: _businessExpiresAt,
                              onTap: () => _onCardTap('business'),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Detail strips (rejection reasons, expiry warnings)
                    ..._buildDetailStrips(),

                    const SizedBox(height: 12),

                    // Offer Cards (Free + Paid) — eligible first-time users only
                    if (_selectedType != null &&
                        _selectedOffer == null &&
                        _pricing != null &&
                        _pricing!.freeVerification.enabled &&
                        _pricing!.freeVerification.isEligible &&
                        _pricing!.freeVerification.types.contains(
                          _selectedType,
                        ))
                      OfferCards(
                        selectedType: _selectedType!,
                        freeDurationDays:
                            _pricing!.freeVerification.durationDays,
                        onSelectFree: _onSelectFreeOffer,
                        onSelectPaid: _onSelectPaidOffer,
                        onClear: () => setState(() {
                          _selectedType = null;
                          _selectedDuration = null;
                          _selectedOffer = null;
                        }),
                      ),

                    // Duration selector (full width, for selected type — paid path only)
                    if (_selectedType != null && _selectedOffer == 'paid')
                      _buildDurationSelector(_selectedType!),

                    const SizedBox(height: 24),

                    // FAQ Section
                    const FaqSection(),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.alertTriangle,
              size: 48,
              color: Colors.red.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              context.locale.languageCode == 'ne'
                  ? 'प्रमाणीकरण लोड गर्न असफल'
                  : 'Failed to load verification',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error ??
                  (context.locale.languageCode == 'ne'
                      ? 'अज्ञात त्रुटि'
                      : 'Unknown error'),
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _loadData,
              icon: const Icon(LucideIcons.refreshCw),
              label: Text(l('tryAgain', context.locale.languageCode)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// --- Duration Option Card (inlined from duration_selector_sheet.dart) ---

class _DurationOptionCard extends StatelessWidget {
  final PricingOption option;
  final bool isSelected;
  final bool hasCampaign;
  final VoidCallback onTap;

  const _DurationOptionCard({
    required this.option,
    required this.isSelected,
    required this.hasCampaign,
    required this.onTap,
  });

  bool get _isFree => option.finalPrice <= 0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: isSelected
              ? LinearGradient(
                  colors: [Colors.indigo.shade500, Colors.purple.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: isSelected
              ? null
              : hasCampaign
              ? Colors.purple.shade50
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : hasCampaign
                ? Colors.purple.shade300
                : Colors.grey.shade200,
            width: 2,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.indigo.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Stack(
          children: [
            // Badges
            if (_isFree)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.green.shade400, Colors.green.shade600],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne' ? 'निःशुल्क' : 'FREE',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            if (hasCampaign && !_isFree)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.purple.shade400, Colors.indigo.shade600],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne' ? 'प्रोमो' : 'PROMO',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            if (option.durationDays == 180 && !hasCampaign && !_isFree)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.amber.shade400, Colors.orange.shade500],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    context.locale.languageCode == 'ne'
                        ? 'लोकप्रिय'
                        : 'POPULAR',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

            // Content
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    option.durationLabel,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: isSelected ? Colors.white : Colors.grey[900],
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (_isFree) ...[
                    Text(
                      context.locale.languageCode == 'ne' ? 'निःशुल्क' : 'FREE',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : Colors.green,
                      ),
                    ),
                    if (option.price > 0)
                      Text(
                        formatLocalizedPrice(
                          option.price,
                          context.locale.languageCode,
                        ),
                        style: TextStyle(
                          fontSize: 12,
                          decoration: TextDecoration.lineThrough,
                          color: isSelected
                              ? Colors.white60
                              : Colors.grey.shade400,
                        ),
                      ),
                  ] else ...[
                    if (option.discountPercentage > 0) ...[
                      Text(
                        formatLocalizedPrice(
                          option.finalPrice,
                          context.locale.languageCode,
                        ),
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : Colors.indigo,
                        ),
                      ),
                      Text(
                        formatLocalizedPrice(
                          option.price,
                          context.locale.languageCode,
                        ),
                        style: TextStyle(
                          fontSize: 12,
                          decoration: TextDecoration.lineThrough,
                          color: isSelected
                              ? Colors.white60
                              : Colors.grey.shade400,
                        ),
                      ),
                    ] else
                      Text(
                        formatLocalizedPrice(
                          option.price,
                          context.locale.languageCode,
                        ),
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : Colors.indigo,
                        ),
                      ),
                  ],
                  if (option.discountPercentage > 0 && !_isFree) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? Colors.white.withValues(alpha: 0.2)
                            : hasCampaign
                            ? Colors.purple.shade100
                            : Colors.green.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        context.locale.languageCode == 'ne'
                            ? '${option.discountPercentage.toInt()}% बचत'
                            : 'Save ${option.discountPercentage.toInt()}%',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : hasCampaign
                              ? Colors.purple.shade700
                              : Colors.green.shade700,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
