import { prisma } from '@thulobazaar/database';

/**
 * Category with subcategories for filter display
 */
export interface CategoryWithSubcategories {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  subcategories: {
    id: number;
    name: string;
    slug: string;
  }[];
}

/**
 * Custom category display order for filter panels
 * Categories not in this list will appear at the end alphabetically
 */
const CATEGORY_DISPLAY_ORDER = [
  'Mobiles',
  'Electronics',
  'Vehicles',
  'Property',
  'Home & Living',
  "Men's Fashion & Grooming",
  "Women's Fashion & Beauty",
  'Hobbies, Sports & Kids',
  'Essentials',
  'Jobs',
  'Overseas Jobs',
  'Pets & Animals',
  'Services',
  'Education',
  'Business & Industry',
];

/**
 * Fetch all root categories with their subcategories
 * Used by filter components across /ads, /search, and /all-ads pages
 *
 * @returns Array of categories with subcategories (sorted by custom order)
 */
export async function getRootCategoriesWithChildren(): Promise<CategoryWithSubcategories[]> {
  const categories = await prisma.categories.findMany({
    where: { parent_id: null },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      other_categories: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Sort categories by custom display order
  const sortedCategories = categories.sort((a, b) => {
    const indexA = CATEGORY_DISPLAY_ORDER.indexOf(a.name);
    const indexB = CATEGORY_DISPLAY_ORDER.indexOf(b.name);

    // If both are in the order list, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one is in the list, it comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // If neither is in the list, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  return sortedCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon || '📁',
    subcategories: cat.other_categories || [],
  }));
}

/**
 * Find a category by its slug (can be parent or subcategory)
 *
 * @param slug - Category slug
 * @returns Category with parent information if it's a subcategory
 */
export async function getCategoryBySlug(slug: string) {
  return await prisma.categories.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      parent_id: true,
      other_categories: {
        select: { id: true },
      },
    },
  });
}

/**
 * Get all subcategory IDs for a parent category
 *
 * @param categoryId - Parent category ID
 * @returns Array of subcategory IDs including the parent
 */
export async function getCategoryIdsIncludingChildren(categoryId: number): Promise<number[]> {
  const category = await prisma.categories.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      parent_id: true,
      other_categories: {
        select: { id: true },
      },
    },
  });

  if (!category) {
    return [];
  }

  // If it's a parent category with children, include all subcategories
  if (category.parent_id === null && category.other_categories?.length > 0) {
    return [categoryId, ...category.other_categories.map((c) => c.id)];
  }

  // If it's a subcategory or parent without children, just return its ID
  return [categoryId];
}
