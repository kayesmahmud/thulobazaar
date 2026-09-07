import { describe, it, expect } from 'vitest';
import {
  isAccountSuspended,
  maskVerificationColumns,
  publicVerification,
} from '@thulobazaar/types';

const verifiedBusiness = {
  individual_verified: false,
  business_verification_status: 'approved',
  is_suspended: false,
  is_active: true,
};
const verifiedIndividual = {
  individual_verified: true,
  business_verification_status: null,
  is_suspended: false,
  is_active: true,
};

describe('publicVerification', () => {
  it('passes a healthy account’s verification through', () => {
    expect(publicVerification(verifiedBusiness)).toEqual({
      individualVerified: false,
      businessVerificationStatus: 'approved',
    });
    expect(publicVerification(verifiedIndividual)).toEqual({
      individualVerified: true,
      businessVerificationStatus: null,
    });
  });

  it('hides both badges while the account is suspended', () => {
    const hidden = { individualVerified: false, businessVerificationStatus: null };
    expect(publicVerification({ ...verifiedBusiness, is_suspended: true })).toEqual(hidden);
    expect(publicVerification({ ...verifiedIndividual, is_suspended: true })).toEqual(hidden);
  });

  it('hides both badges for a deactivated account (reported shop / deleted)', () => {
    const hidden = { individualVerified: false, businessVerificationStatus: null };
    expect(publicVerification({ ...verifiedBusiness, is_active: false })).toEqual(hidden);
    expect(publicVerification({ ...verifiedIndividual, is_active: false })).toEqual(hidden);
  });

  it('treats a missing user as unverified', () => {
    expect(publicVerification(null)).toEqual({
      individualVerified: false,
      businessVerificationStatus: null,
    });
    expect(isAccountSuspended(undefined)).toBe(false);
  });

  it('does not count rows that never selected the suspension columns as suspended', () => {
    expect(
      publicVerification({ individual_verified: true, business_verification_status: null })
    ).toEqual({ individualVerified: true, businessVerificationStatus: null });
  });

  it('masks the raw columns in place without touching the rest of the row', () => {
    const row = { id: 9, full_name: 'Shop', ...verifiedBusiness, is_suspended: true };
    expect(maskVerificationColumns(row)).toEqual({
      ...row,
      individual_verified: false,
      business_verification_status: null,
    });
    expect(maskVerificationColumns({ id: 9, ...verifiedIndividual })).toMatchObject({
      individual_verified: true,
    });
  });
});
