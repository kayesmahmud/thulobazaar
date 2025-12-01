/**
 * ChatWindow Component - 2025 Best Practices
 * Real-time chat interface with typing indicators and image support
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

// Constants for image upload
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ChatWindowProps {
  conversation: any;
  messages: any[];
  typingUsers: number[];
  onSendMessage: (content: string, type?: string, attachmentUrl?: string) => Promise<void>;
  onStartTyping: () => void;
  onStopTyping: () => void;
  connected: boolean;
  currentUserId?: number;
  onBack?: () => void;
  token?: string; // For image upload authentication
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
  token,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Image must be under 5MB');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('conversationId', conversation.id.toString());

    try {
      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasText = inputValue.trim();
    const hasImage = selectedImage;

    if (!hasText && !hasImage) return;
    if (sending) return;

    try {
      setSending(true);
      setUploadProgress(hasImage ? true : false);

      // If there's an image, upload it first
      if (hasImage && selectedImage) {
        const imageUrl = await uploadImage(selectedImage);
        if (imageUrl) {
          // Send image message
          await onSendMessage(hasText || '', 'image', imageUrl);
        }
        clearSelectedImage();
      } else if (hasText) {
        // Send text message
        await onSendMessage(hasText, 'text');
      }

      setInputValue('');
      onStopTyping();

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setUploadError(error.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploadProgress(false);
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

  // Helper to check if message is an image
  const isImageMessage = (message: any) => {
    return message.type === 'image' && (message.attachmentUrl || message.attachment_url);
  };

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
              {/* Only show online status when real-time messaging is enabled */}
              {connected && (
                <p className="text-xs text-green-600 flex items-center">
                  <span className="h-2 w-2 bg-green-600 rounded-full mr-1"></span>
                  Online
                </p>
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
        {conversation.ad && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center text-sm">
              <svg className="h-4 w-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="text-blue-900 font-medium">About: {conversation.ad.title}</span>
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
              // Use currentUserId prop for comparison
              const isOwnMessage = message.sender?.id === currentUserId;
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.sender?.id !== message.sender?.id);
              const imageUrl = message.attachmentUrl || message.attachment_url;

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

                    {/* Message content */}
                    {message.isDeleted ? (
                      <div
                        className={`rounded-2xl px-4 py-2 shadow-sm ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                        }`}
                      >
                        <p className="italic text-sm opacity-70">Message deleted</p>
                      </div>
                    ) : isImageMessage(message) ? (
                      /* Image message */
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt="Shared image"
                          className="max-w-full rounded-lg shadow-sm cursor-pointer hover:opacity-95 transition"
                          style={{ maxHeight: '300px' }}
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                        {/* Caption if exists */}
                        {message.content && (
                          <div
                            className={`mt-1 rounded-lg px-3 py-1.5 ${
                              isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Text message */
                      <div
                        className={`rounded-2xl px-4 py-2 shadow-sm ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                        {message.isEdited && (
                          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>(edited)</p>
                        )}
                      </div>
                    )}

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

      {/* Image Preview */}
      {imagePreview && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex items-start space-x-3">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg"
              />
              <button
                onClick={clearSelectedImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 text-sm text-gray-600">
              <p className="font-medium">{selectedImage?.name}</p>
              <p className="text-xs text-gray-400">
                {selectedImage && (selectedImage.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-sm text-red-600 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-3 md:p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2 md:space-x-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition disabled:opacity-50"
            title="Send image (max 5MB)"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={selectedImage ? "Add a caption (optional)..." : "Type a message..."}
            rows={1}
            className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
            style={{ maxHeight: '120px' }}
          />

          <button
            type="submit"
            disabled={(!inputValue.trim() && !selectedImage) || sending}
            className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm md:text-base"
          >
            {uploadProgress ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading
              </span>
            ) : sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        <p className="mt-1 text-xs text-gray-400 text-center">
          Images: JPEG, PNG, GIF, WebP (max 5MB)
        </p>
      </div>
    </div>
  );
}
