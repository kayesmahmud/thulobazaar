/**
 * Live state of a verification badge, derived from users.* — the ledger
 * (purchase_history) records the GRANT, but only the users row knows what
 * happened to the badge afterwards. Shared by the verifications list and the
 * customer drill-down so both surfaces classify a badge identically.
 *
 * What the writers leave behind (verified against the code, 2026-09-02):
 *   live      business_verification_status IN ('approved','verified')
 *             ('verified' is a legacy value nothing writes but readers honour)
 *             / individual_verified = true
 *   expired   jobs/verificationCleanup.ts flips the flag ('expired' / false)
 *             but KEEPS the expiry, so the expiry is in the past
 *   revoked   admin/verification/revoke clears the flag AND nulls the expiry;
 *             the reject paths clear the flag ('rejected' / false) and LEAVE
 *             whatever expiry was there (NULL or still in the future)
 *
 * So: not live + expiry in the past => expired (time ran out); not live +
 * expiry NULL or still in the future => revoked (staff took it away before it
 * ran out). A live badge whose clock has run out (cleanup lag) is also expired.
 */

export interface BadgeState {
  revoked: boolean;
  /** NULL for a revoked badge: the revoke route nulls it, and a leftover future
   *  date from a reject would otherwise read as "Active". */
  expiresAt: string | null;
  expired: boolean;
}

export const BUSINESS_LIVE_STATUSES = ['approved', 'verified'];

export const isExpired = (until: Date | null | undefined, now: number): boolean =>
  !!until && until.getTime() <= now;

function classify(live: boolean, flaggedExpired: boolean, expiresAt: Date | null, now: number): BadgeState {
  const expired = flaggedExpired || isExpired(expiresAt, now);
  const revoked = !live && !expired;
  return { revoked, expiresAt: revoked ? null : (expiresAt?.toISOString() ?? null), expired };
}

/** Business badge, from users.business_verification_status / _expires_at. */
export const businessBadgeState = (status: string | null, expiresAt: Date | null, now: number): BadgeState =>
  classify(BUSINESS_LIVE_STATUSES.includes(status ?? ''), status === 'expired', expiresAt, now);

/** Individual badge, from users.individual_verified / _expires_at. */
export const individualBadgeState = (verified: boolean | null, expiresAt: Date | null, now: number): BadgeState =>
  classify(verified === true, false, expiresAt, now);

/**
 * The users row is gone (account deleted), so nothing can have revoked the
 * badge since; the grant-time snapshot expiry is all that is known.
 */
export const snapshotBadgeState = (expiresAt: Date | null, now: number): BadgeState => ({
  revoked: false,
  expiresAt: expiresAt?.toISOString() ?? null,
  expired: isExpired(expiresAt, now),
});

/** An older grant of the same user+kind: a newer row describes the live badge, this one asserts nothing. */
export const SUPERSEDED_BADGE: BadgeState = { revoked: false, expiresAt: null, expired: false };
