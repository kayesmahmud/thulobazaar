import { prisma } from '@thulobazaar/database';

/**
 * User IDs to leave out of every financial report (test/demo accounts).
 *
 * Stored in site_settings under `financial_excluded_user_ids` as a
 * comma-separated list so the owner can change it without a deploy — test
 * accounts are indistinguishable from real users in the schema (no is_test
 * flag), and one of them can single-handedly double the reported revenue.
 *
 * Absent or unparseable setting => exclude nothing.
 */
export const EXCLUDED_USER_IDS_SETTING = 'financial_excluded_user_ids';

export async function getExcludedUserIds(): Promise<number[]> {
  try {
    const row = await prisma.site_settings.findUnique({
      where: { setting_key: EXCLUDED_USER_IDS_SETTING },
      select: { setting_value: true },
    });
    if (!row?.setting_value) return [];

    return row.setting_value
      .split(',')
      .map(part => parseInt(part.trim(), 10))
      .filter(id => Number.isInteger(id) && id > 0);
  } catch (error) {
    console.error('[financial] Failed to read excluded user ids:', error);
    return [];
  }
}
