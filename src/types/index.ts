// Core types for the assistant chat widget

export interface WidgetConfig {
  uuid: string;
  theme: 'light' | 'dark';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size: {
    width: number;
    height: number;
  };
  title: string;
  subtitle?: string;
  placeholder?: string;
  welcomeMessage?: string;
  apiUrl: string;
  apiKey: string;
  themeColor?: string;
  defaultOpen?: boolean; // New parameter to control default open state
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: ChatSource[];
}

export interface ChatSource {
  title: string;
  url?: string;
  content?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
  isOpen: boolean;
}

export interface AssistantServerResponse {
  message: string;
  sources?: ChatSource[];
  conversationId?: string;
}

export interface WidgetProps {
  config: WidgetConfig;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

// Environment variables
export interface EnvConfig {
  VITE_ASSISTANT_SERVER_URL: string;
  VITE_ASSISTANT_SERVER_API_KEY: string;
  VITE_WIDGET_DEFAULT_THEME: 'light' | 'dark';
  VITE_WIDGET_DEFAULT_POSITION: string;
  VITE_WIDGET_DEFAULT_SIZE: string;
  VITE_DEV_MODE: boolean;
  VITE_DEBUG_MODE: boolean;
}


