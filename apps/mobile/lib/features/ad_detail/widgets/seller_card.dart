import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/utils/page_transitions.dart';
import 'package:mobile/features/shop/shop_screen.dart';

class SellerCard extends StatelessWidget {
  final AdWithDetails ad;

  const SellerCard({super.key, required this.ad});

  @override
  Widget build(BuildContext context) {
    bool isBusiness =
        ad.businessVerificationStatus == 'verified' ||
        ad.businessVerificationStatus == 'approved';
    bool isVerified = isBusiness || ad.individualVerified == true;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          FadeScaleRoute(
            builder: (_) => ShopScreen(shopSlug: ad.effectiveShopSlug),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isBusiness
                      ? const Color(0xFFFBBF24)
                      : isVerified
                      ? const Color(0xFF3B82F6)
                      : Colors.grey[300]!,
                  width: isBusiness || isVerified ? 3 : 1,
                ),
              ),
              child: CircleAvatar(
                radius: 26,
                backgroundImage: ad.userAvatar != null
                    ? CachedNetworkImageProvider(
                        ApiConfig.getAvatarUrl(ad.userAvatar),
                      )
                    : null,
                backgroundColor: Colors.grey[200],
                child: ad.userAvatar == null
                    ? const Icon(LucideIcons.user, color: Colors.grey)
                    : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          ad.userName ??
                              (context.locale.languageCode == 'ne'
                                  ? "विक्रेता"
                                  : "Seller"),
                          style: AppFont.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF1F2937),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isVerified) ...[
                        const SizedBox(width: 4),
                        Image.asset(
                          isBusiness
                              ? 'assets/images/golden-badge.png'
                              : 'assets/images/blue-badge.png',
                          width: 16,
                          height: 16,
                        ),
                      ],
                    ],
                  ),
                  Text(
                    isBusiness
                        ? (context.locale.languageCode == 'ne'
                              ? "प्रमाणित व्यापार खाता"
                              : "Verified Business Account")
                        : isVerified
                        ? (context.locale.languageCode == 'ne'
                              ? "प्रमाणित व्यक्तिगत विक्रेता"
                              : "Verified Individual Seller")
                        : (context.locale.languageCode == 'ne'
                              ? "विक्रेता"
                              : "Seller"),
                    style: AppFont.inter(
                      fontSize: 12,
                      color: const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, color: Colors.grey[400], size: 24),
          ],
        ),
      ),
    );
  }
}
