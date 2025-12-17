import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Send, X, MessageCircle, Bot, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import type { ChatMessage, WidgetConfig } from '../types/index.js';
import { generateId, formatTimestamp } from '../utils/index.js';
import { markdownToHtml } from '../utils/markdown.js';
import { VezloFooter } from './ui/VezloFooter.js';
import { CitationView } from './ui/CitationView.js';
import { createConversation, createUserMessage, streamAIResponse } from '../api/index.js';
import { submitFeedback, deleteFeedback } from '../api/message.js';
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
  const [messageFeedbackUuids, setMessageFeedbackUuids] = useState<{[key: string]: string}>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
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
  const inputRef = useRef<HTMLInputElement>(null);
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
            type: 'assistant' as const, // Set type for button visibility
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
            type: 'assistant' as const, // Set type for button visibility
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

  // Auto-focus input when it becomes enabled (isLoading becomes false)
  useEffect(() => {
    if (isOpen && !isLoading && !conversationClosed && inputRef.current) {
      // Focus immediately when input becomes enabled
      inputRef.current.focus();
    }
  }, [isLoading, isOpen, conversationClosed]);

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
      () => {}, // No need to handle conversation:created in widget
      config.supabaseUrl,
      config.supabaseAnonKey
    );

    return cleanup;
  }, [companyUuid, conversationUuid, config.supabaseUrl, config.supabaseAnonKey]);

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
        // Initialize streaming state
        setStreamingMessage('');
        let accumulatedContent = '';
        let hasReceivedChunks = false;
        let streamingComplete = false;
        const tempMessageId = `streaming-${userMessageResponse.uuid}`;

        // Stream AI response using SSE
        await streamAIResponse(
          userMessageResponse.uuid,
          {
            onChunk: (chunk, isDone, sources) => {
              // Hide loading indicator on first chunk (streaming started)
              if (!hasReceivedChunks) {
                hasReceivedChunks = true;
                setIsLoading(false);
              }
              
              // Accumulate content and update streaming message
              if (chunk) {
                accumulatedContent += chunk;
                setStreamingMessage(accumulatedContent);
              }
              
              // If this is the final chunk (done=true), convert to message immediately
              if (isDone && !streamingComplete) {
                streamingComplete = true;
                
                console.log('Stream complete, sources:', sources);
                
                // Add message to array with temp ID and sources
                const tempMessage: ChatMessage = {
                  id: tempMessageId,
                  content: accumulatedContent,
                  role: 'assistant',
                  type: 'assistant', // Set type for button visibility
                  timestamp: new Date(),
                  sources: sources && sources.length > 0 ? sources.map(s => ({
                    document_uuid: s.document_uuid,
                    document_title: s.document_title,
                    chunk_indices: s.chunk_indices
                  })) : undefined
                };
                
                setStreamingMessage('');
                setMessages((prev) => [...prev, tempMessage]);
              }
            },
            onCompletion: (completionData) => {
              // Store real UUID in _realUuid field (for feedback) without changing id (no jerk)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempMessageId
                    ? { ...msg, _realUuid: completionData.uuid }
                    : msg
                )
              );
              
              setIsLoading(false);
              
              const finalMessage: ChatMessage = {
                id: completionData.uuid,
                content: accumulatedContent,
                role: 'assistant',
                type: 'assistant', // Set type for button visibility
                timestamp: new Date(completionData.created_at),
              };
              onMessage?.(finalMessage);

              // Log completion (no content in event anymore)
              console.log('[Widget] AI response completed:', {
                uuid: completionData.uuid,
                parent_message_uuid: completionData.parent_message_uuid,
                status: completionData.status,
                created_at: completionData.created_at,
                accumulated_content_length: accumulatedContent.length
              });
            },
            onError: (errorData) => {
              // Hide loading indicator
              setIsLoading(false);
              
              // Clear streaming message
              setStreamingMessage('');

              // Show error to user
              const errorMessage = errorData.message || errorData.error || 'Failed to generate response';
              onError?.(errorMessage);
              
              console.error('[Widget] AI response error:', errorData);
            },
            onDone: () => {
              // Ensure loading is hidden
              setIsLoading(false);
            },
          },
          config.apiUrl
        );
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
        type: 'assistant', // Set type for button visibility
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

  const handleCopyMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;
    
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleFeedback = async (messageId: string, type: 'like' | 'dislike') => {
    // Find the message to get the real UUID (might be stored in _realUuid)
    const message = messages.find(m => m.id === messageId);
    
    // Safety check: Don't proceed if message has temp ID and no real UUID yet
    if (!message?._realUuid && messageId.startsWith('streaming-')) {
      console.warn('[Widget] Cannot submit feedback: Message UUID not yet available');
      return;
    }
    
    const realUuid = message?._realUuid || messageId; // Use real UUID if available, fallback to ID
    
    const currentFeedback = messageFeedback[messageId];
    const feedbackUuid = messageFeedbackUuids[messageId];
    
    // Map UI types to backend rating values
    const rating = type === 'like' ? 'positive' : 'negative';
    
    // Optimistic UI update - update immediately for better UX
    const previousFeedback = currentFeedback;
    const previousUuid = feedbackUuid;
    
    // If clicking the same rating again, delete (undo)
    if (currentFeedback === type && feedbackUuid) {
      // Optimistically update UI (remove feedback)
      setMessageFeedback(prev => ({
        ...prev,
        [messageId]: null
      }));
      setMessageFeedbackUuids(prev => {
        const updated = { ...prev };
        delete updated[messageId];
        return updated;
      });
      
      // Call API in background
      try {
        await deleteFeedback(feedbackUuid, config.apiUrl);
      } catch (error) {
        console.error('[Widget] Error deleting feedback:', error);
        // Revert UI state on error
        setMessageFeedback(prev => ({
          ...prev,
          [messageId]: previousFeedback
        }));
        setMessageFeedbackUuids(prev => ({
          ...prev,
          [messageId]: previousUuid
        }));
      }
    } else {
      // Optimistically update UI (add/change feedback)
      setMessageFeedback(prev => ({
        ...prev,
        [messageId]: type
      }));
      
      // Call API in background
      try {
        const response = await submitFeedback(
          {
            message_uuid: realUuid,
            rating,
          },
          config.apiUrl
        );
        
        // Update with real feedback UUID from server
        setMessageFeedbackUuids(prev => ({
          ...prev,
          [messageId]: response.feedback.uuid
        }));
      } catch (error) {
        console.error('[Widget] Error submitting feedback:', error);
        // Revert UI state on error
        setMessageFeedback(prev => ({
          ...prev,
          [messageId]: previousFeedback
        }));
        setMessageFeedbackUuids(prev => {
          if (previousUuid) {
            return { ...prev, [messageId]: previousUuid };
          } else {
            const updated = { ...prev };
            delete updated[messageId];
            return updated;
          }
        });
      }
    }
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
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
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
              className="hover:bg-white/20 rounded-lg p-2 transition-all duration-200 hover:scale-110 relative z-10 cursor-pointer"
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
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    ) : (
                      <div>
                        <div 
                          className="text-sm prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-pre:my-2 prose-code:text-xs [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-words"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
                        />
                        {message.sources && message.sources.length > 0 && (
                          <CitationView sources={message.sources} />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-xs ${
                        message.role === 'user' ? 'text-emerald-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </p>
                    
                    {message.role === 'assistant' && message.type === 'assistant' && (() => {
                      // Check if message has real UUID (not temp ID)
                      // Disable if: message has temp ID (starts with 'streaming-') AND no _realUuid yet
                      const isTempId = message.id?.startsWith('streaming-') || false;
                      const hasRealUuid = !!message._realUuid;
                      const isDisabled = isTempId && !hasRealUuid;
                      
                      return (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleCopyMessage(message.id)}
                            className="p-1 rounded transition-all duration-200 hover:scale-110 cursor-pointer text-gray-400 hover:text-gray-600"
                            title="Copy response"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => !isDisabled && handleFeedback(message.id, 'like')}
                            disabled={isDisabled}
                            className={`p-1 rounded transition-all duration-200 ${
                              isDisabled
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:scale-110 cursor-pointer'
                            } ${
                              messageFeedback[message.id] === 'like'
                                ? 'text-green-600'
                                : 'text-gray-400 hover:text-green-600'
                            }`}
                            title={isDisabled ? 'Waiting for message to be saved...' : 'Like this response'}
                          >
                            <ThumbsUp className={`w-4 h-4 ${messageFeedback[message.id] === 'like' ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => !isDisabled && handleFeedback(message.id, 'dislike')}
                            disabled={isDisabled}
                            className={`p-1 rounded transition-all duration-200 ${
                              isDisabled
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:scale-110 cursor-pointer'
                            } ${
                              messageFeedback[message.id] === 'dislike'
                                ? 'text-red-600'
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                            title={isDisabled ? 'Waiting for message to be saved...' : 'Dislike this response'}
                          >
                            <ThumbsDown className={`w-4 h-4 ${messageFeedback[message.id] === 'dislike' ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      );
                    })()}
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
                ref={inputRef}
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
