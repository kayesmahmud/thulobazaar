'use client';

import { RefObject, useRef, useState, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Paperclip, Smile, Send, Image as ImageIcon, FileText, X, Check, CheckCheck, Star } from 'lucide-react';
import type { TicketDetail, TicketMessage } from './types';
import { STATUS_COLORS, PRIORITY_COLORS } from './types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { isImageAttachment } from '@/lib/supportAttachmentDisplay';

interface TicketChatProps {
  selectedTicket: TicketDetail | null;
  isConnected: boolean;
  isOtherTyping: boolean;
  typingUser: string | null;
  messageInput: string;
  sendingMessage: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onFileUpload: (file: File) => Promise<void>;
  sendingFile: boolean;
  isInternal: boolean;
  setIsInternal: (isInternal: boolean) => void;
  macros?: { id: number; title: string; content: string; }[];
  onSubmitCsat?: (score: number, comment: string) => Promise<void>;
  profanityWarning?: string | null;
  onDismissProfanityWarning?: () => void;
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
  onFileUpload,
  sendingFile,
  isInternal,
  setIsInternal,
  macros = [],
  onSubmitCsat,
  profanityWarning,
  onDismissProfanityWarning,
}: TicketChatProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMacrosMenu, setShowMacrosMenu] = useState(false);

  // CSAT state
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [csatComment, setCsatComment] = useState('');
  const [submittingCsat, setSubmittingCsat] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageInput]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertMacro = (content: string) => {
    const input = textareaRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = messageInput;
      const newVal = text.substring(0, start) + content + text.substring(end);

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, newVal);
        const ev = new Event('input', { bubbles: true });
        input.dispatchEvent(ev);
      }
      setShowMacrosMenu(false);
      input.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e);
    }
  };

  const handleCsatSubmit = async () => {
    if (!onSubmitCsat || selectedStar === 0) return;
    setSubmittingCsat(true);
    await onSubmitCsat(selectedStar, csatComment);
    setSubmittingCsat(false);
  };

  if (!selectedTicket) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[400px] bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center p-8">
          <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
            <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Select a Conversation</h3>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto">Choose a ticket from the list or create a new one.</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = selectedTicket.messages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, TicketMessage[]>);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Ticket Header */}
      <div className="px-6 py-4 border-b bg-white z-10 sticky top-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative">
            {selectedTicket.assignedTo ? (
              <UserAvatar
                src={selectedTicket.assignedTo.avatar}
                name={selectedTicket.assignedTo.fullName}
                size="md"
                showBorder={false}
                className="bg-blue-100 text-blue-600"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            {/* Online Status Dot (Mock) */}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400"></span>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 leading-tight">{selectedTicket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 font-mono">#{selectedTicket.ticketNumber}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wide ${STATUS_COLORS[selectedTicket.status]}`}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#efe7dd]/30"> {/* Subtle background tint */}
        {Object.entries(groupedMessages).map(([dateKey, messages]) => {
          const date = new Date(dateKey);
          let dateLabel = format(date, 'MMMM d, yyyy');
          if (isToday(date)) dateLabel = 'Today';
          if (isYesterday(date)) dateLabel = 'Yesterday';

          return (
            <div key={dateKey} className="space-y-4">
              <div className="flex justify-center sticky top-2 z-0">
                <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-gray-200">
                  {dateLabel}
                </span>
              </div>

              {messages.map((message, index) => {
                const isSequence = index > 0 && messages[index - 1]?.senderId === message.senderId;
                const showAvatar = !message.isOwnMessage && !isSequence;
                const isSystem = message.type === 'system';

                if (isSystem) {
                  return (
                    <div key={message.id} className="flex justify-center my-2">
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded italic">
                        {message.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'} ${isSequence ? 'mt-1' : 'mt-4'} group`}
                  >
                    {!message.isOwnMessage && (
                      <div className="w-8 flex-shrink-0 mr-2 flex flex-col justify-end">
                        {showAvatar ? (
                          <UserAvatar
                            src={message.sender.avatar}
                            name={message.sender.fullName}
                            size="sm"
                            showBorder={false}
                            className="shadow-sm"
                          />
                        ) : <div className="w-8" />}
                      </div>
                    )}

                    <div className={`max-w-[70%] sm:max-w-[60%] shadow-sm relative ${message.isOwnMessage
                      ? 'bg-rose-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' // Primary Rose
                      : 'bg-white rounded-r-2xl rounded-tl-2xl rounded-bl-md border border-gray-100'
                      } px-4 py-2.5 text-sm`}>

                      {!message.isOwnMessage && !isSequence && (
                        <p className={`text-xs font-bold mb-1 ${message.sender.isStaff ? 'text-rose-600' : 'text-gray-600'}`}>
                          {message.sender.fullName}
                        </p>
                      )}

                      {message.attachmentUrl && (
                        <div className="mb-2">
                          {isImageAttachment(message) ? (
                            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-gray-200 hover:opacity-90 transition-opacity">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={message.attachmentUrl} alt="Attachment" className="max-w-full h-auto max-h-64 object-cover" />
                            </a>
                          ) : (
                            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-md hover:opacity-90 transition-opacity border ${message.isOwnMessage ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'}`}>
                              <div className={`h-10 w-10 rounded flex items-center justify-center ${message.isOwnMessage ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <FileText size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${message.isOwnMessage ? 'text-white' : 'text-gray-900'}`}>Attachment</p>
                                <p className={`text-xs ${message.isOwnMessage ? 'text-white/80' : 'text-gray-500'}`}>Click to view</p>
                              </div>
                            </a>
                          )}
                        </div>
                      )}

                      {message.content && (
                        <p className={`whitespace-pre-wrap leading-relaxed break-words ${message.isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
                          {message.content}
                        </p>
                      )}

                      <div className={`flex items-center justify-end gap-1 mt-1 ${message.isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                        <span className="text-[10px]">
                          {format(new Date(message.createdAt), 'h:mm a')}
                        </span>
                        {message.isOwnMessage && (
                          // Mock read receipts
                          true ? <CheckCheck size={14} className="text-white" /> : <Check size={14} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isOtherTyping && typingUser && (
          <div className="flex justify-start mt-4">
            <div className="w-8 mr-2" />
            <div className="bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm flex items-center gap-1.5 h-10">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        {/* CSAT Survey / Rating View */}
        {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
          <div className="mt-8 flex justify-center">
            <div className="bg-white border text-center p-6 rounded-xl shadow-sm max-w-md w-full border-gray-200">
              {selectedTicket.csatScore ? (
                <>
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCheck size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Feedback Received</h3>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={`${star <= selectedTicket.csatScore! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  {selectedTicket.csatComment && (
                    <p className="text-sm text-gray-500 italic mt-2">"{selectedTicket.csatComment}"</p>
                  )}
                  <p className="text-sm text-gray-500 mt-3 pt-3 border-t">Thank you for helping us improve!</p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-gray-900 text-lg">How did we do?</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">Please rate your support experience.</p>
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setSelectedStar(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={32}
                          className={`${(hoveredStar || selectedStar) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors duration-150`}
                        />
                      </button>
                    ))}
                  </div>
                  
                  {selectedStar > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                      <textarea
                        value={csatComment}
                        onChange={(e) => setCsatComment(e.target.value)}
                        placeholder="Tell us more about your experience (optional)..."
                        className="w-full text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-3 mb-3"
                        rows={3}
                      />
                      <button
                        onClick={handleCsatSubmit}
                        disabled={submittingCsat}
                        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {submittingCsat ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="px-4 py-1.5 bg-yellow-50 border-t border-yellow-200 flex items-center justify-center gap-2 text-xs text-yellow-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          Reconnecting to chat...
        </div>
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
      {selectedTicket.status !== 'closed' ? (
        <form onSubmit={onSendMessage} className="p-3 bg-gray-50 border-t border-gray-200">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />

          {/* Staff-only: the server forces isInternal=false for customers, so
              showing them a lock-badged "Internal Note" option promised a
              privacy it never had. */}
          {selectedTicket.isStaff && (
            <div className="flex gap-4 mb-2 px-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="radio"
                  name="messageType"
                  checked={!isInternal}
                  onChange={() => setIsInternal(false)}
                  className="sr-only"
                />
                <span className={`px-3 py-1.5 rounded-full font-medium transition-colors ${!isInternal ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>Public Reply</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="radio"
                  name="messageType"
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
          )}

          <div className={`flex items-end gap-2 p-2 rounded-xl border shadow-sm transition-all
            ${isInternal
              ? 'bg-yellow-50/50 border-yellow-200 focus-within:ring-2 focus-within:ring-yellow-500/20 focus-within:border-yellow-400'
              : 'bg-white border-gray-200 focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400'
            }`}>
            <div className="flex pb-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  // Simple Emoji Logic (could be a picker)
                  // For now, toggle a simple emoji bar or just insert a smiley
                  const emoji = "😊";
                  const input = textareaRef.current;
                  if (input) {
                    const start = input.selectionStart;
                    const end = input.selectionEnd;
                    const text = messageInput;
                    const newVal = text.substring(0, start) + emoji + text.substring(end);

                    // Create a synthetic event
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                    if (nativeInputValueSetter) {
                      nativeInputValueSetter.call(input, newVal);
                      const ev = new Event('input', { bubbles: true });
                      input.dispatchEvent(ev);
                    }
                  }
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                title="Add Emoji"
              >
                <Smile size={20} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative"
                title="Attach photo"
                aria-label="Attach photo"
              >
                <Paperclip size={20} />
                {sendingFile && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>
                )}
              </button>
              
              {/* Macros Dropdown */}
              {macros.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMacrosMenu(!showMacrosMenu)}
                    className={`p-2 rounded-full transition-colors ${showMacrosMenu ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Insert Macro"
                  >
                    <FileText size={20} />
                  </button>

                  {showMacrosMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 shadow-lg rounded-lg max-h-60 overflow-y-auto z-50">
                      <div className="p-2 border-b border-gray-100 bg-gray-50 top-0 sticky z-10">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Replies</span>
                      </div>
                      <div className="p-1">
                        {macros.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => insertMacro(m.content)}
                            className="w-full text-left p-2 hover:bg-indigo-50 rounded-md transition-colors group"
                          >
                            <div className="font-medium text-sm text-gray-900 group-hover:text-indigo-700 truncate">{m.title}</div>
                            <div className="text-xs text-gray-500 truncate mt-0.5">{m.content}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={messageInput}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isInternal ? "Add an internal note..." : "Type your message..."}
              rows={1}
              className="flex-1 py-2.5 px-2 bg-transparent border-0 focus:ring-0 resize-none text-gray-900 placeholder-gray-400 max-h-32 text-sm leading-6"
            />

            <button
              type="submit"
              disabled={!messageInput.trim() || sendingMessage || sendingFile}
              className={`p-2.5 mb-0.5 text-white rounded-lg disabled:opacity-50 transition-transform active:scale-95 shadow-md ${isInternal
                  ? 'bg-yellow-600 hover:bg-yellow-700 disabled:hover:bg-yellow-600'
                  : 'bg-gray-900 hover:bg-gray-800 disabled:hover:bg-gray-900'
                }`}
            >
              {sendingMessage ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      ) : (
        <div className="p-6 text-center bg-gray-50 border-t text-sm text-gray-500">
          This ticket has been closed. You cannot send further messages.
        </div>
      )}
    </div>
  );
}
