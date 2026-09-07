'use client';

import { RefObject, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, ImagePlus, X } from 'lucide-react';
import { isImageAttachment } from '@/lib/supportAttachmentDisplay';
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
  profanityWarning?: string | null;
  onDismissProfanityWarning?: () => void;
  /** Object URL of the photo waiting in the composer, if any. */
  pendingImagePreview?: string | null;
  onAttachImage?: (file: File) => void;
  onRemoveImage?: () => void;
  /** Mobile master-detail: return to the ticket list (hidden on lg+). */
  onBack?: () => void;
  /**
   * Live Chat is a rolling conversation with no open/resolved/closed workflow
   * the user ever sees, so its editor view hides the status control.
   */
  showStatusControl?: boolean;
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
  profanityWarning,
  onDismissProfanityWarning,
  pendingImagePreview,
  onAttachImage,
  onRemoveImage,
  onBack,
  showStatusControl = true,
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
        onBack={onBack}
        showStatusControl={showStatusControl}
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

      {/* CSAT Feedback Banner for closed/resolved tickets */}
      {(selectedTicket.status === 'closed' || selectedTicket.status === 'resolved') && (
        <CsatBanner ticket={selectedTicket} />
      )}

      {/* Profanity Warning */}
      {profanityWarning && (
        <div className="bg-red-50 border-t border-red-300 px-4 py-3 flex items-start space-x-3">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{profanityWarning}</p>
            <p className="text-xs text-red-600 mt-1">
              Thulo Bazaar promotes respectful communication between users and customer support team.
            </p>
          </div>
          <button onClick={onDismissProfanityWarning} className="text-red-400 hover:text-red-600 flex-shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Message Input */}
      {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
        <MessageInput
          newMessage={newMessage}
          isInternal={isInternal}
          setIsInternal={setIsInternal}
          sendingMessage={sendingMessage}
          isConnected={isConnected}
          onMessageInputChange={onMessageInputChange}
          onSendMessage={onSendMessage}
          pendingImagePreview={pendingImagePreview}
          onAttachImage={onAttachImage}
          onRemoveImage={onRemoveImage}
        />
      )}
    </div>
  );
}

interface ChatHeaderProps {
  ticket: TicketDetail;
  staffId?: number;
  onUpdateTicket: (updates: { status?: string; priority?: string; assignedTo?: number | null }) => void;
  onBack?: () => void;
  showStatusControl?: boolean;
}

function ChatHeader({ ticket, staffId, onUpdateTicket, onBack, showStatusControl = true }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {/* Back to ticket list — mobile only */}
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden -ml-1 mt-0.5 p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg flex-shrink-0"
              aria-label="Back to tickets"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{ticket.subject}</h3>
            <p className="text-sm text-gray-600 truncate">
              {ticket.user.fullName} • {ticket.user.email}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-gray-500">{ticket.ticketNumber}</div>
        </div>
      </div>
      {ticket.customFields && Object.keys(ticket.customFields).length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {Object.entries(ticket.customFields)
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <span
                key={key}
                className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded"
              >
                {key === 'adLinkOrId' ? 'Ad' : key === 'transactionId' ? 'Transaction' : key}:{' '}
                <span className="font-medium">{value}</span>
              </span>
            ))}
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {showStatusControl && (
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
        )}
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
  const isAgent = message.sender.isStaff || message.isOwnMessage;
  
  return (
    <div className={`mb-4 flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${message.isInternal
          ? 'bg-yellow-100 border border-yellow-300 text-gray-900'
          : isAgent
            ? 'bg-teal-500 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
          }`}
      >
        <div className={`flex items-center gap-2 mb-1 ${isAgent && !message.isInternal ? 'text-teal-50' : ''}`}>
          <span className="text-xs font-semibold opacity-80">{message.sender.fullName}</span>
          {message.sender.isStaff && !message.isOwnMessage && (
            <span className="text-xs bg-black/10 px-1 rounded">Staff</span>
          )}
          {message.isInternal && (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">Internal</span>
          )}
        </div>
        
        {message.attachmentUrl && (
          <div className="mb-2 mt-1">
            {isImageAttachment(message) ? (
              <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-gray-200 hover:opacity-90 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={message.attachmentUrl} alt="Attachment" className="max-w-full h-auto max-h-64 object-cover" />
              </a>
            ) : (
              <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-md hover:opacity-90 transition-opacity border ${isAgent ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`h-10 w-10 rounded flex items-center justify-center ${isAgent ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isAgent ? 'text-white' : 'text-gray-900'}`}>Attachment</p>
                  <p className={`text-xs ${isAgent ? 'text-white/80' : 'text-gray-500'}`}>Click to view</p>
                </div>
              </a>
            )}
          </div>
        )}

        {message.content && <div className="text-sm whitespace-pre-wrap">{message.content}</div>}
        <div className={`text-xs mt-1 ${isAgent && !message.isInternal ? 'text-teal-100' : 'opacity-70'}`}>
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
  pendingImagePreview?: string | null;
  onAttachImage?: (file: File) => void;
  onRemoveImage?: () => void;
}

