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
  supabaseUrl?: string; // Supabase URL for realtime updates
  supabaseAnonKey?: string; // Supabase anon key for realtime updates
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  type?: 'user' | 'assistant' | 'agent' | 'system'; // Message type from realtime updates
  timestamp: Date;
  sources?: ChatSource[];
  validation?: {
    confidence: number;
    valid: boolean;
    status: string;
    accuracy?: {
      verified: boolean;
      verification_rate: number;
      reason?: string;
    };
    hallucination?: {
      detected: boolean;
      risk: number;
      reason?: string;
    };
    context?: {
      source_relevance: number;
      source_usage_rate: number;
      valid: boolean;
    };
  };
  _realUuid?: string; // Internal field for tracking real message UUID during streaming
}

export interface ChatSource {
  document_uuid: string;
  document_title: string;
  chunk_indices: number[];
  title?: string; // Deprecated, use document_title
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
  VITE_DEV_MODE: boolean;
  VITE_DEBUG_MODE: boolean;
}


