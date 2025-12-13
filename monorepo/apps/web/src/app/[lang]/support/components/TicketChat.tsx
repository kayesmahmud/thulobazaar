'use client';

import { RefObject } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { TicketDetail } from './types';
import { STATUS_COLORS, PRIORITY_COLORS } from './types';

interface TicketChatProps {
  selectedTicket: TicketDetail | null;
  isConnected: boolean;
  isOtherTyping: boolean;
  typingUser: string | null;
  messageInput: string;
  sendingMessage: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export function TicketChat({
  selectedTicket,
  isConnected,
  isOtherTyping,
  typingUser,
  messageInput,
  sendingMessage,
  messagesEndRef,
  onClose,
  onInputChange,
  onSendMessage,
}: TicketChatProps) {
  if (!selectedTicket) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[400px]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-lg font-medium">Select a ticket</p>
          <p className="text-sm mt-1">Choose a ticket from the list or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Ticket Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-500">{selectedTicket.ticketNumber}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[selectedTicket.status]}`}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                {selectedTicket.priority}
              </span>
            </div>
            <h2 className="font-semibold text-gray-900">{selectedTicket.subject}</h2>
          </div>
        </div>
        {selectedTicket.assignedTo && (
          <div className="text-right text-sm">
            <p className="text-gray-500">Assigned to</p>
            <p className="font-medium">{selectedTicket.assignedTo.fullName}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[400px] max-h-[60vh]">
        {selectedTicket.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${message.isOwnMessage ? 'order-2' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                {!message.isOwnMessage && (
                  <span className={`text-sm font-medium ${message.sender.isStaff ? 'text-blue-600' : 'text-gray-700'}`}>
                    {message.sender.fullName}
                    {message.sender.isStaff && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded">Staff</span>
                    )}
                  </span>
                )}
              </div>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : message.sender.isStaff
                    ? 'bg-blue-100 text-gray-900'
                    : 'bg-white text-gray-900 border'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className={`text-xs mt-1 ${message.isOwnMessage ? 'text-right' : ''} text-gray-500`}>
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isOtherTyping && typingUser && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{typingUser} is typing</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 flex items-center gap-2 text-sm text-yellow-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Connecting to real-time updates...</span>
        </div>
      )}

      {/* Message Input */}
      {selectedTicket.status !== 'closed' && (
        <form onSubmit={onSendMessage} className="p-4 border-t">
          <div className="flex gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={onInputChange}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || sendingMessage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
