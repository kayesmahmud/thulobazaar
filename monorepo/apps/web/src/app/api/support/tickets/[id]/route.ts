/**
 * Individual Support Ticket API
 * GET /api/support/tickets/:id - Get ticket details with messages
 * PATCH /api/support/tickets/:id - Update ticket (status, priority, assignment)
 * POST /api/support/tickets/:id - Send a message to the ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET - Get ticket details with messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const ticketId = parseInt(id);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    // Check if user is editor/admin
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isStaff = user?.role === 'editor' || user?.role === 'super_admin' || user?.role === 'root';

    // Fetch ticket
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
        users_support_tickets_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        users_support_tickets_assigned_toTousers: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
          },
        },
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
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check access: user can only see their own tickets, staff can see all
    if (!isStaff && ticket.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Filter internal messages for non-staff
    const messages = ticket.support_messages
      .filter((msg) => isStaff || !msg.is_internal)
      .map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        content: msg.content,
        type: msg.type,
        attachmentUrl: msg.attachment_url,
        isInternal: msg.is_internal,
        createdAt: msg.created_at,
        sender: {
          id: msg.users.id,
          fullName: msg.users.full_name,
          avatar: msg.users.avatar,
          isStaff: msg.users.role !== 'user',
        },
        isOwnMessage: msg.sender_id === userId,
      }));

    return NextResponse.json({
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
        user: {
          id: ticket.users_support_tickets_user_idTousers.id,
          fullName: ticket.users_support_tickets_user_idTousers.full_name,
          email: ticket.users_support_tickets_user_idTousers.email,
          avatar: ticket.users_support_tickets_user_idTousers.avatar,
          phone: ticket.users_support_tickets_user_idTousers.phone,
        },
        assignedTo: ticket.users_support_tickets_assigned_toTousers
          ? {
              id: ticket.users_support_tickets_assigned_toTousers.id,
              fullName: ticket.users_support_tickets_assigned_toTousers.full_name,
              avatar: ticket.users_support_tickets_assigned_toTousers.avatar,
            }
          : null,
        messages,
        isStaff,
      },
    });
  } catch (error: unknown) {
    console.error('Ticket fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update ticket (status, priority, assignment)
 * Only staff can update tickets
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const ticketId = parseInt(id);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    // Check if user is staff
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isStaff = user?.role === 'editor' || user?.role === 'super_admin' || user?.role === 'root';

    if (!isStaff) {
      return NextResponse.json(
        { success: false, message: 'Only staff can update tickets' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, priority, assignedTo } = body;

    const updateData: any = {
      updated_at: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolved_at = new Date();
      } else if (status === 'closed') {
        updateData.closed_at = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (assignedTo !== undefined) {
      updateData.assigned_to = assignedTo || null;
    }

    const ticket = await prisma.support_tickets.update({
      where: { id: ticketId },
      data: updateData,
      select: {
        id: true,
        ticket_number: true,
        status: true,
        priority: true,
        assigned_to: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assigned_to,
        updatedAt: ticket.updated_at,
      },
      message: 'Ticket updated successfully',
    });
  } catch (error: unknown) {
    console.error('Ticket update error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

/**
 * POST - Send a message to the ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const ticketId = parseInt(id);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, type = 'text', attachmentUrl, isInternal = false } = body;

    if (!content && !attachmentUrl) {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this ticket
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isStaff = user?.role === 'editor' || user?.role === 'super_admin' || user?.role === 'root';

    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
      select: { id: true, user_id: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check access
    if (!isStaff && ticket.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Non-staff cannot send internal messages
    const actualIsInternal = isStaff ? isInternal : false;

    // Create message
    const message = await prisma.support_messages.create({
      data: {
        ticket_id: ticketId,
        sender_id: userId,
        content: content?.trim() || '',
        type,
        attachment_url: attachmentUrl || null,
        is_internal: actualIsInternal,
      },
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
    });

    // Update ticket status if needed
    const newStatus = isStaff ? 'waiting_on_user' : 'in_progress';
    if (ticket.status === 'open' || (isStaff && ticket.status === 'in_progress') || (!isStaff && ticket.status === 'waiting_on_user')) {
      await prisma.support_tickets.update({
        where: { id: ticketId },
        data: {
          status: newStatus,
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          senderId: message.sender_id,
          content: message.content,
          type: message.type,
          attachmentUrl: message.attachment_url,
          isInternal: message.is_internal,
          createdAt: message.created_at,
          sender: {
            id: message.users.id,
            fullName: message.users.full_name,
            avatar: message.users.avatar,
            isStaff: message.users.role !== 'user',
          },
          isOwnMessage: true,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Message send error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
