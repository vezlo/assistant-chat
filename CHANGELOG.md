# Changelog

All notable changes to this project will be documented in this file.

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

