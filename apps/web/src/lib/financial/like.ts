/**
 * Escape a user-supplied string for use inside a LIKE / ILIKE pattern.
 *
 * Postgres treats `%` and `_` as wildcards and `\` as the escape character,
 * so a search for "50%" would otherwise match everything starting with "50".
 * Prisma's `contains` does NOT escape these either, so raw and non-raw
 * search paths both need this.
 */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, match => `\\${match}`);
}
