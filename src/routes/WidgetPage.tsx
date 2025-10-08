import { useState, useEffect } from 'react';
import type { ChatMessage, WidgetConfig } from '@/types';
import { generateId } from '@/utils';
import { useParams, useLocation } from 'react-router-dom';
import { THEME } from '@/config/theme';
import { Widget } from '@/components/Widget';

export function WidgetPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const location = useLocation();
  
  // Default config, can be overridden by URL params
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    uuid: uuid || generateId(),
    theme: 'light',
    position: 'bottom-right',
    size: { width: 420, height: 600 },
    title: 'AI Assistant',
    subtitle: 'How can I help you today?',
    placeholder: 'Type your message...',
    welcomeMessage: 'Hello! I\'m your AI assistant. How can I help you today?',
    apiUrl: 'http://localhost:3000',
    apiKey: 'your_api_key_here',
    themeColor: THEME.primary.hex, // Modern teal/cyan
    defaultOpen: false, // Default to closed for embedded widgets
  });

  const [isPlayground, setIsPlayground] = useState(false);

  useEffect(() => {
    // Parse config from URL parameters
    const params = new URLSearchParams(location.search);
    const configParam = params.get('config');
    const playgroundParam = params.get('playground');
    
    if (configParam) {
      try {
        const decodedConfig = JSON.parse(decodeURIComponent(configParam));
        setWidgetConfig(prev => ({ ...prev, ...decodedConfig }));
        
        // Only open by default if it's the playground
        if (playgroundParam === 'true') {
          setIsPlayground(true);
          setWidgetConfig(prev => ({ ...prev, defaultOpen: true }));
        }
      } catch (error) {
        console.error('Failed to parse widget config from URL:', error);
      }
    }
  }, [location.search]);

  // Hide scrollbars when in iframe mode
  useEffect(() => {
    const isInIframe = window.parent !== window;
    if (isInIframe) {
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
      // Remove default margins/padding that can cause scrollbars in iframe
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      if (isInIframe) {
        document.documentElement.style.height = '';
        document.body.style.height = '';
        document.documentElement.style.margin = '';
        document.documentElement.style.padding = '';
        document.body.style.margin = '';
        document.body.style.padding = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
  }, []);

  const handleMessage = (message: ChatMessage) => {
    console.log('[WidgetPage] Message received:', message);
  };

  const handleError = (error: string) => {
    console.error('[WidgetPage] Error:', error);
  };

  return (
    <Widget
      config={widgetConfig}
      isPlayground={isPlayground}
      onMessage={handleMessage}
      onError={handleError}
    />
  );
}
