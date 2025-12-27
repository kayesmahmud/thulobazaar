/**
 * VERIFICATION CLEANUP JOB
 * ========================
 * Runs periodically to expire verifications that have passed their expiry date.
 * Sets users back to unverified status when their verification period ends.
 */

import cron from 'node-cron';
import { prisma } from '@thulobazaar/database';

/**
 * Expire all business verifications that have passed their expiry date
 */
export async function cleanupExpiredBusinessVerifications(): Promise<{ expired: number }> {
  console.log('🔄 [Cron] Checking for expired business verifications...');

  try {
    const now = new Date();

    // Find all users with expired but still active business verifications
    const expiredUsers = await prisma.users.findMany({
      where: {
        business_verification_status: 'approved',
        business_verification_expires_at: { lt: now },
      },
      select: {
        id: true,
        email: true,
        business_name: true,
        business_verification_expires_at: true,
      },
    });

    if (expiredUsers.length === 0) {
      console.log('✅ [Cron] No expired business verifications found');
      return { expired: 0 };
    }

    console.log(`📊 [Cron] Found ${expiredUsers.length} expired business verifications to process`);

    let expiredCount = 0;

    for (const user of expiredUsers) {
      try {
        // Clear the business verification status
        await prisma.users.update({
          where: { id: user.id },
          data: {
            business_verification_status: 'expired',
            // Keep the expires_at for history, but status shows expired
          },
        });

        expiredCount++;
        console.log(
          `  ✅ Expired business verification for user #${user.id} (${user.email}) - ${user.business_name} (expired: ${user.business_verification_expires_at?.toISOString()})`
        );
      } catch (error) {
        console.error(`  ❌ Failed to expire verification for user #${user.id}:`, error);
      }
    }

    console.log(`🎉 [Cron] Business verification cleanup complete: ${expiredCount}/${expiredUsers.length} verifications expired`);

    return { expired: expiredCount };
  } catch (error) {
    console.error('❌ [Cron] Business verification cleanup failed:', error);
    throw error;
  }
}

/**
 * Expire all individual verifications that have passed their expiry date
 */
export async function cleanupExpiredIndividualVerifications(): Promise<{ expired: number }> {
  console.log('🔄 [Cron] Checking for expired individual verifications...');

  try {
    const now = new Date();

    // Find all users with expired but still active individual verifications
    const expiredUsers = await prisma.users.findMany({
      where: {
        individual_verified: true,
        individual_verification_expires_at: { lt: now },
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        individual_verification_expires_at: true,
      },
    });

    if (expiredUsers.length === 0) {
      console.log('✅ [Cron] No expired individual verifications found');
      return { expired: 0 };
    }

    console.log(`📊 [Cron] Found ${expiredUsers.length} expired individual verifications to process`);

    let expiredCount = 0;

    for (const user of expiredUsers) {
      try {
        // Clear the individual verification status
        await prisma.users.update({
          where: { id: user.id },
          data: {
            individual_verified: false,
            // Keep the expires_at for history
          },
        });

        expiredCount++;
        console.log(
          `  ✅ Expired individual verification for user #${user.id} (${user.email}) - ${user.full_name} (expired: ${user.individual_verification_expires_at?.toISOString()})`
        );
      } catch (error) {
        console.error(`  ❌ Failed to expire verification for user #${user.id}:`, error);
      }
    }

    console.log(`🎉 [Cron] Individual verification cleanup complete: ${expiredCount}/${expiredUsers.length} verifications expired`);

    return { expired: expiredCount };
  } catch (error) {
    console.error('❌ [Cron] Individual verification cleanup failed:', error);
    throw error;
  }
}

/**
 * Run full verification cleanup (both business and individual)
 */
export async function runVerificationCleanup(): Promise<void> {
  const startTime = Date.now();

  try {
    const [businessResult, individualResult] = await Promise.all([
      cleanupExpiredBusinessVerifications(),
      cleanupExpiredIndividualVerifications(),
    ]);

    const duration = Date.now() - startTime;
    console.log(
      `📊 [Cron] Verification cleanup completed in ${duration}ms: ` +
        `${businessResult.expired} business, ` +
        `${individualResult.expired} individual verifications expired`
    );
  } catch (error) {
    console.error('❌ [Cron] Verification cleanup failed:', error);
  }
}

/**
 * Schedule the verification cleanup job
 * Runs every hour at minute 0
 */
export function scheduleVerificationCleanup(): void {
  // Run every hour at minute 0: 0 * * * *
  cron.schedule('0 * * * *', async () => {
    console.log('\n⏰ [Cron] Running scheduled verification cleanup...');
    await runVerificationCleanup();
  });

  console.log('✅ [Cron] Verification cleanup job scheduled (every hour)');

  // Also run immediately on startup (after a short delay)
  setTimeout(async () => {
    console.log('\n🚀 [Cron] Running initial verification cleanup on startup...');
    await runVerificationCleanup();
  }, 10000); // Wait 10 seconds after startup
}
