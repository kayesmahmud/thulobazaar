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
          icon: 'LayoutDashboard',
          label: 'Dashboard',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          href: `/${lang}/super-admin/ads`,
          icon: 'Megaphone',
          label: 'Ad Management',
          badge: badges?.pendingAds,
        },
        {
          href: `/${lang}/super-admin/dashboard/users-list`,
          icon: 'Users',
          label: 'Users',
        },
        {
          href: `/${lang}/super-admin/editors`,
          icon: 'UserCog',
          label: 'Editor Management',
          badge: badges?.editors,
        },
        {
          href: `/${lang}/super-admin/financial`,
          icon: 'DollarSign',
          label: 'Financial Tracking',
        },
      ],
    },
    {
      title: 'Verification',
      items: [
        {
          href: `/${lang}/super-admin/verifications`,
          icon: 'CheckCircle',
          label: 'Verifications',
          badge: badges?.verifications,
        },
        {
          href: `/${lang}/super-admin/verification-pricing`,
          icon: 'Coins',
          label: 'Verification Pricing',
        },
        {
          href: `/${lang}/super-admin/verification-campaigns`,
          icon: 'Ticket',
          label: 'Verification Campaigns',
        },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          href: `/${lang}/super-admin/announcements`,
          icon: 'Bell',
          label: 'Announcements',
        },
      ],
    },
    {
      title: 'Business',
      items: [
        {
          href: `/${lang}/super-admin/promotion-pricing`,
          icon: 'Star',
          label: 'Promotion Pricing',
        },
        {
          href: `/${lang}/super-admin/promotional-campaigns`,
          icon: 'Gift',
          label: 'Promotional Campaigns',
        },
        {
          href: `/${lang}/super-admin/category-pricing-tiers`,
          icon: 'Layers',
          label: 'Category Pricing Tiers',
        },
        {
          href: `/${lang}/super-admin/analytics`,
          icon: 'TrendingUp',
          label: 'Analytics & Reports',
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          href: `/${lang}/super-admin/super-admins`,
          icon: 'Crown',
          label: 'Super Admins',
        },
        {
          href: `/${lang}/super-admin/system-health`,
          icon: 'Monitor',
          label: 'System Health',
        },
        {
          href: `/${lang}/super-admin/security`,
          icon: 'Shield',
          label: 'Security & Audit',
        },
        {
          href: `/${lang}/super-admin/categories`,
          icon: 'Tag',
          label: 'Categories',
        },
        {
          href: `/${lang}/super-admin/locations`,
          icon: 'MapPin',
          label: 'Locations',
        },
        {
          href: `/${lang}/super-admin/settings`,
          icon: 'Settings',
          label: 'Settings',
        },
      ],
    },
  ];
}
