# API Integration Guide

## Environment Setup

### 1. Create `.env` file

Copy the `.env.example` file to `.env` in the root of the `assistant-chat` directory:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your settings:

```env
# Assistant Server Configuration
VITE_ASSISTANT_SERVER_URL=http://localhost:3000

# Widget Configuration
VITE_DEFAULT_USER_UUID=user-123
VITE_DEFAULT_COMPANY_UUID=company-456
```

**Note**: In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

---

## API Flow

The widget integrates with the Assistant Server using the following flow:

### 1. **Conversation Creation** (First time widget opens)

**When**: User opens the chat bubble for the first time  
**API**: `POST /api/conversations`

```typescript
// Request
{
  "title": "New Chat",
  "user_uuid": "user-123",
  "company_uuid": "company-456"
}

// Response
{
  "uuid": "a8f96464-adf2-4b40-9069-e5e5f067a871",
  "title": "New Chat",
  "user_uuid": "user-123",
  "company_uuid": "company-456",
  "message_count": 0,
  "created_at": "2025-10-06T10:50:27.936Z",
  "updated_at": "2025-10-06T10:50:27.936Z"
}
```

The conversation UUID is stored in state and reused for all subsequent messages in the same session.

---

### 2. **User Message Creation** (Every user query)

**When**: User types and sends a message  
**API**: `POST /api/conversations/{conversation_uuid}/messages`

```typescript
// Request
{
  "content": "What is skin brown?"
}

// Response
{
  "uuid": "73700dfe-e575-45f4-b690-3b2a6aaaedd9",
  "conversation_uuid": "a6336ec4-baea-4601-9125-50a871b0c056",
  "type": "user",
  "content": "What is skin brown?",
  "created_at": "2025-10-06T10:46:33.917Z"
}
```

---

### 3. **AI Response Generation** (Every user query)

**When**: Immediately after user message is created  
**API**: `POST /api/messages/{user_message_uuid}/generate`

```typescript
// Response
{
  "uuid": "d1b3c594-a94d-4051-8e2d-b61d3e0c0c9a",
  "parent_message_uuid": "73700dfe-e575-45f4-b690-3b2a6aaaedd9",
  "type": "assistant",
  "content": "The term \"Skin Brown\" typically refers to...",
  "status": "completed",
  "created_at": "2025-10-06T10:46:48.773Z"
}
```

The AI response content is then streamed character-by-character in the UI for a smooth user experience.

---

## File Structure

```
src/
├── api/
│   ├── conversation.ts    # Conversation API calls
│   ├── message.ts         # Message API calls
│   └── index.ts           # API exports
├── routes/
│   └── WidgetPage.tsx     # Main widget component with API integration
└── config/
    └── theme.ts           # Theme configuration
```

---

## API Functions

### `conversation.ts`

#### `createConversation(request: CreateConversationRequest): Promise<ConversationResponse>`
Creates a new conversation.

#### `getConversation(uuid: string): Promise<ConversationResponse>`
Retrieves an existing conversation by UUID.

---

### `message.ts`

#### `createUserMessage(conversationUuid: string, request: CreateMessageRequest): Promise<MessageResponse>`
Creates a new user message in a conversation.

#### `generateAIResponse(userMessageUuid: string): Promise<GenerateMessageResponse>`
Generates an AI response for a user message.

---

## Widget Behavior

1. **First Open**: 
   - Creates a new conversation via API
   - Shows welcome message: "Hello! I'm your AI assistant. How can I help you today?"
   - Conversation UUID is stored in state

2. **User Sends Message**:
   - Message appears immediately in UI
   - API call 1: Create user message
   - API call 2: Generate AI response
   - AI response is streamed character-by-character

3. **Close & Reopen**:
   - Conversation UUID persists in the same session
   - Previous messages are maintained in local state
   - No new conversation is created

4. **Refresh/New Session**:
   - New conversation is created
   - Fresh start with welcome message

---

## Error Handling

The widget includes comprehensive error handling:

- **Conversation creation fails**: Shows welcome message anyway, allows user to try messaging
- **Message creation fails**: Shows error message to user
- **AI generation fails**: Shows error message to user

All errors are logged to console for debugging:

```typescript
console.log('[Widget] Conversation created:', uuid);
console.log('[Widget] User message created:', uuid);
console.log('[Widget] AI response received:', uuid);
console.error('[Widget] Error:', error);
```

---

## Development

### Run in Development Mode

```bash
npm run dev
```

The widget will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## Testing

1. Start the Assistant Server on port 3000
2. Start the widget dev server: `npm run dev`
3. Open the widget in browser
4. Check browser console for API call logs
5. Verify conversation is created on first open
6. Send a message and verify both API calls execute
7. Check that AI response streams correctly

---

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ASSISTANT_SERVER_URL` | Assistant Server API URL | `http://localhost:3000` | Yes |
| `VITE_DEFAULT_USER_UUID` | Default user identifier | `user-123` | Yes |
| `VITE_DEFAULT_COMPANY_UUID` | Default company identifier | `company-456` | Yes |

**Note**: These are fallback values. In production, you should dynamically set user and company UUIDs based on your authentication system.

