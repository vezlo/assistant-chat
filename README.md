# Vezlo Assistant Chat Widget

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vezlo/assistant-chat.git&project-name=assistant-chat&repo-name=assistant-chat&build-command=npm%20run%20build&output-directory=dist&install-command=npm%20install)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-emerald.svg)](https://opensource.org/licenses/AGPL-3.0)

🚀 **Production-ready embeddable AI chatbot widget** for SaaS applications - Complete frontend with visual configuration, live playground, and one-click embed functionality.

## 🏗️ Architecture

- **Embeddable Widget** - Single script embed for any website
- **Visual Configuration** - Real-time preview with theme customization
- **Live Playground** - Test functionality before deployment
- **RAG Integration** - Connects to Vezlo Assistant Server APIs
- **Streaming Responses** - Real-time character-by-character streaming
- **Cross-Origin Ready** - CORS-enabled iframe isolation
- **Production Ready** - Docker containerization and Vercel deployment

## 📦 Installation

### Prerequisites

- **Assistant Server** must be running (this widget depends on its APIs)
  - Default local URL: `http://localhost:3000`
  - See: [Vezlo Assistant Server](https://github.com/vezlo/assistant-server)

### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/vezlo/assistant-chat.git
cd assistant-chat

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env to set VITE_ASSISTANT_SERVER_URL

# Start development server
npm run dev
# Opens at: http://localhost:5173
```

### Option 2: Docker Compose

```bash
# From assistant-chat directory
docker-compose up --build
# Opens at: http://localhost:5173
```

## 🚀 Quick Start

### 1. Configuration

Visit `http://localhost:5173` to access the configuration panel:

- **Configuration Tab** - Customize widget appearance, theme colors, position
- **Playground Tab** - Test live chat functionality
- **Embed Tab** - Copy embed code for your website

### 2. Embed Code

Copy the generated embed code and add to your HTML:

```html
<script src="https://your-domain.com/widget.js"></script>
<script>
  addVezloChatWidget('your-widget-uuid', 'https://your-domain.com');
</script>
```

### 3. Start Chatting

The widget appears as a chat bubble on your page. Users can click to open and start chatting with your AI assistant.

## 🌐 Deployment

### Vercel (Recommended)

1. **One-Click Deploy**: Click the "Deploy with Vercel" button above
2. **Set Environment Variables**:
   - `VITE_ASSISTANT_SERVER_URL=https://your-assistant-server.vercel.app`
   - `VITE_DEFAULT_USER_UUID=user-123`
   - `VITE_DEFAULT_COMPANY_UUID=company-456`
3. **Deploy** - Vercel automatically builds and serves your widget

### Vercel CLI Deployment

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Set environment variables
vercel env add VITE_ASSISTANT_SERVER_URL
vercel env add VITE_DEFAULT_USER_UUID
vercel env add VITE_DEFAULT_COMPANY_UUID

# Deploy to production
vercel --prod
```


## 📚 Documentation

- **[API Integration Guide](docs/API_INTEGRATION.md)** - API endpoints and integration details
- **[Widget Embed Guide](docs/WIDGET_EMBED.md)** - Embedding instructions and customization

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `uuid` | string | Required | Widget identifier |
| `apiUrl` | string | Required | Assistant Server URL |
| `theme` | 'light' \| 'dark' | 'light' | Visual theme |
| `position` | string | 'bottom-right' | Widget position |
| `themeColor` | string | '#059669' | Primary color (emerald) |
| `title` | string | 'AI Assistant' | Widget header title |
| `subtitle` | string | 'How can I help?' | Widget header subtitle |
| `placeholder` | string | 'Type a message...' | Input placeholder |
| `welcomeMessage` | string | 'Hello! How can I...' | Initial message |

## 🛠️ Development


### Project Structure

```
assistant-chat/
├── docs/                          # Documentation
│   ├── API_INTEGRATION.md        # API integration guide
│   └── WIDGET_EMBED.md           # Embedding instructions
├── public/
│   ├── assets/                   # Static assets
│   └── widget.js                 # Standalone embed script
├── src/
│   ├── api/                      # API service layer
│   ├── components/ui/            # Reusable UI components
│   ├── config/                   # Theme configuration
│   ├── routes/                   # Page components
│   ├── services/                 # Business logic
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Helper functions
├── .env.example                  # Environment template
├── Dockerfile                    # Production container
├── docker-compose.yml            # Multi-service setup
├── vercel.json                   # Vercel deployment config
└── README.md                     # This file
```

## 🔧 Environment Variables

Create `.env` file based on `.env.example`:

```env
# Assistant Server API URL
VITE_ASSISTANT_SERVER_URL=http://localhost:3000

# Default identifiers (customize per deployment)
VITE_DEFAULT_USER_UUID=user-123
VITE_DEFAULT_COMPANY_UUID=company-456
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is dual-licensed:

- **Non-Commercial Use**: Free under AGPL-3.0 license
- **Commercial Use**: Requires a commercial license - contact us for details

## 🔗 Related Projects

- **[Vezlo Assistant Server](https://github.com/vezlo/assistant-server)** - Backend APIs and AI processing
- **[AI Validator](https://github.com/vezlo/ai-validator)** - AI response validation and quality checking
- **[src-to-kb](https://github.com/vezlo/src-to-kb)** - Convert code repositories into knowledge base chunks for RAG

---

**Made with ❤️ by the Vezlo team**