function CsatBanner({ ticket }: { ticket: TicketDetail }) {
  const hasRating = ticket.csatScore != null;

  return (
    <div className={`px-4 py-3 border-t ${hasRating ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      {hasRating ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${star <= ticket.csatScore! ? 'text-amber-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-medium text-green-800">
            Customer rated {ticket.csatScore}/5
          </span>
          {ticket.csatComment && (
            <span className="text-sm text-gray-600 italic truncate max-w-xs" title={ticket.csatComment}>
              &quot;{ticket.csatComment}&quot;
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Ticket {ticket.status} — awaiting customer feedback</span>
        </div>
      )}
    </div>
  );
}

function MessageInput({
  newMessage,
  isInternal,
  setIsInternal,
  sendingMessage,
  isConnected,
  onMessageInputChange,
  onSendMessage,
  pendingImagePreview,
  onAttachImage,
  onRemoveImage,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasPhoto = !!pendingImagePreview;
  const canSend = (!!newMessage.trim() || hasPhoto) && !sendingMessage;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAttachImage?.(file);
    // Allow re-picking the same file after removing it.
    e.target.value = '';
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      {/* Toggle UI */}
      <div className="flex gap-4 mb-2 px-1">
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
          <input
            type="radio"
            name="messageTypeEditor"
            checked={!isInternal}
            onChange={() => setIsInternal(false)}
            className="sr-only"
          />
          <span className={`px-3 py-1.5 rounded-full font-medium transition-colors ${!isInternal ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>Public Reply</span>
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
          <input
            type="radio"
            name="messageTypeEditor"
            checked={isInternal}
            onChange={() => setIsInternal(true)}
            className="sr-only"
          />
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors ${isInternal ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300' : 'text-gray-500 hover:bg-gray-100'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Internal Note
          </span>
        </label>
      </div>

      {pendingImagePreview && (
        <div className="mb-2 px-1 flex items-center gap-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImagePreview}
              alt="Photo to send"
              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              disabled={sendingMessage}
              aria-label="Remove photo"
              title="Remove photo"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {sendingMessage ? 'Sending photo…' : 'Photo'}
          </span>
        </div>
      )}

      <div className={`flex gap-2 p-2 rounded-xl transition-all
         ${isInternal
          ? 'bg-yellow-50'
          : 'bg-gray-100'
        }`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col justify-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendingMessage || !onAttachImage}
            title="Attach photo"
            aria-label="Attach photo"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImagePlus size={20} />
          </button>
        </div>
        <textarea
          value={newMessage}
          onChange={onMessageInputChange}
          placeholder={isInternal ? 'Add an internal note...' : 'Type your message...'}
          rows={3}
          className="flex-1 px-4 py-2 bg-transparent border-0 focus:ring-0 resize-none text-gray-900 placeholder:text-gray-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSendMessage();
            }
          }}
        />
        <div className="flex flex-col justify-end">
          <button
            onClick={onSendMessage}
            disabled={!canSend}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isInternal
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-teal-600 hover:bg-teal-700'
              }`}
          >
            {sendingMessage ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
