/**
 * ChatWindow Component - 2025 Best Practices
 * Real-time chat interface with typing indicators
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface ChatWindowProps {
  conversation: any;
  messages: any[];
  typingUsers: number[];
  onSendMessage: (content: string) => Promise<void>;
  onStartTyping: () => void;
  onStopTyping: () => void;
  connected: boolean;
  currentUserId?: number;
  onBack?: () => void;
}

export default function ChatWindow({
  conversation,
  messages,
  typingUsers,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  connected,
  currentUserId,
  onBack,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Trigger typing indicator
    onStartTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || sending) return;

    try {
      setSending(true);
      await onSendMessage(inputValue.trim());
      setInputValue('');
      onStopTyping();

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Get other participants (filter out current user)
  const otherParticipants = conversation.participants?.filter(
    (p: any) => p.id !== currentUserId
  ) || [];
  const otherParticipant = otherParticipants[0];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Back button for mobile */}
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
                aria-label="Back to conversations"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* Avatar */}
            {otherParticipant?.avatar ? (
              <img
                src={otherParticipant.avatar.startsWith('http') ? otherParticipant.avatar : `/uploads/avatars/${otherParticipant.avatar}`}
                alt={otherParticipant.fullName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {otherParticipant?.fullName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}

            {/* Name and status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {conversation.title || otherParticipant?.fullName || 'Unknown User'}
              </h3>
              {connected ? (
                <p className="text-xs text-green-600 flex items-center">
                  <span className="h-2 w-2 bg-green-600 rounded-full mr-1"></span>
                  Online
                </p>
              ) : (
                <p className="text-xs text-gray-500">Offline</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Ad info if exists */}
        {conversation.ad_info && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center text-sm">
              <svg className="h-4 w-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="text-blue-900 font-medium">About: {conversation.ad_info.title}</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // ✅ 2025 Best Practice: Use currentUserId prop for comparison
              const isOwnMessage = message.sender?.id === currentUserId;
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.sender?.id !== message.sender?.id);

              return (
                <div
                  key={message.id || index}
                  className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for receiver (left side) */}
                  {showAvatar && !isOwnMessage && (
                    <div className="flex-shrink-0 mr-3">
                      {message.sender?.avatar ? (
                        <img
                          src={message.sender.avatar.startsWith('http') ? message.sender.avatar : `/uploads/avatars/${message.sender.avatar}`}
                          alt={message.sender.fullName}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center ${message.sender?.avatar ? 'hidden' : ''}`}>
                        <span className="text-gray-600 font-medium text-sm">
                          {message.sender?.fullName?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                  )}
                  {!showAvatar && !isOwnMessage && <div className="w-11 flex-shrink-0 mr-3"></div>}

                  {/* Message bubble */}
                  <div className={`flex flex-col max-w-[75%] sm:max-w-xs md:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {/* Sender name (only for received messages) */}
                    {!isOwnMessage && showAvatar && (
                      <span className="text-xs text-gray-600 mb-1 ml-1">{message.sender?.fullName}</span>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2 shadow-sm ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                      }`}
                    >
                      {message.isDeleted ? (
                        <p className="italic text-sm opacity-70">Message deleted</p>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                          {message.isEdited && (
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>(edited)</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className={`text-xs mt-1 px-1 ${isOwnMessage ? 'text-gray-500' : 'text-gray-500'}`}>
                      {message.createdAt ? format(new Date(message.createdAt), 'p') : ''}
                    </p>
                  </div>

                  {/* Spacer for own messages to push them right */}
                  {isOwnMessage && <div className="w-11 ml-3"></div>}
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-3 md:p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2 md:space-x-3">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
            disabled={!connected}
            style={{ maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending || !connected}
            className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm md:text-base"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        {!connected && (
          <p className="mt-2 text-xs text-yellow-600">Reconnecting to server...</p>
        )}
      </div>
    </div>
  );
}
