'use client';

import { RefObject } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { TicketDetail, TicketMessage } from './types';

interface ChatAreaProps {
  selectedTicket: TicketDetail | null;
  isConnected: boolean;
  isOtherTyping: boolean;
  typingUserName: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  newMessage: string;
  isInternal: boolean;
  setIsInternal: (value: boolean) => void;
  sendingMessage: boolean;
  staffId?: number;
  onUpdateTicket: (updates: { status?: string; priority?: string; assignedTo?: number | null }) => void;
  onMessageInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
}

export function ChatArea({
  selectedTicket,
  isConnected,
  isOtherTyping,
  typingUserName,
  messagesEndRef,
  newMessage,
  isInternal,
  setIsInternal,
  sendingMessage,
  staffId,
  onUpdateTicket,
  onMessageInputChange,
  onSendMessage,
}: ChatAreaProps) {
  if (!selectedTicket) {
    return (
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[500px]">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">Select a ticket to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Chat Header */}
      <ChatHeader
        ticket={selectedTicket}
        staffId={staffId}
        onUpdateTicket={onUpdateTicket}
      />

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 min-h-[400px] max-h-[500px]">
        {selectedTicket.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {isOtherTyping && typingUserName && <TypingIndicator userName={typingUserName} />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Connection status indicator */}
      {!isConnected && <ConnectionWarning />}

      {/* Message Input */}
      {selectedTicket.status !== 'closed' && (
        <MessageInput
          newMessage={newMessage}
          isInternal={isInternal}
          setIsInternal={setIsInternal}
          sendingMessage={sendingMessage}
          isConnected={isConnected}
          onMessageInputChange={onMessageInputChange}
          onSendMessage={onSendMessage}
        />
      )}
    </div>
  );
}

interface ChatHeaderProps {
  ticket: TicketDetail;
  staffId?: number;
  onUpdateTicket: (updates: { status?: string; priority?: string; assignedTo?: number | null }) => void;
}

function ChatHeader({ ticket, staffId, onUpdateTicket }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
          <p className="text-sm text-gray-600">
            {ticket.user.fullName} • {ticket.user.email}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{ticket.ticketNumber}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={ticket.status}
          onChange={(e) => onUpdateTicket({ status: e.target.value })}
          className="text-xs px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_on_user">Waiting on User</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={ticket.priority}
          onChange={(e) => onUpdateTicket({ priority: e.target.value })}
          className="text-xs px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        {ticket.assignedTo ? (
          <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
            Assigned: {ticket.assignedTo.fullName}
          </span>
        ) : (
          <button
            onClick={() => onUpdateTicket({ assignedTo: staffId })}
            className="text-xs bg-teal-100 text-teal-800 px-3 py-1 rounded-full hover:bg-teal-200"
          >
            Assign to Me
          </button>
        )}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: TicketMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`mb-4 flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          message.isInternal
            ? 'bg-yellow-100 border border-yellow-300 text-gray-900'
            : message.isOwnMessage
            ? 'bg-teal-500 text-white'
            : message.sender.isStaff
            ? 'bg-blue-100 text-gray-900'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold opacity-80">{message.sender.fullName}</span>
          {message.sender.isStaff && (
            <span className="text-xs bg-blue-200 text-blue-800 px-1 rounded">Staff</span>
          )}
          {message.isInternal && (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">Internal</span>
          )}
        </div>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div className="text-xs mt-1 opacity-70">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

interface TypingIndicatorProps {
  userName: string;
}

function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-200 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{userName} is typing</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionWarning() {
  return (
    <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 flex items-center gap-2 text-sm text-yellow-700">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>Connecting to real-time updates...</span>
    </div>
  );
}

interface MessageInputProps {
  newMessage: string;
  isInternal: boolean;
  setIsInternal: (value: boolean) => void;
  sendingMessage: boolean;
  isConnected: boolean;
  onMessageInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
}

function MessageInput({
  newMessage,
  isInternal,
  setIsInternal,
  sendingMessage,
  isConnected,
  onMessageInputChange,
  onSendMessage,
}: MessageInputProps) {
  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          Internal Note (not visible to user)
        </label>
        {isConnected && (
          <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Live
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={onMessageInputChange}
          placeholder={isInternal ? 'Add internal note...' : 'Type your message...'}
          rows={3}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
        />
        <button
          onClick={onSendMessage}
          disabled={!newMessage.trim() || sendingMessage}
          className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingMessage ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
