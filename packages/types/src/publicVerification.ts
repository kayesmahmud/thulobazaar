/**
 * The verification a user is allowed to SHOW, as opposed to the verification
 * they once earned. A suspended or deactivated account keeps its underlying
 * `individual_verified` / `business_verification_status` columns (so the badge
 * comes back untouched on unsuspend), but no public surface — ad cards, ad
 * detail, shop page, profile, search — may present it as verified meanwhile.
 *
 * Every API response that carries verification fields for another user must
 * go through here rather than passing the raw columns along.
 */

export interface VerificationSource {
  individual_verified?: boolean | null;
  business_verification_status?: string | null;
  is_suspended?: boolean | null;
  is_active?: boolean | null;
}

export interface PublicVerification {
  individualVerified: boolean;
  businessVerificationStatus: string | null;
}

/** Suspended by an editor, or deactivated (reported shop / deleted account). */
export function isAccountSuspended(user: VerificationSource | null | undefined): boolean {
  if (!user) return false;
  return user.is_suspended === true || user.is_active === false;
}

export function publicVerification(
  user: VerificationSource | null | undefined
): PublicVerification {
  if (!user || isAccountSuspended(user)) {
    return { individualVerified: false, businessVerificationStatus: null };
  }
  return {
    individualVerified: user.individual_verified === true,
    businessVerificationStatus: user.business_verification_status ?? null,
  };
}

/**
 * The same rule applied in place, snake_case — for a raw DB row that is
 * handed on as-is (e.g. a seller object rendered by a server component).
 */
export function maskVerificationColumns<T extends VerificationSource>(user: T): T {
  const shown = publicVerification(user);
  return {
    ...user,
    individual_verified: shown.individualVerified,
    business_verification_status: shown.businessVerificationStatus,
  } as T;
}
