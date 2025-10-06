import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Bot, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ChatMessage, WidgetConfig } from '@/types';
import { generateId, formatTimestamp } from '@/utils';
import { useParams, useLocation } from 'react-router-dom';
import { THEME } from '@/config/theme';
import { VezloFooter } from '@/components/ui/VezloFooter';
import { createConversation, createUserMessage, generateAIResponse } from '@/api';

export function WidgetPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [conversationUuid, setConversationUuid] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  });

  const [isPlayground, setIsPlayground] = useState(false);

  useEffect(() => {
    // Prevent scrollbars in widget mode
    if (!isPlayground) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      // Cleanup
      if (!isPlayground) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
  }, [isPlayground]);

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
          setIsOpen(true);
          setIsPlayground(true);
        }
      } catch (error) {
        console.error('Failed to parse widget config from URL:', error);
      }
    }
  }, [location.search]);

  // Create conversation when widget opens for the first time
  useEffect(() => {
    const initializeConversation = async () => {
      if (isOpen && !conversationUuid && !isCreatingConversation) {
        setIsCreatingConversation(true);
        try {
          // Create a new conversation
          const userUuid = import.meta.env.VITE_DEFAULT_USER_UUID || 'user-' + generateId().substring(0, 8);
          const companyUuid = import.meta.env.VITE_DEFAULT_COMPANY_UUID || 'company-' + generateId().substring(0, 8);
          
          const conversation = await createConversation({
            title: 'New Chat',
            user_uuid: userUuid,
            company_uuid: companyUuid,
          });

          setConversationUuid(conversation.uuid);
          console.log('[Widget] Conversation created:', conversation.uuid);

          // Add welcome message after conversation is created
          setMessages([
            {
              id: generateId(),
              content: widgetConfig.welcomeMessage || 'Hello! I\'m your AI assistant. How can I help you today?',
              role: 'assistant',
              timestamp: new Date(),
            },
          ]);
        } catch (error) {
          console.error('[Widget] Failed to create conversation:', error);
          // Still show welcome message even if conversation creation fails
          setMessages([
            {
              id: generateId(),
              content: widgetConfig.welcomeMessage || 'Hello! I\'m your AI assistant. How can I help you today?',
              role: 'assistant',
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsCreatingConversation(false);
        }
      }
    };

    initializeConversation();
  }, [isOpen, conversationUuid, isCreatingConversation, widgetConfig.welcomeMessage]);

  useEffect(() => {
    // Scroll to bottom when messages change or when streaming
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !conversationUuid) return;

    const userMessageContent = input;
    const userMessage: ChatMessage = {
      id: generateId(),
      content: userMessageContent,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Create user message via API
      const userMessageResponse = await createUserMessage(conversationUuid, {
        content: userMessageContent,
      });

      console.log('[Widget] User message created:', userMessageResponse.uuid);

      // Update the user message with the actual UUID from server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, id: userMessageResponse.uuid } : msg
        )
      );

      // Step 2: Generate AI response
      // Keep loading indicator visible until AI response is received
      const aiResponse = await generateAIResponse(userMessageResponse.uuid);

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
          setStreamingMessage('');
        }
      }, 15); // 15ms delay between characters for smooth streaming

    } catch (error) {
      console.error('[Widget] Error sending message:', error);
      setIsLoading(false);
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
    // Notify parent window (for embed mode)
    if (window.parent && !isPlayground) {
      window.parent.postMessage({ type: 'vezlo-widget-opened' }, '*');
    }
  };

  const handleCloseWidget = () => {
    setIsOpen(false);
    // Notify parent window (for embed mode)
    if (window.parent && !isPlayground) {
      window.parent.postMessage({ type: 'vezlo-widget-closed' }, '*');
    }
  };

  return (
    <div className={isPlayground ? "flex items-center justify-center min-h-screen bg-transparent" : "flex items-center justify-center w-screen h-screen overflow-hidden"} style={{ margin: 0, padding: 0 }}>
      {/* Chat Button */}
      {!isOpen && (
        <div className="relative animate-fadeIn">
          {/* Subtle Pulse Animation */}
          <div className="absolute inset-0 bg-emerald-600 rounded-full animate-pulse opacity-20"></div>
          
          <button
            onClick={handleOpenWidget}
            className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 text-white w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
          >
            <MessageCircle className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[420px] h-[600px] flex flex-col border border-gray-100 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="text-white p-4 flex justify-between items-center relative overflow-hidden" style={{ background: `linear-gradient(to right, ${widgetConfig.themeColor}, ${widgetConfig.themeColor}dd, ${widgetConfig.themeColor}bb)` }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{widgetConfig.title}</h3>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-emerald-100">Online • {widgetConfig.subtitle}</p>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2">
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
                      backgroundColor: message.role === 'user' ? widgetConfig.themeColor : undefined,
                      boxShadow: message.role === 'user' 
                        ? `0 4px 12px ${widgetConfig.themeColor}4D` // 4D is ~30% opacity
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
              </div>
            ))}

            {/* Streaming Message */}
            {streamingMessage && (
              <div className="flex justify-start animate-fadeIn">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                
                <div className="flex flex-col max-w-[75%]">
                  <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {streamingMessage}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
                    {isLoading && (
                      <div className="flex justify-start animate-fadeIn">
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={widgetConfig.placeholder}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm transition-all duration-200"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="text-white px-4 py-3 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:scale-100"
                style={{ background: `linear-gradient(to right, ${widgetConfig.themeColor}, ${widgetConfig.themeColor}dd)` }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100">
            <VezloFooter size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
