/**
 * ConversationList Component
 * Displays list of conversations with unread counts
 */

'use client';

import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: any[];
  selectedConversation: any | null;
  onSelectConversation: (conversation: any) => void;
  loading: boolean;
  onRefresh: () => void;
  onNewMessage?: () => void; // NEW: Callback to open new message modal
  currentUserId?: number; // Current logged-in user ID
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  onRefresh,
  onNewMessage,
  currentUserId,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <div className="flex items-center space-x-2">
            {/* New Message Button */}
            {onNewMessage && (
              <button
                onClick={onNewMessage}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition"
                title="New Message"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
              title="Refresh"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="mt-4 text-sm">No conversations yet</p>
            <p className="mt-1 text-xs text-gray-400">Start a new conversation to get started</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;
              const hasUnread = conversation.unread_count > 0;

              // Get other participants (not current user)
              // Filter out current user from participants list
              const otherParticipants = conversation.participants?.filter(
                (p: any) => p.id !== currentUserId
              ) || [];
              const otherParticipant = otherParticipants[0];

              return (
                <li
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {otherParticipant?.avatar ? (
                        <img
                          src={otherParticipant.avatar.startsWith('http') ? otherParticipant.avatar : `/uploads/avatars/${otherParticipant.avatar}`}
                          alt={otherParticipant.fullName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-lg">
                            {otherParticipant?.fullName?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      {hasUnread && (
                        <div className="absolute mt-8 ml-8 h-3 w-3 rounded-full bg-blue-600 border-2 border-white"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium text-gray-900 truncate ${hasUnread ? 'font-bold' : ''}`}>
                          {conversation.title || otherParticipant?.fullName || 'Unknown User'}
                        </p>
                        {conversation.last_message?.createdAt && (
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.last_message.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>

                      {/* Last message preview */}
                      {conversation.last_message && (
                        <p className={`mt-1 text-sm text-gray-600 line-clamp-2 ${hasUnread ? 'font-semibold' : ''}`}>
                          {conversation.last_message.type === 'text'
                            ? conversation.last_message.content
                            : '📎 Attachment'}
                        </p>
                      )}

                      {/* Unread count */}
                      {hasUnread && (
                        <span className="mt-1 inline-block bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}

                      {/* Ad link if exists */}
                      {conversation.ad_info && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                          <span className="truncate">{conversation.ad_info.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
