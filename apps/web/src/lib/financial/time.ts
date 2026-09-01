import { Prisma } from '@thulobazaar/database';

/**
 * Nepal-time helpers for financial reporting.
 *
 * Timestamps are stored as naive UTC (@db.Timestamp(6), prod containers run
 * UTC) while the owner reads the reports in Nepal (UTC+5:45, no DST). Month
 * buckets, month filters and displayed dates must all agree on Nepal time,
 * or a purchase at 00:15 NPT on the 1st files under the previous month while
 * its row displays the 1st.
 */

export const NEPAL_TZ = 'Asia/Kathmandu';

/** NPT is UTC+5:45 and has no DST, so a constant offset is exact. */
export const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const COLUMN_PATTERN = /^[a-z_]+(\.[a-z_]+)?$/;

/**
 * SQL fragment yielding the 'YYYY-MM' Nepal calendar month of a naive-UTC
 * timestamp column. `column` is interpolated as an identifier, so it must be
 * a literal you wrote yourself — anything outside the allowed shape throws.
 */
export function nptMonthSql(column: string): Prisma.Sql {
  if (!COLUMN_PATTERN.test(column)) {
    throw new Error(`nptMonthSql: invalid column identifier "${column}"`);
  }
  return Prisma.sql`to_char((${Prisma.raw(column)} AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kathmandu', 'YYYY-MM')`;
}

/**
 * Half-open UTC instants [start, end) covering one Nepal calendar month.
 */
export function nptMonthRange(month: string): { start: Date; end: Date } {
  if (!MONTH_PATTERN.test(month)) {
    throw new Error(`nptMonthRange: invalid month "${month}"`);
  }
  const [yearStr, monthStr] = month.split('-') as [string, string];
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  return {
    start: new Date(Date.UTC(year, monthIndex, 1) - NEPAL_OFFSET_MS),
    end: new Date(Date.UTC(year, monthIndex + 1, 1) - NEPAL_OFFSET_MS),
  };
}
