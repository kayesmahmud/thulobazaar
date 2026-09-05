import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: { findUnique: vi.fn(), update: vi.fn() },
  },
  Prisma: { DbNull: null },
}));

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,stub') },
}));

import { prisma } from '@thulobazaar/database';
import { setup2FA, disable2FA } from '../../services/auth.service.js';

const users = prisma.users as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

/** A row where the flag is set but no secret was ever stored. Sign-in gates on
    `two_factor_enabled && two_factor_secret`, so such an account has no usable
    second factor — it must not be treated as protected. */
const inconsistentRow = {
  id: 4,
  phone: '9706666096',
  email: null,
  two_factor_enabled: true,
  two_factor_secret: null,
  password_hash: 'hash',
};

describe('2FA with an inconsistent row (flag set, no secret)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    users.update.mockResolvedValue({});
  });

  it('lets the owner start a fresh setup instead of dead-ending them', async () => {
    users.findUnique.mockResolvedValue(inconsistentRow);

    const result = await setup2FA(4);

    // The old guard rejected on the flag alone, which was a deadlock: setup
    // refused because the flag was set, and disable refused because there was
    // no secret to verify against.
    expect(result.success).toBe(true);
    expect(result.secret).toBeTruthy();
  });

  it('clears the stale flag while storing the new secret, healing the row', async () => {
    users.findUnique.mockResolvedValue(inconsistentRow);

    await setup2FA(4);

    expect(users.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 4 },
        data: expect.objectContaining({ two_factor_enabled: false }),
      })
    );
  });

  it('still refuses a fresh setup when 2FA is genuinely usable', async () => {
    users.findUnique.mockResolvedValue({
      ...inconsistentRow,
      two_factor_secret: 'REALSECRET',
    });

    const result = await setup2FA(4);

    expect(result.success).toBe(false);
    expect(users.update).not.toHaveBeenCalled();
  });

  it('never lets a password alone disable 2FA on such a row', async () => {
    users.findUnique.mockResolvedValue(inconsistentRow);

    const result = await disable2FA(4, 'correct-password', '000000');

    // Password-alone disabling would be a second-factor bypass, so this stays
    // refused even though the row is broken — setup is the way out.
    expect(result.success).toBe(false);
    expect(users.update).not.toHaveBeenCalled();
  });
});
