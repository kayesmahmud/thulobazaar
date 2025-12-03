/**
 * Shared Super Admin Navigation Configuration
 *
 * This file provides a standardized navigation structure for all super-admin pages
 * to ensure consistency across the dashboard.
 */

export interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Get standardized super-admin navigation sections
 *
 * @param lang - Language code for URL generation
 * @param badges - Optional badges for navigation items (e.g., pending counts)
 * @returns Array of navigation sections
 */
export function getSuperAdminNavSections(
  lang: string,
  badges?: {
    pendingAds?: number;
    editors?: number;
    verifications?: number;
  }
): NavSection[] {
  return [
    {
      title: 'Main',
      items: [
        {
          href: `/${lang}/super-admin/dashboard`,
          icon: '📊',
          label: 'Dashboard',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          href: `/${lang}/super-admin/ads`,
          icon: '📢',
          label: 'Ad Management',
          badge: badges?.pendingAds,
        },
        {
          href: `/${lang}/super-admin/editors`,
          icon: '👨‍💼',
          label: 'Editor Management',
          badge: badges?.editors,
        },
        {
          href: `/${lang}/super-admin/financial`,
          icon: '💸',
          label: 'Financial Tracking',
        },
      ],
    },
    {
      title: 'Verification',
      items: [
        {
          href: `/${lang}/super-admin/verifications`,
          icon: '✓',
          label: 'Verifications',
          badge: badges?.verifications,
        },
        {
          href: `/${lang}/super-admin/verification-pricing`,
          icon: '💰',
          label: 'Verification Pricing',
        },
      ],
    },
    {
      title: 'Business',
      items: [
        {
          href: `/${lang}/super-admin/promotion-pricing`,
          icon: '⭐',
          label: 'Promotion Pricing',
        },
        {
          href: `/${lang}/super-admin/analytics`,
          icon: '📈',
          label: 'Analytics & Reports',
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          href: `/${lang}/super-admin/super-admins`,
          icon: '👑',
          label: 'Super Admins',
        },
        {
          href: `/${lang}/super-admin/system-health`,
          icon: '🖥️',
          label: 'System Health',
        },
        {
          href: `/${lang}/super-admin/security`,
          icon: '🛡️',
          label: 'Security & Audit',
        },
        {
          href: `/${lang}/super-admin/categories`,
          icon: '🏷️',
          label: 'Categories',
        },
        {
          href: `/${lang}/super-admin/locations`,
          icon: '📍',
          label: 'Locations',
        },
        {
          href: `/${lang}/super-admin/settings`,
          icon: '⚙️',
          label: 'Settings',
        },
      ],
    },
  ];
}
