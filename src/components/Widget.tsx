import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Send, X, MessageCircle, Bot, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ChatMessage, WidgetConfig } from '../types/index.js';
import { generateId, formatTimestamp } from '../utils/index.js';
import { VezloFooter } from './ui/VezloFooter.js';
import { createConversation, createUserMessage, generateAIResponse } from '../api/index.js';
import { subscribeToConversations, type MessageCreatedPayload } from '../services/conversationRealtime.js';
import { THEME } from '../config/theme.js';

export interface WidgetProps {
  config: WidgetConfig;
  isPlayground?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
  useShadowRoot?: boolean;
}

export function Widget({ 
  config, 
  isPlayground = false, 
  onOpen, 
  onClose, 
  onMessage, 
  onError,
  useShadowRoot = false,
}: WidgetProps) {
  // Use defaultOpen from config, fallback to isPlayground for backward compatibility
  const [isOpen, setIsOpen] = useState(config.defaultOpen ?? isPlayground);
  
  // Update isOpen when config.defaultOpen changes
  useEffect(() => {
    if (config.defaultOpen !== undefined) {
      setIsOpen(config.defaultOpen);
    }
  }, [config.defaultOpen]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [conversationUuid, setConversationUuid] = useState<string | null>(null);
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [agentJoined, setAgentJoined] = useState(false);
  const [conversationClosed, setConversationClosed] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const shadowMountRef = useRef<HTMLDivElement | null>(null);
  const [shadowReady, setShadowReady] = useState(false);

  useEffect(() => {
    // No global scroll locking for embedded component usage
    return () => {};
  }, [isPlayground]);

  // Initialize Shadow DOM if enabled
  useEffect(() => {
    if (!useShadowRoot) return;
    if (!hostRef.current) return;

    if (!shadowRef.current) {
      shadowRef.current = hostRef.current.attachShadow({ mode: 'open' });

      // Create a dedicated mount point inside the shadow for React
      const mount = document.createElement('div');
      mount.setAttribute('id', 'vezlo-shadow-mount');
      shadowRef.current.appendChild(mount);
      shadowMountRef.current = mount;

      // Clone existing styles into shadow to ensure Tailwind/host CSS is available
      try {
        const headNodes = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'));
        headNodes.forEach((node) => {
          shadowRef.current?.appendChild(node.cloneNode(true));
        });
      } catch {}

      // Mark shadow as ready to trigger a re-render for the portal
      setShadowReady(true);
    }
  }, [useShadowRoot]);

  // Create conversation when widget opens for the first time
  useEffect(() => {
    const initializeConversation = async () => {
      if (isOpen && !conversationUuid && !isCreatingConversation) {
        setIsCreatingConversation(true);
        try {
          // Create a new conversation
          const conversation = await createConversation({
            title: 'New Chat',
          }, config.apiUrl);

          setConversationUuid(conversation.uuid);
          setCompanyUuid(conversation.company_uuid);
          setAgentJoined(false);
          setConversationClosed(false);
          console.log('[Widget] Conversation created:', conversation.uuid, 'Company:', conversation.company_uuid);

          // Add welcome message after conversation is created
          const welcomeMsg = {
            id: generateId(),
            content: config.welcomeMessage || 'Hello! I\'m your AI assistant. How can I help you today?',
            role: 'assistant' as const,
            timestamp: new Date(),
          };
          setMessages([welcomeMsg]);
          onMessage?.(welcomeMsg);
        } catch (error) {
          console.error('[Widget] Failed to create conversation:', error);
          onError?.('Failed to initialize conversation');
          // Still show welcome message even if conversation creation fails
          const welcomeMsg = {
            id: generateId(),
            content: config.welcomeMessage || 'Hello! I\'m your AI assistant. How can I help you today?',
            role: 'assistant' as const,
            timestamp: new Date(),
          };
          setMessages([welcomeMsg]);
          onMessage?.(welcomeMsg);
        } finally {
          setIsCreatingConversation(false);
        }
      }
    };

    initializeConversation();
  }, [isOpen, conversationUuid, isCreatingConversation, config.welcomeMessage, onMessage, onError]);

  // Subscribe to realtime updates for agent messages
  useEffect(() => {
    if (!companyUuid || !conversationUuid) {
      return;
    }

    const handleMessageCreated = (payload: MessageCreatedPayload) => {
      if (payload.conversation_uuid !== conversationUuid) {
        return;
      }

      const status = payload.conversation_update?.status;
      if (status === 'in_progress') {
        setAgentJoined(true);
        setConversationClosed(false);
      } else if (status === 'closed') {
        setAgentJoined(false);
        setConversationClosed(true);
      }

      if (payload.message.type !== 'system' && payload.message.type !== 'agent') {
        return;
      }

      const newMessage: ChatMessage = {
        id: payload.message.uuid,
        content: payload.message.content,
        role: payload.message.type === 'agent' ? 'assistant' : 'system',
        timestamp: new Date(payload.message.created_at),
      };

      setMessages(prev => [...prev, newMessage]);
    };

    const cleanup = subscribeToConversations(
      companyUuid,
      handleMessageCreated,
      () => {} // No need to handle conversation:created in widget
    );

    return cleanup;
  }, [companyUuid, conversationUuid]);

  useEffect(() => {
    // Scroll to bottom when messages change or when streaming
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !conversationUuid || conversationClosed) return;

    const userMessageContent = input;
    const userMessage: ChatMessage = {
      id: generateId(),
      content: userMessageContent,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    onMessage?.(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Create user message via API
      const userMessageResponse = await createUserMessage(conversationUuid, {
        content: userMessageContent,
      }, config.apiUrl);

      console.log('[Widget] User message created:', userMessageResponse.uuid);

      // Update the user message with the actual UUID from server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, id: userMessageResponse.uuid } : msg
        )
      );

      // Step 2: Generate AI response (only if agent hasn't joined)
      if (!agentJoined) {
        // Keep loading indicator visible until AI response is received
        const aiResponse = await generateAIResponse(userMessageResponse.uuid, config.apiUrl);

        console.log('[Widget] AI response received:', aiResponse.uuid);

        // Hide loading indicator now that we have the response
        setIsLoading(false);

        // Stream the AI response character by character
        const responseContent = aiResponse.content;
        setStreamingMessage('');

        let currentText = '';
        const streamInterval = setInterval(() => {
          if (currentText.length < responseContent.length) {
            currentText += responseContent[currentText.length];
            setStreamingMessage(currentText);
          } else {
            clearInterval(streamInterval);
            // Add the complete message to messages array
            const assistantMessage: ChatMessage = {
              id: aiResponse.uuid,
              content: responseContent,
              role: 'assistant',
              timestamp: new Date(aiResponse.created_at),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            onMessage?.(assistantMessage);
            setStreamingMessage('');
          }
        }, 15); // 15ms delay between characters for smooth streaming
      } else {
        // Agent has joined, don't generate AI response
        setIsLoading(false);
        console.log('[Widget] Skipping AI response - agent has joined');
      }

    } catch (error) {
      console.error('[Widget] Error sending message:', error);
      setIsLoading(false);
      onError?.('Failed to send message');
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      onMessage?.(errorMessage);
    }
  };

  const handleStartNewChat = () => {
    if (isCreatingConversation) return;
    setMessages([]);
    setStreamingMessage('');
    setIsLoading(false);
    setMessageFeedback({});
    setAgentJoined(false);
    setConversationClosed(false);
    setConversationUuid(null);
    setCompanyUuid(null);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (conversationClosed) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type
    }));
  };

  const handleOpenWidget = () => {
    setIsOpen(true);
    onOpen?.();
    // Notify parent window (for embed mode)
    if (window.parent && !isPlayground) {
      window.parent.postMessage({ type: 'vezlo-widget-opened' }, '*');
    }
  };

  const handleCloseWidget = () => {
    setIsOpen(false);
    onClose?.();
    // Notify parent window (for embed mode)
    if (window.parent && !isPlayground) {
      window.parent.postMessage({ type: 'vezlo-widget-closed' }, '*');
    }
  };

  // Fixed positioning styles for embedded usage (non-playground)
  const isBottomRight = (config as any).position !== 'bottom-left';
  const isInIframe = window.parent !== window;
  const containerStyle: React.CSSProperties = isPlayground
    ? {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }
    : isInIframe
    ? {
        // When in iframe, don't add positioning - let iframe handle it
        position: 'relative',
        zIndex: 2147483647,
        pointerEvents: 'none', // container lets clicks pass unless on inner elements
      }
    : {
        position: 'fixed',
        zIndex: 2147483647,
        bottom: 20,
        right: isBottomRight ? 20 : undefined,
        left: !isBottomRight ? 20 : undefined,
        pointerEvents: 'none', // container lets clicks pass unless on inner elements
      };

  const content = (
    <div id="vezlo-widget-root" className={``} style={containerStyle}>
      {/* Inline critical keyframes to avoid host CSS/Tailwind dependency */}
      <style
        // Using unique, prefixed names to avoid collisions with host styles
        dangerouslySetInnerHTML={{
          __html: `
@keyframes vezloDotPulse { 0%, 80%, 100% { opacity: .2; transform: scale(0.8);} 40% { opacity: 1; transform: scale(1);} }
@keyframes vezloCaretBlink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
          `
        }}
      />
      {/* Chat Button */}
      {!isOpen && (
        <div
          className="relative animate-fadeIn"
          style={{ pointerEvents: 'auto', width: 64, height: 64 }}
        >
          {/* Subtle Pulse Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: config.themeColor || THEME.primary.hex,
              borderRadius: 9999,
              opacity: 0.2,
              filter: 'blur(0px)'
            }}
          />

          <button
            onClick={handleOpenWidget}
            style={{
              position: 'relative',
              width: 64,
              height: 64,
              borderRadius: 9999,
              color: '#fff',
              background: `linear-gradient(135deg, ${config.themeColor || THEME.primary.hex}, ${config.themeColor || THEME.primary.hex}dd)`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 14px 30px rgba(0,0,0,0.22)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 25px rgba(0,0,0,0.20)';
            }}
          >
            <MessageCircle className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-fadeIn"
          style={{
            pointerEvents: 'auto',
            width: (config.size && (config.size as any).width) ? (config.size as any).width : 420,
            height: (config.size && (config.size as any).height) ? (config.size as any).height : 600
          }}
        >
          {/* Header */}
          <div className="text-white p-4 flex justify-between items-center relative overflow-hidden" style={{ background: `linear-gradient(to right, ${config.themeColor || THEME.primary.hex}, ${config.themeColor || THEME.primary.hex}dd, ${config.themeColor || THEME.primary.hex}bb)`, color: '#fff' }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              {/* Bot Icon */}
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg leading-tight truncate">{config.title}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                  <p className="text-xs text-white/90 truncate">Online • {config.subtitle}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleCloseWidget}
              className="hover:bg-white/20 rounded-lg p-2 transition-all duration-200 hover:scale-110 relative z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'system' 
                    ? 'justify-center' 
                    : message.role === 'user' 
                    ? 'justify-end' 
                    : 'justify-start'
                } animate-fadeIn`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.role === 'system' ? (
                  <div className={`text-xs px-4 py-2 rounded-full border ${
                    message.content.toLowerCase().includes('closed')
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <span>{message.content}</span>
                      <span className="text-xs opacity-70">{formatTimestamp(message.timestamp)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2 border border-emerald-100">
                        <Bot className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                    
                    <div className="flex flex-col max-w-[75%]">
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                          message.role === 'user'
                            ? 'text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                        style={{
                          backgroundColor: message.role === 'user' ? (config.themeColor || THEME.primary.hex) : undefined,
                          boxShadow: message.role === 'user' 
                            ? `0 4px 12px ${(config.themeColor || THEME.primary.hex)}4D` // 4D is ~30% opacity
                            : '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      </div>
                  
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={`text-xs ${
                            message.role === 'user' ? 'text-emerald-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTimestamp(message.timestamp)}
                        </p>
                        
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleFeedback(message.id, 'like')}
                              className={`p-1 rounded transition-all duration-200 hover:scale-110 cursor-pointer ${
                                messageFeedback[message.id] === 'like'
                                  ? 'text-green-600'
                                  : 'text-gray-400 hover:text-green-600'
                              }`}
                            >
                              <ThumbsUp className={`w-4 h-4 ${messageFeedback[message.id] === 'like' ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'dislike')}
                          className={`p-1 rounded transition-all duration-200 hover:scale-110 cursor-pointer ${
                            messageFeedback[message.id] === 'dislike'
                              ? 'text-red-600'
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                        >
                          <ThumbsDown className={`w-4 h-4 ${messageFeedback[message.id] === 'dislike' ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Streaming Message */}
            {streamingMessage && (
              <div className="flex justify-start animate-fadeIn">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2 border border-emerald-100">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                
                <div className="flex flex-col max-w-[75%]">
                  <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed" style={{ color: '#111827' }}>
                      {streamingMessage}
                      <span style={{ display: 'inline-block', animation: 'vezloCaretBlink 1s steps(1, end) infinite' }}>|</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className="flex gap-1" style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: config.themeColor || THEME.primary.hex, display: 'inline-block', animation: 'vezloDotPulse 1s infinite ease-in-out', animationDelay: '0s' }} />
                    <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: config.themeColor || THEME.primary.hex, display: 'inline-block', animation: 'vezloDotPulse 1s infinite ease-in-out', animationDelay: '0.15s' }} />
                    <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: config.themeColor || THEME.primary.hex, display: 'inline-block', animation: 'vezloDotPulse 1s infinite ease-in-out', animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Start New Chat Button (when closed) */}
          {conversationClosed && (
            <div className="border-t border-gray-200 p-4 bg-white flex justify-center">
              <button
                onClick={handleStartNewChat}
                disabled={isCreatingConversation}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
              >
                {isCreatingConversation ? 'Starting new chat...' : 'Start New Chat'}
              </button>
            </div>
          )}

          {/* Input */}
          {!conversationClosed && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  conversationClosed
                    ? 'Conversation closed. Start a new chat to continue.'
                    : config.placeholder
                }
                disabled={isLoading || conversationClosed}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm transition-all duration-200 placeholder:text-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || conversationClosed}
                className="text-white px-4 py-3 rounded-2xl transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:scale-100 min-w-[48px]"
                style={{ 
                  background: `linear-gradient(to right, ${config.themeColor || THEME.primary.hex}, ${config.themeColor || THEME.primary.hex}dd)`,
                  opacity: (!input.trim() || isLoading || conversationClosed) ? 0.6 : 1
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 bg-gradient-to-r from-gray-50 to-white" style={{ minHeight: 52 }}>
            <VezloFooter size="sm" />
          </div>
        </div>
      )}
    </div>
  );

  if (useShadowRoot) {
    // Ensure host exists in DOM
    return (
      <div ref={hostRef} style={{ all: 'initial' }}>
        {shadowReady && shadowMountRef.current ? createPortal(content, shadowMountRef.current) : null}
      </div>
    );
  }

  return content;
}
