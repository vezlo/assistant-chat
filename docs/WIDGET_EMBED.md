# Vezlo Chat Widget - Embed Documentation

## How the Widget Works

The Vezlo Chat Widget is a simple, production-ready embed solution that works by:

1. **Loading a JavaScript file** (`widget.js`) that provides the `addVezloChatWidget()` function
2. **Creating an iframe** that points to the internal `/widget/{uuid}` route
3. **Rendering the React component** inside the iframe with full functionality

## Architecture

```
External Website
    └── widget.js (Simple JS file)
        └── Creates iframe
            └── Points to /widget/{uuid}
                └── Loads React WidgetPage component
```

## Embed Code

### Basic Usage

```html
<script type="text/javascript" src="http://your-domain.com/widget.js"></script>
<script>
  addVezloChatWidget('your-uuid', 'http://your-domain.com');
</script>
```

### With Custom Configuration

```html
<script type="text/javascript" src="http://your-domain.com/widget.js"></script>
<script>
  addVezloChatWidget('your-uuid', 'http://your-domain.com', {
    themeColor: '#059669',
    title: 'Custom Assistant',
    subtitle: 'How can I help?',
    position: 'bottom-right',
    size: { width: 420, height: 600 }
  });
</script>
```

## Files

- **`public/widget.js`**: The embed script that users include on their websites
  - Pure JavaScript (no build required)
  - Creates and positions the iframe
  - Handles configuration
  - Works in both development and production

- **`src/routes/WidgetPage.tsx`**: The React component that runs inside the iframe
  - Full chat functionality
  - Message streaming
  - Feedback system
  - Dynamic theming

## Development

### Testing Locally

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Create a test HTML file with the embed code:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Widget Test</title>
   </head>
   <body>
       <h1>Test Page</h1>
       
       <script type="text/javascript" src="http://localhost:5173/widget.js"></script>
       <script>
         addVezloChatWidget('test-uuid', 'http://localhost:5173');
       </script>
   </body>
   </html>
   ```

3. Open the HTML file in your browser

### Testing via Config Page

1. Go to `http://localhost:5173/config`
2. Configure your widget
3. Copy the embed code from the "Embed" tab
4. Paste it into any HTML file

## Production

### Build

```bash
npm run build
```

### Deployment

The build process creates:
- Static assets in `dist/`
- `widget.js` is copied from `public/` to `dist/`

Deploy the `dist/` folder to your server or CDN.

### Update Embed Code

Users should update the base URL to your production domain:

```html
<script type="text/javascript" src="https://your-domain.com/widget.js"></script>
<script>
  addVezloChatWidget('your-uuid', 'https://your-domain.com');
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `themeColor` | string | `'#059669'` | Primary color for the widget |
| `title` | string | `'AI Assistant'` | Widget header title |
| `subtitle` | string | `'How can I help you today?'` | Widget header subtitle |
| `position` | string | `'bottom-right'` | Position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `size` | object | `{ width: 420, height: 600 }` | Widget dimensions |
| `placeholder` | string | `'Type your message...'` | Input placeholder text |
| `welcomeMessage` | string | `'Hello! I\'m your AI assistant...'` | Initial message |

## Benefits

✅ **Simple**: Just 2 lines of code to embed
✅ **Production Ready**: Works in both dev and production
✅ **No CORS Issues**: Uses iframe for isolation
✅ **Fully Functional**: All features work inside the iframe
✅ **Customizable**: Full configuration options
✅ **Single App**: No separate builds needed

## Notes

- The widget uses iframe isolation for security and compatibility
- All chat functionality works the same as in the main app
- The iframe automatically adjusts position based on config
- No build step needed for the widget script (it's plain JS)

