/**
 * ACCOUNT DELETION CLEANUP UTILITY
 * =================================
 * Permanently deletes user accounts that have been soft-deleted for more than 30 days
 */

import { prisma } from '@thulobazaar/database';

const RECOVERY_PERIOD_DAYS = 30;

interface CleanupResult {
  usersDeleted: number;
  adsDeleted: number;
  imagesDeleted: number;
  messagesDeleted: number;
  favoritesDeleted: number;
  errors: string[];
}

/**
 * Permanently delete user accounts that are past the 30-day recovery period
 * This should be called by a cron job (e.g., daily)
 */
export async function cleanupDeletedAccounts(): Promise<CleanupResult> {
  const result: CleanupResult = {
    usersDeleted: 0,
    adsDeleted: 0,
    imagesDeleted: 0,
    messagesDeleted: 0,
    favoritesDeleted: 0,
    errors: [],
  };

  const now = new Date();
  const cutoffDate = new Date(now.getTime() - RECOVERY_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  try {
    // Find all users past the recovery period
    const usersToDelete = await prisma.users.findMany({
      where: {
        deleted_at: { not: null },
        deletion_requested_at: { lt: cutoffDate },
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        deletion_requested_at: true,
      },
    });

    if (usersToDelete.length === 0) {
      console.log('[Account Cleanup] No accounts to permanently delete');
      return result;
    }

    console.log(`[Account Cleanup] Found ${usersToDelete.length} accounts to permanently delete`);

    for (const user of usersToDelete) {
      try {
        // Delete in correct order to respect foreign key constraints
        await prisma.$transaction(async (tx) => {
          // 1. Delete ad images first
          const adIds = await tx.ads.findMany({
            where: { user_id: user.id },
            select: { id: true },
          });
          const adIdList = adIds.map(a => a.id);

          if (adIdList.length > 0) {
            const deletedImages = await tx.ad_images.deleteMany({
              where: { ad_id: { in: adIdList } },
            });
            result.imagesDeleted += deletedImages.count;
          }

          // 2. Delete ads
          const deletedAds = await tx.ads.deleteMany({
            where: { user_id: user.id },
          });
          result.adsDeleted += deletedAds.count;

          // 3. Delete messages (delete via conversation participants)
          // First find all conversations where user is a participant
          const userConversations = await tx.conversation_participants.findMany({
            where: { user_id: user.id },
            select: { conversation_id: true },
          });
          const conversationIds = userConversations.map(c => c.conversation_id);

          // Delete messages from these conversations
          if (conversationIds.length > 0) {
            const deletedMessages = await tx.messages.deleteMany({
              where: { conversation_id: { in: conversationIds } },
            });
            result.messagesDeleted += deletedMessages.count;

            // Delete conversation participants
            await tx.conversation_participants.deleteMany({
              where: { conversation_id: { in: conversationIds } },
            });

            // Delete conversations
            await tx.conversations.deleteMany({
              where: { id: { in: conversationIds } },
            });
          }

          // 4. Delete favorites (user_favorites)
          const deletedFavorites = await tx.user_favorites.deleteMany({
            where: { user_id: user.id },
          });
          result.favoritesDeleted += deletedFavorites.count;

          // 5. Delete phone OTPs
          await tx.phone_otps.deleteMany({
            where: {
              phone: {
                in: await tx.users.findMany({
                  where: { id: user.id },
                  select: { phone: true },
                }).then(users => users.map(u => u.phone).filter((p): p is string => !!p)),
              },
            },
          });

          // 6. Delete verification requests
          await tx.business_verification_requests.deleteMany({
            where: { user_id: user.id },
          });

          await tx.individual_verification_requests.deleteMany({
            where: { user_id: user.id },
          });

          // 7. Finally, delete the user
          await tx.users.delete({
            where: { id: user.id },
          });

          result.usersDeleted++;
          console.log(`[Account Cleanup] Permanently deleted user ${user.id} (${user.email || user.full_name})`);
        });
      } catch (userError) {
        const errorMsg = `Failed to delete user ${user.id}: ${userError instanceof Error ? userError.message : 'Unknown error'}`;
        console.error(`[Account Cleanup] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log(`[Account Cleanup] Completed. Deleted ${result.usersDeleted} users, ${result.adsDeleted} ads, ${result.imagesDeleted} images`);
    return result;
  } catch (error) {
    const errorMsg = `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[Account Cleanup] ${errorMsg}`);
    result.errors.push(errorMsg);
    return result;
  }
}
