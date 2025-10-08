# Vezlo Assistant Chat

A complete chat widget solution with both a React component library and standalone admin application for AI-powered customer support.

## What's Included

### 📦 NPM Package
- **Reusable React Widget**: Install via `npm install @vezlo/assistant-chat`
- **TypeScript Support**: Full type definitions included
- **Customizable**: Themes, colors, positioning, and behavior
- **Real-time Streaming**: Live AI responses with streaming support
- **Style Isolation**: Shadow DOM support for conflict-free integration
- **📖 [Complete Package Documentation](PACKAGE_README.md)**

### 🖥️ Standalone Application
- **Admin Dashboard**: Configure widgets with live preview
- **Playground**: Test widgets in isolated environment
- **Embed Code Generator**: Get ready-to-use embed codes
- **Docker Support**: Easy deployment with Docker Compose
- **Vercel Ready**: One-click deployment to Vercel

## Quick Start

### For Developers (NPM Package)

```bash
npm install @vezlo/assistant-chat
```

```tsx
import { Widget } from '@vezlo/assistant-chat';

function App() {
  const config = {
    uuid: 'your-widget-uuid',
    title: 'AI Assistant',
    themeColor: '#10b981',
    // ... other config
  };
  
  return <Widget config={config} />;
}
```

**📖 [Complete NPM Package Documentation](PACKAGE_README.md)**

### For Administrators (Standalone App)

This repository also contains a standalone admin application for configuring and managing widgets.

```bash
# Clone and run the standalone app
git clone https://github.com/vezlo/assistant-chat.git
cd assistant-chat
npm install
npm run dev
```

**Features:**
- Admin dashboard for widget configuration
- Live preview and playground
- Embed code generation
- Docker and Vercel deployment support

## Prerequisites

- **Assistant Server**: Both components require a running Assistant Server
- Node.js 18+ and npm
- React 18+ (for package usage)

## Features

### Package Features
- ✅ React component library
- ✅ TypeScript support
- ✅ Tailwind CSS styling
- ✅ Real-time streaming
- ✅ Customizable themes
- ✅ Shadow DOM support
- ✅ API integration included

### App Features
- ✅ Admin dashboard
- ✅ Live widget preview
- ✅ Playground testing
- ✅ Embed code generation
- ✅ Multiple widget management
- ✅ Docker support
- ✅ Vercel deployment

## Deployment Options

### Package (NPM)
```bash
npm run build
npm pack  # Test locally
npm publish  # Publish to NPM
```

### App (Vercel)

#### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vezlo/assistant-chat)

#### Manual Vercel CLI Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from local directory
vercel

# Set environment variables (required)
vercel env add VITE_ASSISTANT_SERVER_URL
vercel env add VITE_ASSISTANT_SERVER_API_KEY

# Optional environment variables
vercel env add VITE_DEFAULT_USER_UUID
vercel env add VITE_DEFAULT_COMPANY_UUID
vercel env add VITE_WIDGET_DEFAULT_THEME
vercel env add VITE_WIDGET_DEFAULT_POSITION
vercel env add VITE_WIDGET_DEFAULT_SIZE

# Deploy to production
vercel --prod
```

### App (Docker)
```bash
docker-compose up
```

## Repository Structure

This repository contains both the NPM package and standalone application:

```
assistant-chat/
├── src/
│   ├── components/Widget.tsx    # Main widget component (used by both)
│   ├── api/                     # API services
│   ├── types/                   # TypeScript definitions
│   ├── utils/                   # Utility functions
│   ├── config/                  # Configuration
│   └── routes/                  # Standalone app pages
├── public/
│   └── widget.js               # Embed script
├── docs/                       # Documentation
├── README.md                   # This file (project overview)
├── PACKAGE_README.md           # NPM package documentation
└── package.json                # Package configuration
```

### How It Works

- **Same Widget Code**: Both the NPM package and standalone app use the same `Widget.tsx` component
- **NPM Package**: Publishes the widget component as a reusable library
- **Standalone App**: Uses the widget component directly for admin interface and playground
- **No Duplication**: Single source of truth for the widget component

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Codebase      │───▶│   src-to-kb     │───▶│ Knowledge Base  │
│   (Your Code)   │    │   (Analysis)    │    │   (Vector DB)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Chat Widget    │◄───│ Assistant Server│◀───│   AI Queries    │
│  (This Package) │    │   (Backend)     │    │   (RAG System)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Knowledge Base Integration

To enable AI-powered code analysis and intelligent responses, integrate with [@vezlo/src-to-kb](https://www.npmjs.com/package/@vezlo/src-to-kb):

```bash
npm install -g @vezlo/src-to-kb
src-to-kb /path/to/your/codebase --output ./knowledge-base
```

The Assistant Server will automatically use this knowledge base to provide intelligent answers about your codebase.

## Related Projects

- [@vezlo/assistant-server](https://www.npmjs.com/package/@vezlo/assistant-server) - Backend API server
- [@vezlo/src-to-kb](https://www.npmjs.com/package/@vezlo/src-to-kb) - NPM package for code analysis
- [@vezlo/ai-validator](https://www.npmjs.com/package/@vezlo/ai-validator) - AI validation tools

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

## Issues & Support

- **Package Issues**: [Assistant Chat Issues](https://github.com/vezlo/assistant-chat/issues)
- **Server Issues**: [Assistant Server Issues](https://github.com/vezlo/assistant-server/issues)
- **General Questions**: [Assistant Server Discussions](https://github.com/vezlo/assistant-server/discussions)

## 📄 License

This project is dual-licensed:

- **Non-Commercial Use**: Free under AGPL-3.0 license
- **Commercial Use**: Requires a commercial license - contact us for details

---

Made with ❤️ by The Vezlo team