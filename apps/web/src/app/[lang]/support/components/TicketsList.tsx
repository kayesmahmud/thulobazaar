'use client';

import { formatDistanceToNow } from 'date-fns';
import type { Ticket, TicketDetail } from './types';
import { STATUS_COLORS } from './types';

interface TicketsListProps {
  tickets: Ticket[];
  selectedTicket: TicketDetail | null;
  loading: boolean;
  onSelectTicket: (ticketId: number) => void;
}

export function TicketsList({
  tickets,
  selectedTicket,
  loading,
  onSelectTicket,
}: TicketsListProps) {
  return (
    <div className={`${selectedTicket ? 'hidden lg:block' : ''} lg:w-1/3`}>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Your Tickets</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>No tickets yet</p>
            <p className="text-sm mt-1">Create a new support request to get started</p>
          </div>
        ) : (
          <ul className="divide-y">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[ticket.status] || 'bg-gray-100'}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</h3>
                {ticket.lastMessage && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ticket.lastMessage.content}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
