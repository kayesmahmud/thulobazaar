/**
 * Category-name validation for AI output.
 *
 * The model is asked which category an ad belongs in, and that answer is shown
 * to the seller ("Try this category instead: Mobile Phones"). A raw model
 * string must never reach them: it can name a category that does not exist on
 * Thulo Bazaar, sending the seller hunting through the picker for something
 * they will never find — worse than saying nothing at all.
 *
 * So every suggestion is resolved against the real category tree and dropped
 * unless it matches. The seller only ever sees a name they can actually pick.
 */
import { prisma } from '@thulobazaar/database';

const CATEGORY_NAME_TTL_MS = 5 * 60 * 1000;

let cachedNames: Map<string, string> | null = null;
let cachedAt = 0;

/**
 * Fold a category name to a comparison key, so trivial differences in how the
 * model writes a name don't lose a valid match: case, punctuation, spacing,
 * and "and" vs "&" ("Mobile Phones & Accessories" ≡ "mobile phones and
 * accessories").
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** normalized name → canonical name as stored in the DB. */
async function getCategoryNames(): Promise<Map<string, string>> {
  if (cachedNames && Date.now() - cachedAt < CATEGORY_NAME_TTL_MS) return cachedNames;

  const rows = await prisma.categories.findMany({ select: { name: true } });
  const map = new Map<string, string>();
  for (const row of rows) {
    if (typeof row.name === 'string' && row.name.trim()) {
      map.set(normalize(row.name), row.name);
    }
  }
  cachedNames = map;
  cachedAt = Date.now();
  return map;
}

/**
 * Resolve a model-supplied category name to a real one.
 *
 * Returns the canonical DB spelling on a match, or null — null means the
 * clients simply omit the "try this category" line and show the plain hold
 * reason, which is always safe.
 *
 * Fails closed: any DB trouble yields null rather than leaking the raw string.
 */
export async function matchCategoryName(raw: unknown): Promise<string | null> {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const names = await getCategoryNames();
    return names.get(normalize(raw)) ?? null;
  } catch {
    return null;
  }
}

/** Test seam — drops the cache so a suite can vary the category tree. */
export function resetCategoryNameCache(): void {
  cachedNames = null;
  cachedAt = 0;
}
