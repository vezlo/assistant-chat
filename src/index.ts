// Export the main Widget component for library usage
export { Widget } from './components/Widget.js';
export type { WidgetProps } from './components/Widget.js';

// Export types
export type { 
  WidgetConfig, 
  ChatMessage, 
  ChatSource, 
  ChatState, 
  AssistantServerResponse 
} from './types/index.js';

// Export utilities
export { 
  generateId, 
  formatTimestamp, 
  validateWidgetConfig, 
  parseSize, 
  getEnvConfig, 
  debugLog 
} from './utils/index.js';

// Export theme
export { THEME } from './config/theme.js';

