# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2025-12-17

### Added
- **Citation Support**: Display sources for AI responses with "View Sources" link
- **CitationView Component**: Inline source list that expands below assistant messages
- **Source Content Viewer**: Clicking sources opens document content in new browser window with plain text display
- **Per-Message Sources**: Each message stores its own sources array, preventing cross-message source leakage
- **Markdown Rendering**: Chatbot responses now render markdown with proper HTML conversion and XSS protection
- **Code Block Scrolling**: Horizontal scrolling for code blocks that overflow widget boundaries
- **Custom Scrollbar**: Elegant, thin scrollbar styling for code blocks

### Changed
- Citation API integration for fetching document content
- Loading spinner shown when fetching citation context

## [1.6.0] - 2025-12-16

### Added
- **Archive Functionality**: Archive closed conversations with dedicated UI in ConversationsTab
- **Active/Archived Tabs**: Filter conversations by active or archived status with tab interface
- **Browser Notifications**: Desktop notifications for new messages and conversations (when tab not visible)
- **Archive API Integration**: `archiveConversation()` API method with proper error handling
- **Notification Service**: Standalone notification service with permission management and tab visibility detection

### Changed
- Archive button shows only for closed (non-archived) conversations
- Archived conversations display "Archived" status in purple color
- Archiving removes conversation from Active tab and clears selection
- Conversation list API calls now support `status` parameter for filtering
- Notifications include conversation ID in title format: "New message from User - Conv #abc12345"
- Clicking notification switches to correct tab and selects conversation

### Fixed
- Loading indicator when switching between Active/Archived tabs
- Proper status calculation including archived state
- Tab hover cursor styling

## [1.5.0] - 2025-12-12

### Added
- **Analytics Dashboard**: Comprehensive analytics tab with company-wide statistics
- **Message Breakdown**: Detailed breakdown showing user messages, AI assistant messages, and human agent messages
- **Total Messages**: Aggregated message count excluding system messages (e.g., "user joined", "conversation closed")
- **Interactive Tooltips**: Help icons with tooltips explaining each statistic for better user understanding
- **Enhanced UI**: Improved analytics layout with gradient cards, better spacing, and professional design
- **Full-page Loading States**: Loading skeletons for all analytics sections (top stats, message breakdown, conversation status, feedback)

### Changed
- **Analytics Location**: Moved Analytics from standalone page to dedicated tab within Configuration dashboard
- **Navigation**: Updated application navigation structure to nest analytics under configuration
- **UI Architecture**: Refactored Configuration page with modular tab components (`AnalyticsTab`, `TabButton`) for better maintainability
- **Message Display**: Changed from "User Messages" to "Total Messages" showing combined count of all message types
- **Layout**: Improved analytics layout with 3-row structure: aggregated stats → message breakdown → conversation status & feedback
- **Icons**: Enhanced message breakdown icons (MessageSquareText, Sparkles, UserCheck) for better visual distinction

### Fixed
- **Error Handling**: Comprehensive null checks and fallback values (defaults to 0) for all statistics
- **Data Accuracy**: Total message count now correctly excludes system messages from calculations

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

