import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/messages
 * Get user's messages (as buyer or seller)
 *
 * Query params:
 * - type: 'sent' | 'received' (optional, returns all if not specified)
 * - limit: number (default: 50)
 * - page: number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type === 'sent') {
      where.buyer_id = userId;
    } else if (type === 'received') {
      where.seller_id = userId;
    } else {
      // Get both sent and received
      where.OR = [{ buyer_id: userId }, { seller_id: userId }];
    }

    // Get total count
    const total = await prisma.contact_messages.count({ where });

    // Fetch messages with ad details
    const messages = await prisma.contact_messages.findMany({
      where,
      select: {
        id: true,
        ad_id: true,
        buyer_id: true,
        seller_id: true,
        buyer_name: true,
        buyer_email: true,
        buyer_phone: true,
        message: true,
        is_read: true,
        is_reply: true,
        reply_to_message_id: true,
        created_at: true,
        ads: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
            slug: true,
            ad_images: {
              where: { is_primary: true },
              select: {
                file_path: true,
              },
              take: 1,
            },
          },
        },
        users_contact_messages_buyer_idTousers: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
          },
        },
        users_contact_messages_seller_idTousers: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      adId: msg.ad_id,
      buyerId: msg.buyer_id,
      sellerId: msg.seller_id,
      buyerName: msg.buyer_name,
      buyerEmail: msg.buyer_email,
      buyerPhone: msg.buyer_phone,
      message: msg.message,
      isRead: msg.is_read,
      isReply: msg.is_reply,
      replyToMessageId: msg.reply_to_message_id,
      createdAt: msg.created_at,
      ad: {
        id: msg.ads.id,
        title: msg.ads.title,
        price: parseFloat(msg.ads.price.toString()),
        status: msg.ads.status,
        slug: msg.ads.slug,
        primaryImage: msg.ads.ad_images[0]?.file_path || null,
      },
      buyer: {
        id: msg.users_contact_messages_buyer_idTousers.id,
        fullName: msg.users_contact_messages_buyer_idTousers.full_name,
        avatar: msg.users_contact_messages_buyer_idTousers.avatar,
      },
      seller: {
        id: msg.users_contact_messages_seller_idTousers.id,
        fullName: msg.users_contact_messages_seller_idTousers.full_name,
        avatar: msg.users_contact_messages_seller_idTousers.avatar,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedMessages,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Messages fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch messages',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * Send a message to an ad seller
 *
 * Body:
 * - adId: number (required)
 * - message: string (required)
 * - buyerPhone: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const body = await request.json();
    const { adId, message, buyerPhone } = body;

    // Validate required fields
    if (!adId || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ad ID and message are required',
        },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: 'Message must be at least 10 characters long',
        },
        { status: 400 }
      );
    }

    // Get ad details to find seller
    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(adId) },
      select: {
        id: true,
        user_id: true,
        title: true,
        status: true,
      },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      );
    }

    // Prevent users from messaging themselves
    if (ad.user_id === userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'You cannot message yourself',
        },
        { status: 400 }
      );
    }

    // Check if ad is active
    if (ad.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          message: 'This ad is not currently active',
        },
        { status: 400 }
      );
    }

    // Get buyer details
    const buyer = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        full_name: true,
        email: true,
        phone: true,
      },
    });

    if (!buyer) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Create contact message
    const contactMessage = await prisma.contact_messages.create({
      data: {
        ad_id: ad.id,
        buyer_id: userId,
        seller_id: ad.user_id,
        buyer_name: buyer.full_name,
        buyer_email: buyer.email,
        buyer_phone: buyerPhone || buyer.phone || '',
        message: message.trim(),
        is_read: false,
      },
    });

    console.log(
      `✅ Message sent from user ${userId} to seller ${ad.user_id} for ad ${ad.id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        data: {
          id: contactMessage.id,
          adId: contactMessage.ad_id,
          createdAt: contactMessage.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Message send error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send message',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
