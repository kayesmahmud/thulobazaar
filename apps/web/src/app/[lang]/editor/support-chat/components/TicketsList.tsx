'use client';

import { formatDistanceToNow } from 'date-fns';
import type { SupportTicket, TicketDetail } from './types';
import { STATUS_BADGES, PRIORITY_BADGES, CATEGORY_ICONS } from './types';

interface TicketsListProps {
  tickets: SupportTicket[];
  selectedTicket: TicketDetail | null;
  loading: boolean;
  onSelectTicket: (ticket: SupportTicket) => void;
}

export function TicketsList({ tickets, selectedTicket, loading, onSelectTicket }: TicketsListProps) {
  return (
    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-bold text-gray-900">Tickets ({tickets.length})</h3>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>No tickets found</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketItem
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedTicket?.id === ticket.id}
              onClick={() => onSelectTicket(ticket)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TicketItemProps {
  ticket: SupportTicket;
  isSelected: boolean;
  onClick: () => void;
}

function TicketItem({ ticket, isSelected, onClick }: TicketItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{CATEGORY_ICONS[ticket.category] || '💬'}</span>
          <div>
            <div className="font-semibold text-gray-900 text-sm line-clamp-1">{ticket.subject}</div>
            <div className="text-xs text-gray-500">{ticket.ticketNumber}</div>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-600 mb-2">{ticket.user.fullName}</div>
      {ticket.lastMessage && (
        <div className="text-xs text-gray-500 mb-2 line-clamp-2">{ticket.lastMessage.content}</div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${STATUS_BADGES[ticket.status]}`}>
          {ticket.status.replace(/_/g, ' ')}
        </span>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${PRIORITY_BADGES[ticket.priority]}`}>
          {ticket.priority}
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
