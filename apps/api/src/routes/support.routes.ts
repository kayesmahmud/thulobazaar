import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { censorProfanity } from '../utils/profanityFilter.js';
import { notifyEditors } from '../services/notification.service.js';
// 🔒 API-M4: define staff POSITIVELY. Checking `role === 'user'` treats a null/
// unknown role as staff (IDOR — a user with a null role could read others' tickets
// and internal messages). The canonical list lives in utils/staffRoles (incl. root).
import { isStaffRole } from '../utils/staffRoles.js';
import {
  emitSupportMessage,
  emitTicketCreated,
} from '../services/supportEvents.service.js';
import { queueSupportAiReply } from '../services/supportAi.service.js';
import { uploadMessageImage } from '../middleware/upload.js';
import { optimizeImage } from '../middleware/optimizeImage.js';
import {
  parseSupportMessageInput,
  requireSupportImageQuota,
  supportImageQuotaExceeded,
  supportMessagePreview,
  SUPPORT_IMAGE_LIMIT_CODE,
  SUPPORT_IMAGE_LIMIT_MESSAGE,
} from '../services/supportAttachments.js';

const router = Router();

// Cooldown (minutes) for support-message editor alerts, per editor per ticket,
// so a burst of messages on one ticket doesn't spam every editor's phone.
const SUPPORT_ALERT_COOLDOWN_MINUTES = 2;

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TB-${timestamp}${random}`;
}

function calculateSlaBreach(priority: string): Date {
  const now = new Date();
  switch (priority) {
    case 'urgent':
      now.setHours(now.getHours() + 2);
      break;
    case 'high':
      now.setHours(now.getHours() + 8);
      break;
    case 'normal':
      now.setHours(now.getHours() + 24);
      break;
    case 'low':
    default:
      now.setHours(now.getHours() + 48);
      break;
  }
  return now;
}

// Live Chat is the same support system shown as one rolling conversation.
// Threads stay separate from form-filed tickets via support_tickets.source.
const LIVE_CHAT_SOURCE = 'live_chat';
const LIVE_CHAT_SUBJECT = 'Live Chat';
const LIVE_CHAT_ACTIVE_STATUSES = ['open', 'in_progress', 'waiting_on_user'];

/** The chat the user is currently in, or null when they need a fresh one. */
async function findActiveLiveChat(userId: number) {
  return prisma.support_tickets.findFirst({
    where: {
      user_id: userId,
      source: LIVE_CHAT_SOURCE,
      status: { in: LIVE_CHAT_ACTIVE_STATUSES as any },
    },
    orderBy: { created_at: 'desc' },
    select: { id: true, ticket_number: true, status: true, created_at: true },
  });
}

/**
 * The newest live chat whatever its state, so a finished conversation stays
 * readable instead of vanishing; the next message opens a fresh thread.
 */
async function findLatestLiveChat(userId: number) {
  return prisma.support_tickets.findFirst({
    where: { user_id: userId, source: LIVE_CHAT_SOURCE },
    orderBy: { created_at: 'desc' },
    select: { id: true, ticket_number: true, status: true, created_at: true },
  });
}

const liveChatMessageSelect = {
  id: true,
  sender_id: true,
  content: true,
  type: true,
  attachment_url: true,
  created_at: true,
  users: { select: { id: true, full_name: true, avatar: true, role: true } },
} as const;

function serializeLiveChatMessage(msg: {
  id: number;
  sender_id: number;
  content: string;
  type: string | null;
  attachment_url: string | null;
  created_at: Date | null;
  users: { id: number; full_name: string | null; avatar: string | null; role: string | null };
}, viewerId: number) {
  return {
    id: msg.id,
    senderId: msg.sender_id,
    content: msg.content,
    type: msg.type ?? 'text',
    attachmentUrl: msg.attachment_url,
    createdAt: msg.created_at,
    isOwnMessage: msg.sender_id === viewerId,
    sender: {
      id: msg.users.id,
      fullName: msg.users.full_name,
      avatar: msg.users.avatar,
      isStaff: isStaffRole(msg.users.role),
    },
  };
}

/**
 * GET /api/support/live-chat
 * The user's current live chat with its messages (empty when none yet).
 */
router.get(
  '/live-chat',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const chat = await findLatestLiveChat(userId);

    if (!chat) {
      res.json({
        success: true,
        data: { ticketId: null, status: null, isActive: true, messages: [] },
      });
      return;
    }

    const messages = await prisma.support_messages.findMany({
      where: { ticket_id: chat.id, is_internal: false },
      orderBy: { created_at: 'asc' },
      select: liveChatMessageSelect,
    });

    res.json({
      success: true,
      data: {
        ticketId: chat.id,
        ticketNumber: chat.ticket_number,
        status: chat.status,
        // false once resolved/closed: the transcript stays readable and the
        // next message starts a fresh conversation.
        isActive: LIVE_CHAT_ACTIVE_STATUSES.includes(chat.status ?? ''),
        messages: messages.map((m) => serializeLiveChatMessage(m, userId)),
      },
    });
  })
);

/**
 * POST /api/support/live-chat/messages
 * Send a message; starts a new chat when there is no active one.
 */
router.post(
  '/live-chat/messages',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const parsed = parseSupportMessageInput(req.body);
    if (parsed.ok === false) {
      res.status(400).json({ success: false, message: parsed.message });
      return;
    }
    const input = parsed.value;
    if (input.attachmentUrl && (await supportImageQuotaExceeded(userId))) {
      res.status(429).json({
        success: false,
        code: SUPPORT_IMAGE_LIMIT_CODE,
        message: SUPPORT_IMAGE_LIMIT_MESSAGE,
      });
      return;
    }
    const sanitized = censorProfanity(input.content);

    // One continuous conversation per user: reuse the existing thread even if
    // it was resolved, so the transcript never disappears from the user's
    // screen. Live Chat deliberately shows no status/closed states.
    let chat = await findLatestLiveChat(userId);
    let isNewChat = false;

    if (!chat) {
      const created = await prisma.support_tickets.create({
        data: {
          ticket_number: generateTicketNumber(),
          user_id: userId,
          subject: LIVE_CHAT_SUBJECT,
          category: 'general',
          priority: 'normal',
          source: LIVE_CHAT_SOURCE,
          sla_breach_at: calculateSlaBreach('normal'),
        },
        select: { id: true, ticket_number: true, status: true, created_at: true },
      });
      chat = created;
      isNewChat = true;
    }

    const message = await prisma.support_messages.create({
      data: {
        ticket_id: chat.id,
        sender_id: userId,
        content: sanitized,
        type: input.type,
        attachment_url: input.attachmentUrl,
      },
      select: liveChatMessageSelect,
    });

    // Customer spoke, so the thread is live again — this also reopens a chat
    // an editor or the AI had marked resolved, keeping one endless thread.
    const shouldTransition = chat.status !== 'in_progress';
    await prisma.support_tickets.update({
      where: { id: chat.id },
      data: shouldTransition
        ? { status: 'in_progress', resolved_at: null, closed_at: null, updated_at: new Date() }
        : { updated_at: new Date() },
    });
    const currentStatus = shouldTransition ? 'in_progress' : chat.status;

    const payload = serializeLiveChatMessage(message, userId);
    const preview = supportMessagePreview(sanitized, input.attachmentUrl);
    emitSupportMessage(chat.id, { ...payload, isInternal: false }, currentStatus);
    if (isNewChat) {
      emitTicketCreated({
        id: chat.id,
        ticketNumber: chat.ticket_number,
        subject: LIVE_CHAT_SUBJECT,
        category: 'general',
        priority: 'normal',
        status: currentStatus,
        createdAt: chat.created_at,
      });
    }

    notifyEditors({
      type: 'support_message',
      title: isNewChat ? 'New live chat' : 'New live chat message',
      body: preview.slice(0, 140),
      data: { route: '/editor/live-chat', ticketId: String(chat.id) },
      referenceId: chat.id,
      cooldownMinutes: SUPPORT_ALERT_COOLDOWN_MINUTES,
    }).catch((err) => console.error('Live chat editor notification error:', err));

    queueSupportAiReply(chat.id);

    res.status(201).json({
      success: true,
      data: { ticketId: chat.id, status: currentStatus, message: payload },
    });
  })
);

/**
 * GET /api/support/tickets
 * List user's support tickets
 */
router.get(
  '/tickets',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
    const offset = parseInt(req.query.offset as string || '0', 10);
    const status = req.query.status as string | undefined;

    // Live Chat has its own screen; its threads must not clutter the ticket list.
    const where: any = { user_id: userId, source: { not: LIVE_CHAT_SOURCE } };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.support_tickets.findMany({
        where,
        select: {
          id: true,
          ticket_number: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          created_at: true,
          updated_at: true,
          sla_breach_at: true,
          support_messages: {
            // Owner-only route: an internal staff note must never become the
            // customer's list preview.
            where: { is_internal: false },
            select: {
              id: true,
              content: true,
              attachment_url: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.support_tickets.count({ where }),
    ]);

    const data = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticket_number,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      slaBreachAt: t.sla_breach_at,
      lastMessage: t.support_messages[0]
        ? {
            content: supportMessagePreview(
              t.support_messages[0].content,
              t.support_messages[0].attachment_url
            ).substring(0, 100),
            createdAt: t.support_messages[0].created_at,
          }
        : null,
    }));

    res.json({
      success: true,
      data,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  })
);

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
router.post(
  '/tickets',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { subject, category = 'general', priority = 'normal', message, customFields } = req.body;

    if (!subject?.trim()) {
      res.status(400).json({ success: false, message: 'Subject is required' });
      return;
    }

    if (!message?.trim()) {
      res.status(400).json({ success: false, message: 'Initial message is required' });
      return;
    }

    const ticket = await prisma.support_tickets.create({
      data: {
        ticket_number: generateTicketNumber(),
        user_id: userId,
        subject: subject.trim(),
        category,
        priority,
        custom_fields: customFields || null,
        sla_breach_at: calculateSlaBreach(priority),
        support_messages: {
          create: {
            sender_id: userId,
            content: censorProfanity(message.trim()),
            type: 'text',
          },
        },
      },
      select: {
        id: true,
        ticket_number: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        created_at: true,
        sla_breach_at: true,
      },
    });

    // Notify editors of a new support ticket (editor APK push + desktop bell)
    notifyEditors({
      type: 'support_message',
      title: `New support ticket: ${ticket.subject}`.slice(0, 120),
      body: message.trim().slice(0, 140),
      data: { route: '/editor/support-chat', ticketId: String(ticket.id) },
      referenceId: ticket.id,
      cooldownMinutes: SUPPORT_ALERT_COOLDOWN_MINUTES,
    }).catch((err) => console.error('Support ticket editor notification error:', err));

    // Real-time insert into the staff queue + let the AI assistant take the
    // first look. Both fire-and-forget — ticket creation never waits on them.
    emitTicketCreated({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.created_at,
    });
    queueSupportAiReply(ticket.id);

    res.status(201).json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.created_at,
        slaBreachAt: ticket.sla_breach_at,
      },
    });
  })
);

/**
 * GET /api/support/tickets/:id
 * Get ticket detail with messages
 */
router.get(
  '/tickets/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const ticketId = parseInt(req.params.id as string, 10);

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticket_number: true,
        user_id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        created_at: true,
        updated_at: true,
        resolved_at: true,
        closed_at: true,
        sla_breach_at: true,
        csat_score: true,
        csat_comment: true,
        custom_fields: true,
        support_messages: {
          select: {
            id: true,
            sender_id: true,
            content: true,
            type: true,
            attachment_url: true,
            is_internal: true,
            created_at: true,
            users: {
              select: {
                id: true,
                full_name: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const isStaff = isStaffRole(userRole);
    if (ticket.user_id !== userId && !isStaff) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Filter out internal messages for regular users
    const messages = ticket.support_messages
      .filter((msg) => isStaff || !msg.is_internal)
      .map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        content: msg.content,
        type: msg.type,
        attachmentUrl: msg.attachment_url,
        createdAt: msg.created_at,
        sender: {
          id: msg.users.id,
          fullName: msg.users.full_name,
          avatar: msg.users.avatar,
          isStaff: msg.users.role !== 'user',
        },
        isOwnMessage: msg.sender_id === userId,
      }));

    // Fetch user context if requester is staff
    let userContext = null;
    if (isStaff && ticket.user_id) {
      const ticketUser = await prisma.users.findUnique({
        where: { id: ticket.user_id },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          created_at: true,
          identity_verified: true,
          business_verified: true,
          ads: {
            where: { status: 'active' },
            select: { id: true, title: true, price: true, created_at: true },
            orderBy: { created_at: 'desc' },
            take: 5,
          },
        },
      });

      if (ticketUser) {
        userContext = {
          id: ticketUser.id,
          fullName: ticketUser.full_name,
          email: ticketUser.email,
          phone: ticketUser.phone,
          joinedAt: ticketUser.created_at,
          identityVerified: ticketUser.identity_verified,
          businessVerified: ticketUser.business_verified,
          activeAds: ticketUser.ads,
        };
      }
    }

    res.json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
        closedAt: ticket.closed_at,
        slaBreachAt: ticket.sla_breach_at,
        csatScore: ticket.csat_score,
        csatComment: ticket.csat_comment,
        customFields: ticket.custom_fields,
        messages,
        userContext,
      },
    });
  })
);

/**
 * POST /api/support/tickets/:id/messages
 * Send a message to a ticket
 */
router.post(
  '/tickets/:id/messages',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const ticketId = parseInt(req.params.id as string, 10);

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const parsed = parseSupportMessageInput(req.body);
    if (parsed.ok === false) {
      res.status(400).json({ success: false, message: parsed.message });
      return;
    }
    const input = parsed.value;

    // Verify ticket ownership
    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
      select: { id: true, user_id: true, status: true },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (ticket.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (input.attachmentUrl && (await supportImageQuotaExceeded(userId))) {
      res.status(429).json({
        success: false,
        code: SUPPORT_IMAGE_LIMIT_CODE,
        message: SUPPORT_IMAGE_LIMIT_MESSAGE,
      });
      return;
    }

    const message = await prisma.support_messages.create({
      data: {
        ticket_id: ticketId,
        sender_id: userId,
        content: censorProfanity(input.content),
        type: input.type,
        attachment_url: input.attachmentUrl,
      },
      select: {
        id: true,
        sender_id: true,
        content: true,
        type: true,
        attachment_url: true,
        created_at: true,
        users: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Update ticket status and timestamp
    const shouldTransition = ticket.status === 'waiting_on_user' || ticket.status === 'open';
    await prisma.support_tickets.update({
      where: { id: ticketId },
      data: shouldTransition
        ? { status: 'in_progress', updated_at: new Date() }
        : { updated_at: new Date() },
    });
    const currentStatus = shouldTransition ? 'in_progress' : ticket.status;

    // Real-time delivery to anyone viewing the ticket (this REST path is how
    // mobile customers reply — without this, editors only saw it on reload).
    emitSupportMessage(
      ticketId,
      {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        type: message.type,
        attachmentUrl: message.attachment_url,
        isInternal: false,
        createdAt: message.created_at,
        sender: {
          id: message.users.id,
          fullName: message.users.full_name,
          avatar: message.users.avatar,
          isStaff: message.users.role !== 'user',
        },
      },
      currentStatus
    );

    // This route is owner-only (403 above), so every message here is from a
    // customer → notify editors (editor APK push + desktop bell)
    notifyEditors({
      type: 'support_message',
      title: 'New support reply',
      body: supportMessagePreview(message.content, message.attachment_url).slice(0, 140),
      data: { route: '/editor/support-chat', ticketId: String(ticketId) },
      referenceId: ticketId,
      cooldownMinutes: SUPPORT_ALERT_COOLDOWN_MINUTES,
    }).catch((err) => console.error('Support message editor notification error:', err));

    // Let the AI assistant answer (no-op unless ai_support_enabled).
    queueSupportAiReply(ticketId);

    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        type: message.type,
        attachmentUrl: message.attachment_url,
        createdAt: message.created_at,
        sender: {
          id: message.users.id,
          fullName: message.users.full_name,
          avatar: message.users.avatar,
          isStaff: message.users.role !== 'user',
        },
        isOwnMessage: true,
      },
    });
  })
);

/**
 * POST /api/support/upload
 * Upload a photo for a support conversation (Live Chat or ticket). Reuses the
 * chat image pipeline (5 MB, images only, resized + AVIF), but sits behind the
 * support photo cap so a sender who is out of budget is told before the file
 * leaves their phone.
 */
router.post(
  '/upload',
  authenticateToken,
  requireSupportImageQuota,
  uploadMessageImage.single('image'),
  optimizeImage('message'),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    res.json({
      success: true,
      data: {
        url: `/uploads/messages/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  })
);

