# Vezlo Assistant Chat Widget - NPM Package

[![npm version](https://img.shields.io/npm/v/@vezlo/assistant-chat.svg)](https://www.npmjs.com/package/@vezlo/assistant-chat) [![license](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)

A React component library for integrating AI assistant chat functionality into web applications with realtime updates and human agent support.

**📋 [Changelog](https://github.com/vezlo/assistant-chat/blob/main/CHANGELOG.md)** | **🐛 [Report Issue](https://github.com/vezlo/assistant-chat/issues)**

> **📦 This is the NPM package documentation**  
> **🏠 Repository**: [assistant-chat](https://github.com/vezlo/assistant-chat) - Contains both this NPM package and a standalone admin application  
> **🖥️ Standalone App**: Want to run the admin dashboard? Visit the [main repository](https://github.com/vezlo/assistant-chat) for setup instructions

## Installation

```bash
npm install @vezlo/assistant-chat
```

## Requirements

- React 18 or higher
- Tailwind CSS (for styling)
- Assistant Server running (see [Assistant Server](https://github.com/vezlo/assistant-server))
- **Realtime Updates** (Optional): Provide `supabaseUrl` + `supabaseAnonKey` for agent handoff / live message sync. Without these the widget still works, it just won’t receive realtime pushes.

## Quick Start

```tsx
import { Widget } from '@vezlo/assistant-chat';

function App() {
  const widgetConfig = {
    uuid: 'your-widget-uuid',
    apiUrl: 'http://localhost:3000',
    apiKey: 'your-api-key',
    title: 'AI Assistant',
    subtitle: 'How can I help you?',
    placeholder: 'Type your message...',
    welcomeMessage: 'Hello! How can I assist you today?',
    themeColor: '#10b981',
    position: 'bottom-right',
    size: { width: 400, height: 600 },
    defaultOpen: false,
    // Optional realtime config
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseAnonKey: 'your-anon-key'
  };

  return <Widget config={widgetConfig} />;
}
```

## Configuration

The `WidgetConfig` interface includes:

- `uuid`: Unique identifier for your widget
- `apiUrl`: Assistant Server API URL (required for NPM package usage)
- `apiKey`: API key for authentication (required)
- `title`: Header title
- `subtitle`: Subtitle text
- `placeholder`: Input placeholder text
- `welcomeMessage`: Initial message shown to users
- `themeColor`: Primary color for the widget
- `position`: Widget position ('bottom-right', 'bottom-left', 'top-right', 'top-left')
- `size`: Widget dimensions
- `defaultOpen`: Whether widget opens by default
- `supabaseUrl`: Supabase project URL (optional, required for realtime updates)
- `supabaseAnonKey`: Supabase anon key (optional, required for realtime updates)

### Configuration Options Table

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `uuid` | string | Required | Unique identifier for the widget |
| `title` | string | `'AI Assistant'` | Widget header title |
| `subtitle` | string | `'How can I help you today?'` | Widget header subtitle |
| `placeholder` | string | `'Type your message...'` | Input placeholder text |
| `welcomeMessage` | string | `'Hello! I\'m your AI assistant...'` | Initial message shown to users |
| `themeColor` | string | `'#059669'` | Primary color for the widget |
| `position` | string | `'bottom-right'` | Position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `size` | object | `{ width: 420, height: 600 }` | Widget dimensions |
| `defaultOpen` | boolean | `false` | Whether widget opens by default |
| `apiUrl` | string | Required | Assistant Server API URL |
| `apiKey` | string | Required | API key for authentication |
| `supabaseUrl` | string | Optional | Supabase project URL (for realtime updates) |
| `supabaseAnonKey` | string | Optional | Supabase anon key (for realtime updates) |

## API Integration

This widget requires a running Assistant Server instance. The widget will:

1. Create conversations automatically
2. Send user messages to the server
3. Stream AI responses in real-time using Server-Sent Events (SSE)
4. **Realtime Updates**: With `supabaseUrl` and `supabaseAnonKey` configured, the widget receives realtime updates for agent handoff and live message synchronization

Configure your Assistant Server URL in your application:

```tsx
// The widget uses the API services included in this package
import { createConversation, createUserMessage, generateAIResponse } from '@vezlo/assistant-chat';
```

For detailed API integration documentation, see [API Integration Guide](docs/API_INTEGRATION.md).

## Knowledge Base Integration

To enable AI-powered code analysis and intelligent responses, integrate with [@vezlo/src-to-kb](https://www.npmjs.com/package/@vezlo/src-to-kb):

```bash
npm install -g @vezlo/src-to-kb
src-to-kb /path/to/your/codebase --output ./knowledge-base
```

The Assistant Server will automatically use this knowledge base to provide intelligent answers about your codebase.

## Styling

The widget uses Tailwind CSS classes. Ensure your application has Tailwind CSS configured for proper styling.

## Props

### WidgetProps

- `config`: WidgetConfig - Configuration object
- `isPlayground?`: boolean - Internal use for playground mode
- `onOpen?`: () => void - Callback when widget opens
- `onClose?`: () => void - Callback when widget closes
- `onMessage?`: (message: ChatMessage) => void - Callback for new messages
- `onError?`: (error: string) => void - Callback for errors
- `useShadowRoot?`: boolean - Use Shadow DOM for style isolation

## Examples

### Basic Usage

```tsx
import { Widget } from '@vezlo/assistant-chat';

function MyApp() {
  return (
    <div>
      <h1>My Website</h1>
      <Widget config={{
        uuid: 'my-widget-123',
        apiUrl: 'http://localhost:3000',
        apiKey: 'your-api-key',
        title: 'Support Chat',
        themeColor: '#3b82f6',
        position: 'bottom-right',
        defaultOpen: false
      }} />
    </div>
  );
}
```

### With Callbacks

```tsx
import { Widget, type ChatMessage } from '@vezlo/assistant-chat';

function MyApp() {
  const handleMessage = (message: ChatMessage) => {
    console.log('New message:', message);
  };

  const handleError = (error: string) => {
    console.error('Widget error:', error);
  };

  return (
    <Widget 
      config={{
        uuid: 'my-widget-123',
        apiUrl: 'http://localhost:3000',
        apiKey: 'your-api-key',
        title: 'Support Chat',
        themeColor: '#3b82f6'
      }}
      onMessage={handleMessage}
      onError={handleError}
    />
  );
}
```

### Shadow DOM for Style Isolation

```tsx
import { Widget } from '@vezlo/assistant-chat';

function MyApp() {
  return (
    <Widget 
      config={{
        uuid: 'my-widget-123',
        apiUrl: 'http://localhost:3000',
        apiKey: 'your-api-key',
        title: 'Support Chat',
        themeColor: '#3b82f6'
      }}
      useShadowRoot={true} // Isolates styles from host app
    />
  );
}
```

## Troubleshooting

### Widget Not Showing
- Ensure Tailwind CSS is configured in your app
- Check that the Assistant Server is running
- Verify the `uuid` is unique

### Style Conflicts
- Use `useShadowRoot={true}` for style isolation
- Ensure Tailwind CSS is properly configured
- Check for conflicting CSS in your host application

### API Errors
- Verify Assistant Server is running and accessible
- Check CORS settings on your Assistant Server
- Ensure the server URL is correct

## Issues & Support

- **Package Issues**: [Assistant Chat Issues](https://github.com/vezlo/assistant-chat/issues)
- **Server Issues**: [Assistant Server Issues](https://github.com/vezlo/assistant-server/issues)
- **General Questions**: [Assistant Server Discussions](https://github.com/vezlo/assistant-server/discussions)

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup

```bash
# Clone the repository
git clone https://github.com/vezlo/assistant-chat.git
cd assistant-chat

# Install dependencies
npm install

# Start development server
npm run dev

# Build the package
npm run build
```

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is dual-licensed:

- **Non-Commercial Use**: Free under AGPL-3.0 license
- **Commercial Use**: Requires a commercial license - contact us for details

---

Made with Love by [Vezlo](https://www.vezlo.org/)