/**
 * Vezlo Chat Widget Embed Script
 * This script creates an iframe that loads the chat widget from the main application
 */

(function() {
  'use strict';

  /**
   * Creates and initializes the Vezlo Chat Widget
   * @param {string} uuid - Unique identifier for the widget instance
   * @param {string} baseUrl - Base URL of the Vezlo application
   * @param {object} config - Optional configuration overrides
   */
  window.addVezloChatWidget = function(uuid, baseUrl, config) {
    try {
      // Validate inputs
      if (!uuid || typeof uuid !== 'string') {
        console.error('[Vezlo Widget] Invalid UUID provided');
        return;
      }
      
      if (!baseUrl || typeof baseUrl !== 'string') {
        console.error('[Vezlo Widget] Invalid base URL provided');
        return;
      }

      // Default configuration
      const defaultConfig = {
        theme: 'light',
        position: 'bottom-right',
        size: { width: 420, height: 600 },
        title: 'AI Assistant',
        subtitle: 'How can I help you today?',
        placeholder: 'Type your message...',
        welcomeMessage: "Hello! I'm your AI assistant. How can I help you today?",
        apiUrl: baseUrl,
        apiKey: '',
        themeColor: '#059669'
      };

      // Merge with user config
      const mergedConfig = Object.assign({}, defaultConfig, config || {});

      // Build iframe URL with config
      const configParam = encodeURIComponent(JSON.stringify(mergedConfig));
      const iframeUrl = `${baseUrl}/widget/${uuid}?config=${configParam}`;

      // Create iframe element
      const iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.id = `vezlo-chat-widget-${uuid}`;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
      
      // Position styles based on config
      const position = mergedConfig.position || 'bottom-right';
      const size = mergedConfig.size || { width: 420, height: 600 };
      const margin = 20;

      let positionStyles = '';
      let transformOrigin = 'bottom right'; // Default for bottom-right
      
      switch (position) {
        case 'bottom-right':
          positionStyles = `bottom: ${margin}px; right: ${margin}px;`;
          transformOrigin = 'bottom right';
          break;
        case 'bottom-left':
          positionStyles = `bottom: ${margin}px; left: ${margin}px;`;
          transformOrigin = 'bottom left';
          break;
        case 'top-right':
          positionStyles = `top: ${margin}px; right: ${margin}px;`;
          transformOrigin = 'top right';
          break;
        case 'top-left':
          positionStyles = `top: ${margin}px; left: ${margin}px;`;
          transformOrigin = 'top left';
          break;
        default:
          positionStyles = `bottom: ${margin}px; right: ${margin}px;`;
          transformOrigin = 'bottom right';
      }

      // Apply initial styles (sized for bubble with extra space for animations)
      iframe.style.cssText = `
        position: fixed;
        ${positionStyles}
        width: 100px;
        height: 100px;
        border: none;
        background: transparent;
        z-index: 2147483647;
        transition: all 0.3s ease;
        pointer-events: none;
        transform-origin: ${transformOrigin};
      `;
      
      // Allow interaction with iframe content
      iframe.addEventListener('load', function() {
        iframe.style.pointerEvents = 'auto';
      });

      // Listen for messages from iframe to adjust size
      window.addEventListener('message', function(event) {
        if (event.data.type === 'vezlo-widget-opened') {
          // Widget opened - expand iframe
          iframe.style.width = size.width + 'px';
          iframe.style.height = size.height + 'px';
          iframe.style.borderRadius = '16px';
          iframe.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
        } else if (event.data.type === 'vezlo-widget-closed') {
          // Widget closed - shrink to bubble
          iframe.style.width = '100px';
          iframe.style.height = '100px';
          iframe.style.borderRadius = '0';
          iframe.style.boxShadow = 'none';
        }
      });

      // Append to body
      document.body.appendChild(iframe);

      console.log('[Vezlo Widget] Widget initialized successfully', { uuid, baseUrl });
    } catch (error) {
      console.error('[Vezlo Widget] Error initializing widget:', error);
    }
  };

  // Auto-initialize if data attributes are present
  window.addEventListener('DOMContentLoaded', function() {
    const script = document.querySelector('script[data-vezlo-uuid]');
    if (script) {
      const uuid = script.getAttribute('data-vezlo-uuid');
      const baseUrl = script.getAttribute('data-vezlo-url') || window.location.origin;
      if (uuid) {
        window.addVezloChatWidget(uuid, baseUrl);
      }
    }
  });
})();

