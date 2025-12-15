# Changelog

All notable changes to this project will be documented in this file.

## [1.6.0] - 2025-12-12

### Added
- **AI Settings Tab**: Added dedicated "AI Settings" tab to Config dashboard for managing AI behavior
- **Response Mode**: Added ability to switch between "User" (conversational) and "Developer" (technical) response modes for the AI assistant

### Changed
- **Navigation**: Updated application navigation structure to nest AI settings under configuration
- **UI Architecture**: Added `AISettingsTab` to the modular configuration page architecture

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

## [1.5.0] - 2025-12-12

### Changed
- **Analytics Dashboard**: Moved Analytics from a standalone page to a dedicated tab within the Configuration dashboard
- **Navigation**: Updated application navigation structure to nest analytics under configuration
- **UI Architecture**: Refactored Configuration page with modular tab components (`AnalyticsTab`, `TabButton`) for better maintainability

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

