import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'gate.dart';
import 'tokens.dart';

/// The login gates. Same features as today — only shorter, and on brand.
/// Every gate uses the brand rose. Blue and gold appear ONLY on the
/// verification tier cards, where they carry actual meaning.
enum GateKind { postAd, verification, messages, profile, support, saved, myAds }

class GateScreen extends StatelessWidget {
  final GateKind kind;
  final VoidCallback onSignIn;
  const GateScreen({super.key, required this.kind, required this.onSignIn});

  @override
  Widget build(BuildContext context) {
    switch (kind) {
      case GateKind.postAd:
        return _gate(
          icon: LucideIcons.plusCircle,
          headline: 'Sell it in 2 minutes',
          subhead: 'Free to post. No commission.',
          cta: 'Post free ad',
          bottomNav: true,
          benefits: const [
            GateBenefit(LucideIcons.banknote, 'Free — no fees, no cut'),
            GateBenefit(LucideIcons.mapPin, 'Buyers in all 7 provinces'),
            GateBenefit(LucideIcons.messageCircle, 'Your number stays private'),
          ],
        );

      case GateKind.verification:
        return _gate(
          icon: LucideIcons.badgeCheck,
          headline: 'Get your verified badge',
          subhead: 'Two ways to prove you are real.',
          cta: 'Get verified',
          tiers: const [
            GateTier(
              badge: '🔵',
              title: 'INDIVIDUAL',
              requirement: 'Citizenship, passport or licence',
              detail: '+ a selfie holding it',
              outcome: 'Blue tick on your ads',
              color: Brand.verifiedIndividual,
            ),
            GateTier(
              badge: '⭐',
              title: 'BUSINESS',
              requirement: 'PAN card or business licence',
              detail: 'Name as registered',
              outcome: 'Gold badge on your shop',
              color: Brand.verifiedBusiness,
            ),
          ],
          benefits: const [
            GateBenefit(LucideIcons.clock, 'Reviewed in 24–48 hours'),
          ],
        );

      case GateKind.messages:
        return _gate(
          icon: LucideIcons.messageCircle,
          headline: 'Talk to the seller',
          subhead: 'Ask, offer, agree — in the app.',
          cta: 'Start chatting',
          bottomNav: true,
          benefits: const [
            GateBenefit(LucideIcons.eyeOff, 'Your phone stays hidden'),
            GateBenefit(LucideIcons.image, 'Send photos, check condition'),
            GateBenefit(LucideIcons.bell, 'A push alert on every reply'),
          ],
        );

      case GateKind.profile:
        return _gate(
          icon: LucideIcons.userCircle,
          headline: 'Everything in one place',
          subhead: 'Your ads, saved items and settings.',
          cta: 'Create free account',
          bottomNav: true,
          benefits: const [
            GateBenefit(LucideIcons.layoutList, 'Your ads and saved items'),
            GateBenefit(LucideIcons.badgeCheck, 'Get verified'),
            GateBenefit(LucideIcons.settings, 'Account settings and security'),
          ],
        );

      case GateKind.support:
        return _gate(
          icon: LucideIcons.lifeBuoy,
          headline: 'Real help, in your language',
          subhead: 'Nepali or English.',
          cta: 'Open a ticket',
          benefits: const [
            GateBenefit(LucideIcons.zap, 'A real person, not just a bot'),
            GateBenefit(LucideIcons.list, 'One thread until it is fixed'),
          ],
        );

      case GateKind.saved:
        return _gate(
          icon: LucideIcons.heart,
          headline: "Save it before it's gone",
          subhead: 'We tell you if the price drops.',
          cta: 'Start saving',
          benefits: const [
            GateBenefit(LucideIcons.trendingDown, 'Alerted when the price drops'),
            GateBenefit(LucideIcons.smartphone, 'Opens on any phone you use'),
          ],
        );

      case GateKind.myAds:
        return _gate(
          icon: LucideIcons.layoutList,
          headline: 'Track every ad you post',
          subhead: 'Views, saves and messages.',
          cta: 'Create free account',
          benefits: const [
            GateBenefit(LucideIcons.barChart3, 'See who is looking'),
            GateBenefit(LucideIcons.refreshCw, 'Repost in one tap'),
          ],
        );
    }
  }

  Widget _gate({
    required IconData icon,
    required String headline,
    required String subhead,
    required String cta,
    List<GateBenefit> benefits = const [],
    List<GateTier> tiers = const [],
    bool bottomNav = false,
  }) =>
      GateScaffold(
        accent: GateAccent.brand,
        icon: icon,
        headline: headline,
        subhead: subhead,
        cta: cta,
        secondary: 'I already have an account',
        onCta: onSignIn,
        onSecondary: onSignIn,
        benefits: benefits,
        tiers: tiers,
        showBottomNav: bottomNav,
      );
}