/**
 * POST /api/support/tickets/:id/csat
 * Submit a customer satisfaction rating for a resolved ticket
 */
router.post(
  '/tickets/:id/csat',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const ticketId = parseInt(req.params.id as string, 10);
    const { score, comment } = req.body;

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    if (score < 1 || score > 5) {
      res.status(400).json({ success: false, message: 'Score must be between 1 and 5' });
      return;
    }

    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
      select: { user_id: true, status: true, csat_score: true },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (ticket.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      res.status(400).json({ success: false, message: 'Ticket must be resolved to leave a rating' });
      return;
    }

    if (ticket.csat_score !== null) {
      res.status(400).json({ success: false, message: 'A rating has already been submitted for this ticket' });
      return;
    }

    await prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        csat_score: score,
        csat_comment: comment?.trim() || null,
      },
    });

    res.json({ success: true, message: 'Rating submitted successfully' });
  })
);

/**
 * GET /api/support/macros
 * Fetch available support macros for staff
 */
router.get(
  '/macros',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    // Basic permissions check for staff roles (🔒 API-M4: positive staff check)
    if (!isStaffRole(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Visibility rule (unified with the editor Templates manager): every editor
    // sees GLOBAL templates plus their own PRIVATE ones. Most-used first.
    const macros = await prisma.support_macros.findMany({
      where: {
        is_active: true,
        OR: [{ visibility: 'global' }, { created_by: req.user!.userId }],
      },
      orderBy: [{ usage_count: 'desc' }, { title: 'asc' }],
    });

    res.json({ success: true, data: macros });
  })
);

/**
 * POST /api/support/macros
 * Create a new support macro
 */
router.post(
  '/macros',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    // 🔒 API-M4: positive staff check
    if (!isStaffRole(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const { title, content } = req.body;

    if (!title?.trim() || !content?.trim()) {
      res.status(400).json({ success: false, message: 'Title and content are required' });
      return;
    }

    const macro = await prisma.support_macros.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        created_by: req.user!.userId,
      },
    });

    res.status(201).json({ success: true, data: macro });
  })
);

export default router;
