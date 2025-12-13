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
 * Fetch all root categories with their subcategories
 * Used by filter components across /ads, /search, and /all-ads pages
 *
 * @returns Array of categories with subcategories
 */
export async function getRootCategoriesWithChildren(): Promise<CategoryWithSubcategories[]> {
  const categories = await prisma.categories.findMany({
    where: { parent_id: null },
    orderBy: { name: 'asc' },
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

  return categories.map((cat) => ({
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
