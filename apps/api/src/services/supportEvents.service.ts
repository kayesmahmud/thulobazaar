/**
 * Support event fan-out — the one place that turns "something happened on a
 * support ticket" into socket broadcasts and owner notifications, no matter
 * which entry point recorded it (Express REST, Express socket, or the Next.js
 * routes via the /api/internal/support-event bridge).
 *
 * Internal notes are staff-only: emitSupportMessage routes them to the
 * 'support:staff' room instead of the per-ticket room, which the customer is
 * also in.
 */
import { prisma } from '@thulobazaar/database';
import { getIO } from '../socket/index.js';
import { sendNotification, canSendNotification } from './notification.service.js';
import { supportMessagePreview } from './supportAttachments.js';

// Bilingual copy for owner pushes — old app builds show these verbatim.
export const SUPPORT_REPLY_PUSH_TITLE = 'Support replied / सपोर्टको जवाफ आयो';
export const SUPPORT_RESOLVED_PUSH_TITLE = 'Ticket resolved / टिकट समाधान भयो';
export const SUPPORT_RESOLVED_PUSH_BODY =
  'Your support ticket has been resolved. Open it to rate your experience. ' +
  'तपाईंको सपोर्ट टिकट समाधान भयो — कृपया आफ्नो अनुभव मूल्याङ्कन गर्नुहोस्।';

export interface SupportMessagePayload {
  id: number;
  senderId: number;
  content: string;
  type: string | null;
  attachmentUrl: string | null;
  isInternal: boolean;
  createdAt: Date | null;
  sender: {
    id: number;
    fullName: string | null;
    avatar: string | null;
    isStaff: boolean;
  };
}

/**
 * Load a stored support message and shape it exactly like the socket handler's
 * live payload, so bridge-delivered messages look identical to socket ones.
 */
export async function buildSupportMessagePayload(
  messageId: number
): Promise<SupportMessagePayload | null> {
  const message = await prisma.support_messages.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      sender_id: true,
      content: true,
      type: true,
      attachment_url: true,
      is_internal: true,
      created_at: true,
      users: {
        select: { id: true, full_name: true, avatar: true, role: true },
      },
    },
  });
  if (!message) return null;
  return {
    id: message.id,
    senderId: message.sender_id,
    content: message.content,
    type: message.type,
    attachmentUrl: message.attachment_url,
    isInternal: message.is_internal ?? false,
    createdAt: message.created_at,
    sender: {
      id: message.users.id,
      fullName: message.users.full_name,
      avatar: message.users.avatar,
      isStaff: message.users.role !== 'user',
    },
  };
}

/**
 * Broadcast a new support message. Public messages go to the per-ticket room
 * (customer + any staff viewing); internal notes go to staff only. The staff
 * queue always gets a ticket-updated with a leak-safe preview.
 *
 * `currentStatus` must be the status actually in effect AFTER any transition —
 * emitting the wished-for status when the guarded update did not run makes
 * clients show a state the DB does not have.
 */
export function emitSupportMessage(
  ticketId: number,
  message: SupportMessagePayload,
  currentStatus?: string | null
): void {
  const io = getIO();
  if (!io) return;

  const event = { ticketId, message, newStatus: currentStatus ?? undefined };
  if (message.isInternal) {
    io.to('support:staff').emit('support:message-new', event);
  } else {
    io.to(`support:${ticketId}`).emit('support:message-new', event);
  }

  io.to('support:staff').emit('support:ticket-updated', {
    ticketId,
    ...(currentStatus ? { status: currentStatus } : {}),
    lastMessage: {
      content: message.isInternal
        ? '[Internal note]'
        : supportMessagePreview(message.content, message.attachmentUrl).substring(0, 100),
      createdAt: message.createdAt,
    },
  });
}

/** Tell the staff queue a brand-new ticket exists (real-time list insert). */
export function emitTicketCreated(ticket: {
  id: number;
  ticketNumber: string;
  subject: string;
  category: string | null;
  priority: string | null;
  status: string | null;
  createdAt: Date | null;
}): void {
  const io = getIO();
  if (!io) return;
  io.to('support:staff').emit('support:ticket-created', ticket);
}

/** Broadcast a status/priority/assignment change to the ticket room + staff queue. */
export function emitTicketUpdate(payload: {
  ticketId: number;
  ticketNumber?: string;
  status?: string | null;
  priority?: string | null;
  assignedTo?: { id: number; fullName: string | null; avatar: string | null } | null;
  updatedAt?: Date | null;
}): void {
  const io = getIO();
  if (!io) return;
  io.to(`support:${payload.ticketId}`).emit('support:ticket-status-changed', payload);
  io.to('support:staff').emit('support:ticket-updated', payload);
}

/**
 * Push + bell + in-app row for the ticket OWNER — staff and AI replies were
 * previously invisible to customers unless they had the page open on a socket.
 * Type 'support_reply' is transactional: deliberately NOT in the engagement
 * frequency-cap allowlist in notificationPolicy.ts.
 */
export async function notifyTicketOwner(params: {
  ticketId: number;
  ownerUserId: number;
  title: string;
  body: string;
  cooldownMinutes?: number;
  /** '/support' (ticket) or '/live-chat'; clients route the tap on this. */
  route?: string;
}): Promise<void> {
  const { ticketId, ownerUserId, title, body, cooldownMinutes, route } = params;
  if (
    cooldownMinutes &&
    !(await canSendNotification(ownerUserId, 'support_reply', ticketId, cooldownMinutes))
  ) {
    return;
  }
  await sendNotification({
    recipientUserIds: [ownerUserId],
    type: 'support_reply',
    title,
    body,
    data: { route: route ?? '/support', ticketId: String(ticketId) },
    referenceId: ticketId,
  });
}
