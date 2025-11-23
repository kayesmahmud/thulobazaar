/**
 * AD PROMOTION SERVICE
 * ====================
 * Handles activation and management of ad promotions
 */

import { prisma } from '@thulobazaar/database';

/**
 * Activate promotion after successful payment
 */
export async function activatePromotion(
  adId: number,
  userId: number,
  promotionType: 'featured' | 'urgent' | 'sticky',
  durationDays: number,
  amount: number,
  transactionId: string
) {
  return await prisma.$transaction(async (tx) => {
    console.log('🚀 Activating promotion:', {
      adId,
      userId,
      promotionType,
      durationDays,
      amount,
      transactionId,
    });

    // 1. Verify ad exists and belongs to user
    const ad = await tx.ads.findUnique({
      where: { id: adId },
      select: {
        id: true,
        user_id: true,
        title: true,
        status: true,
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.user_id !== userId) {
      throw new Error('Unauthorized: Ad does not belong to user');
    }

    if (ad.status !== 'active' && ad.status !== 'approved') {
      throw new Error('Cannot promote inactive ad');
    }

    // 2. Calculate expiry date
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    // 3. Determine account type
    const user = await tx.users.findUnique({
      where: { id: userId },
      select: {
        individual_verified: true,
        business_verification_status: true,
      },
    });

    let accountType: 'individual' | 'individual_verified' | 'business' = 'individual';
    if (user?.business_verification_status === 'approved') {
      accountType = 'business';
    } else if (user?.individual_verified) {
      accountType = 'individual_verified';
    }

    // 4. Insert into ad_promotions table
    const promotion = await tx.ad_promotions.create({
      data: {
        ad_id: adId,
        user_id: userId,
        promotion_type: promotionType,
        duration_days: durationDays,
        price_paid: amount,
        payment_reference: transactionId,
        account_type: accountType,
        payment_method: 'mock',
        starts_at: startDate,
        expires_at: expiryDate,
        is_active: true,
      },
      select: {
        id: true,
        starts_at: true,
        expires_at: true,
      },
    });

    // 5. Clear ALL promotion flags
    await tx.ads.update({
      where: { id: adId },
      data: {
        is_featured: false,
        featured_until: null,
        is_urgent: false,
        urgent_until: null,
        is_sticky: false,
        sticky_until: null,
      },
    });

    // 6. Deactivate any existing active promotions for this ad
    await tx.ad_promotions.updateMany({
      where: {
        ad_id: adId,
        is_active: true,
        id: { not: promotion.id },
      },
      data: {
        is_active: false,
      },
    });

    // 7. Set the NEW promotion flag
    const updateData: any = {
      promoted_at: new Date(),
    };

    if (promotionType === 'featured') {
      updateData.is_featured = true;
      updateData.featured_until = expiryDate;
    } else if (promotionType === 'urgent') {
      updateData.is_urgent = true;
      updateData.urgent_until = expiryDate;
    } else if (promotionType === 'sticky') {
      updateData.is_sticky = true;
      updateData.sticky_until = expiryDate;
    }

    await tx.ads.update({
      where: { id: adId },
      data: updateData,
    });

    console.log('✅ Promotion activated successfully:', {
      promotionId: promotion.id,
      adId,
      promotionType,
      expiresAt: promotion.expires_at,
    });

    return {
      success: true,
      promotionId: promotion.id,
      adId,
      promotionType,
      durationDays,
      startedAt: promotion.starts_at,
      expiresAt: promotion.expires_at,
      amountPaid: amount,
      transactionId,
    };
  });
}
