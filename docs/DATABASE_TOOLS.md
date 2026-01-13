# Database Tools Feature

## Overview
The Database Tools feature allows administrators to connect external Supabase databases and create AI-powered tools for natural language data access.

## Location
The Database Tools configuration is **only available in the admin dashboard**, accessible via the **"Database Tools"** tab in the Assistant Chat configuration page.

## User Interface

### Setup Flow
1. **Database Configuration**
   - Enter Supabase URL and service role key
   - Validate connection
   - Save configuration

2. **Select Tables & Columns**
   - Select tables to create tools for
   - Choose which columns to expose
   - Columns load automatically with visual feedback

3. **Configure Tools**
   - Set tool name and description
   - Choose ID column and type
   - Enable user-specific filtering (optional)
   - Configure filter column and context key

4. **Manage Tools**
   - View all created tools
   - Edit tool configurations
   - Delete tools
   - Create additional tools

### UI Components
- **Component**: `src/components/database/DatabaseToolsTab.tsx`
- **API Client**: `src/api/databaseTools.ts`
- **Routes**: Isolated to admin dashboard only

## Widget Integration

The Database Tools feature does **NOT** affect the widget UI. Users interact with data naturally through chat:

```
User: "show my profile"
AI: Here's your profile information...
```

### Passing User Context

**Embed Code:**
```javascript
addVezloChatWidget('WIDGET_UUID', 'API_URL', {
  userContext: {
    user_uuid: 'ce7f61f4-...',
    company_uuid: '45e2b2d9-...'
  }
});
```

**NPM Package:**
```jsx
import { Widget } from '@vezlo/assistant-chat';

<Widget
  config={{
    uuid: 'WIDGET_UUID',
    apiUrl: 'API_URL',
    userContext: {
      user_uuid: currentUser.uuid,
      company_uuid: currentUser.companyUuid
    }
  }}
/>
```

## Features

### Schema Caching
Table schemas are cached after first load for instant re-selection.

### Toast Notifications
Success/error messages appear in top-right corner (24px from top/right) with standard styling and auto-dismiss after 5 seconds.

### Loading States
- Database connection validation
- Table list loading
- Schema introspection per table
- Tool creation/update/deletion

### Edit Functionality
Existing tools can be edited to update:
- Tool name and description
- Selected columns
- ID column configuration
- User filtering settings

## Security
- Only admin users can configure database tools
- Credentials are encrypted in backend storage
- Widget users only see their own data through AI responses
- No direct database access from widget

---

**Last Updated**: January 2026  
**Vezlo Version**: 1.9.0
