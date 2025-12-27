# @thulobazaar/messaging-core

Shared messaging logic for Thulobazaar web and mobile applications.

## Features

- 🔷 **TypeScript First** - Fully typed API with comprehensive type definitions
- 🌐 **Platform Agnostic** - Works with React (web) and React Native (mobile)
- 🔄 **Real-time** - Socket.IO integration for instant messaging
- 📡 **Hybrid Architecture** - REST API for historical data + WebSocket for real-time updates
- 🎣 **React Hooks** - Easy-to-use hooks for messaging functionality
- ✨ **2025 Best Practices** - Following modern messaging patterns

## Installation

```bash
# In your web or mobile app
npm install @thulobazaar/messaging-core
```

## Usage

### Types

```typescript
import type { Message, Conversation, User } from '@thulobazaar/messaging-core';

const message: Message = {
  id: 1,
  conversationId: 1,
  senderId: 27,
  sender: { id: 27, fullName: 'Shanti', email: 'shanti@example.com' },
  content: 'Hello!',
  type: 'text',
  isEdited: false,
  isDeleted: false,
  createdAt: '2025-11-22T10:00:00Z',
  updatedAt: '2025-11-22T10:00:00Z',
};
```

### Services (Phase 2 - Complete)

```typescript
import { createMessagingApi, createSocketService } from '@thulobazaar/messaging-core';

// Initialize the messaging API
const messagingApi = createMessagingApi({
  backendUrl: 'http://localhost:5000',
  getAuthToken: () => localStorage.getItem('token'),
});

// Initialize Socket.IO service
const socketService = createSocketService();
socketService.connect({
  backendUrl: 'http://localhost:5000',
  token: 'your-jwt-token',
});

// Get conversations
const conversations = await messagingApi.getConversations();

// Send a message
socketService.sendMessage(conversationId, 'Hello!');

// Listen for new messages
socketService.onMessageNew((message) => {
  console.log('New message:', message);
});
```

### Hooks (Phase 3 - Complete)

```typescript
import { useSocket, useMessagingApi, useMessages, useConversations, useTyping } from '@thulobazaar/messaging-core';

function ChatApp() {
  // Setup API and Socket
  const api = useMessagingApi({
    backendUrl: 'http://localhost:5000',
    getAuthToken: () => localStorage.getItem('token'),
  });

  const { socket, isConnected, connect } = useSocket();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connect({ backendUrl: 'http://localhost:5000', token });
    }
  }, []);

  // Get conversations list
  const { conversations, totalUnread } = useConversations({ socket, api });

  // Get messages for a conversation
  const { messages, sendMessage, markAsRead } = useMessages({
    conversationId: selectedConversation,
    socket,
    api,
  });

  // Typing indicators
  const { typingText, startTyping } = useTyping({
    conversationId: selectedConversation,
    socket,
    currentUserId: user.id,
  });

  return (
    <div>
      <ConversationList conversations={conversations} unread={totalUnread} />
      <ChatWindow messages={messages} onSend={sendMessage} />
      {typingText && <p>{typingText}</p>}
    </div>
  );
}
```

## Package Structure

```
messaging-core/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── services/        # API and Socket services (Phase 2)
│   ├── hooks/           # React hooks (Phase 3)
│   ├── utils/           # Utility functions (Phase 4)
│   └── index.ts         # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Development Phases

- [x] **Phase 1**: TypeScript types and package structure
- [x] **Phase 2**: Move API services to shared package
- [x] **Phase 3**: Create reusable hooks
- [ ] **Phase 4**: Extract utility functions
- [ ] **Phase 5**: Add image upload support

## Type Definitions

### Core Types

- `User` - User account information
- `Message` - Chat message with sender info
- `Conversation` - Conversation/thread with participants
- `MessageType` - 'text' | 'image' | 'file'
- `ConversationType` - 'direct' | 'group'

### Response Types

- `ApiResponse<T>` - Standard API response wrapper
- `ConversationsResponse` - List of conversations
- `ConversationDetailResponse` - Single conversation with messages
- `UnreadCountResponse` - Unread message counts

### Socket Event Types

- `SocketEventMap` - All Socket.IO event types
- `TypingIndicator` - Typing status events

## Contributing

This is a monorepo package. To contribute:

1. Make changes in `packages/messaging-core/`
2. Run `npm run build` to compile
3. Test in both web and mobile apps
4. Ensure types are properly exported

## License

Proprietary - Thulobazaar
