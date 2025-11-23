/**
 * Shared Editor Navigation Configuration
 * Used across all editor dashboard pages for consistent sidebar navigation
 */

interface BadgeCounts {
  pendingAds?: number;
  reportedAds?: number;
  userReports?: number;
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
          icon: '📊',
          label: 'Dashboard',
        },
      ],
    },
    {
      title: 'Content Management',
      items: [
        {
          href: `/${lang}/editor/ad-management`,
          icon: '📢',
          label: 'Ad Management',
          badge: badgeCounts.pendingAds,
        },
        {
          href: `/${lang}/editor/reported-ads`,
          icon: '🚩',
          label: 'Reported Ads',
          badge: badgeCounts.reportedAds,
        },
      ],
    },
    {
      title: 'User Management',
      items: [
        {
          href: `/${lang}/editor/user-management`,
          icon: '👥',
          label: 'User Management',
        },
        {
          href: `/${lang}/editor/user-reports`,
          icon: '⚠️',
          label: 'User Reports',
          badge: badgeCounts.userReports,
        },
      ],
    },
    {
      title: 'Verification',
      items: [
        {
          href: `/${lang}/editor/verifications`,
          icon: '📋',
          label: 'All Verifications',
        },
        {
          href: `/${lang}/editor/business-verification`,
          icon: '🏢',
          label: 'Business Verification',
          badge: badgeCounts.businessVerifications,
        },
        {
          href: `/${lang}/editor/individual-verification`,
          icon: '🪪',
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
          icon: '💬',
          label: 'Support Chat',
          badge: badgeCounts.supportChat,
        },
        {
          href: `/${lang}/editor/templates`,
          icon: '📄',
          label: 'Response Templates',
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          href: `/${lang}/editor/bulk-actions`,
          icon: '📦',
          label: 'Bulk Actions',
        },
        {
          href: `/${lang}/editor/analytics`,
          icon: '📈',
          label: 'Moderation Analytics',
        },
        {
          href: `/${lang}/editor/audit-logs`,
          icon: '📋',
          label: 'Audit Logs',
        },
      ],
    },
  ];
}
