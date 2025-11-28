# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2025-01-XX

### Added
- **Human Agent Support**: Full conversation management interface for human agents
  - Conversations tab with pagination and realtime updates
  - Agent handoff: join conversations, send messages, close conversations
  - Real-time message synchronization between agents and chatbot
- **Realtime Updates**: Supabase Realtime integration for live message sync
  - Agent messages appear instantly in chatbot widget
  - Conversation status updates (open, in_progress, closed)
  - System messages for agent join/close events
- **Configurable Supabase**: Support for Supabase credentials via config (npm package) or env vars (embed widget)
  - `supabaseUrl` and `supabaseAnonKey` config options
  - Graceful degradation when realtime is unavailable

### Changed
- Refactored conversation management into modular components
- Optimized realtime subscription handling
- Improved UI/UX for conversation list and chat interface

## [1.2.0] - Previous Release

Initial stable release with core chat widget functionality.

