/**
 * Shared Editor Navigation Configuration
 * Used across all editor dashboard pages for consistent sidebar navigation
 */

interface BadgeCounts {
  pendingAds?: number;
  reportedAds?: number;
  reportedShops?: number;
  businessVerifications?: number;
  individualVerifications?: number;
  supportChat?: number;
}

export function getEditorNavSections(lang: string, badgeCounts: BadgeCounts = {}) {
  return [
    {
      title: 'Overview',
      items: [
        {
          href: `/${lang}/editor/dashboard`,
          icon: 'LayoutDashboard',
          label: 'Dashboard',
        },
      ],
    },
    {
      title: 'Content Management',
      items: [
        {
          href: `/${lang}/editor/ad-management`,
          icon: 'Megaphone',
          label: 'Ad Management',
          badge: badgeCounts.pendingAds,
        },
        {
          href: `/${lang}/editor/reported-ads`,
          icon: 'Flag',
          label: 'Reported Ads',
          badge: badgeCounts.reportedAds,
        },
        {
          href: `/${lang}/editor/reported-shops`,
          icon: 'Store',
          label: 'Reported Shops',
          badge: badgeCounts.reportedShops,
        },
      ],
    },
    {
      title: 'User Management',
      items: [
        {
          href: `/${lang}/editor/user-management`,
          icon: 'Users',
          label: 'User Management',
        },
      ],
    },
    {
      title: 'Verification',
      items: [
        {
          href: `/${lang}/editor/verifications`,
          icon: 'ClipboardList',
          label: 'All Verifications',
        },
        {
          href: `/${lang}/editor/business-verification`,
          icon: 'Building2',
          label: 'Business Verification',
          badge: badgeCounts.businessVerifications,
        },
        {
          href: `/${lang}/editor/individual-verification`,
          icon: 'BadgeCheck',
          label: 'Individual Verification',
          badge: badgeCounts.individualVerifications,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          href: `/${lang}/editor/support-chat`,
          icon: 'MessageCircle',
          label: 'Support Chat',
          badge: badgeCounts.supportChat,
        },
        {
          href: `/${lang}/editor/templates`,
          icon: 'FileText',
          label: 'Response Templates',
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          href: `/${lang}/editor/analytics`,
          icon: 'TrendingUp',
          label: 'Moderation Analytics',
        },
      ],
    },
  ];
}
