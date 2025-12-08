# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2025-12-05

### Added
- **Server-Sent Events (SSE) streaming**: Real-time streaming of AI responses using SSE protocol
- **Feedback API integration**: Submit and delete feedback for messages with optimistic UI updates
- **Auto-focus input**: Message input field automatically focuses after assistant message completes
- **Improved cursor styling**: Pointer cursor on interactive elements (chatbot icon, close button)

### Changed
- **Streaming implementation**: Migrated from frontend-simulated streaming to backend SSE streaming for smoother, real-time responses
- **Message UUID handling**: Added `_realUuid` field to track real message UUIDs during streaming to prevent feedback race conditions
- **Error handling**: Enhanced error handling for streaming failures with proper user feedback
- **Feedback buttons**: Disabled feedback buttons until message UUID is available to prevent race conditions

### Fixed
- **UI "jerk" issue**: Eliminated UI re-renders and jerks when streaming completes
- **Feedback race condition**: Fixed issue where feedback was sent with temporary message IDs
- **Multiple Supabase client warning**: Disabled session persistence for realtime client to prevent duplicate client warnings

## [1.3.0] - 2025-12-01

### Added
- **Human agent support**: Added conversations tab for agents to manage and respond to customer conversations
- **Realtime updates**: Implemented Supabase Realtime integration for live message synchronization and agent handoff
- **Configurable Supabase credentials**: Added `supabaseUrl` and `supabaseAnonKey` to `WidgetConfig` for flexible realtime configuration
- Optimistic UI updates for agent messages with pending state indicators
- Conversation pagination with infinite scroll for both conversations and messages
- Modular component architecture: split `ConversationsTab` into `ConversationList` and `ConversationChat` components

### Changed
- Refactored realtime service to accept Supabase credentials as parameters instead of environment variables
- Updated `Widget` component to pass Supabase credentials to realtime subscription
- Updated `WidgetPage` to set Supabase credentials from environment variables for embed widget
- Centralized conversation API functions into `conversation.ts` (removed `conversations.ts`)

### Documentation
- Updated README.md to highlight realtime features and required environment variables
- Updated PACKAGE_README.md with Supabase configuration options and examples
- Updated API_INTEGRATION.md with Supabase environment variables reference
- Updated THEME_WIDGET_CONFIG.md with `supabaseUrl` and `supabaseAnonKey` configuration options

