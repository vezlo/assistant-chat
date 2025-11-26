import { useState, useEffect } from 'react';
import { MessageCircle, LogIn, User, Sparkles, Send } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getConversations, getConversationMessages, joinConversation, closeConversation, sendAgentMessage } from '@/api/conversations';
import type { ConversationListItem, ConversationMessage } from '@/api/conversations';
import { formatDistanceToNow } from 'date-fns';
import { subscribeToConversations, type MessageCreatedPayload, type ConversationCreatedPayload } from '@/services/conversationRealtime';

export function ConversationsTab() {
  const { token, user } = useApp();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationListItem | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newConversationIds, setNewConversationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.profile?.company_uuid) {
      console.warn('[Realtime] No company_uuid found in user profile, cannot subscribe');
      return;
    }

    const cleanup = subscribeToConversations(
      user.profile.company_uuid,
      handleMessageCreated,
      handleConversationCreated
    );

    return cleanup;
  }, [user?.profile?.company_uuid, selectedConversation?.uuid]);

  const loadConversations = async () => {
    if (!token) return;
    
    setIsLoadingConversations(true);
    setError(null);
    try {
      const response = await getConversations(token, 1, 20);
      setConversations(response.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationUuid: string) => {
    if (!token) return;
    
    setIsLoadingMessages(true);
    setError(null);
    try {
      const response = await getConversationMessages(token, conversationUuid, 1, 50);
      setMessages(response.messages.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleConversationClick = (conversation: ConversationListItem) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.uuid);
    // Remove "new" badge when clicked
    setNewConversationIds(prev => {
      const updated = new Set(prev);
      updated.delete(conversation.uuid);
      return updated;
    });
  };

  const handleMessageCreated = (payload: MessageCreatedPayload) => {
    // Update conversation list
    setConversations(prev => prev.map(conv => 
      conv.uuid === payload.conversation_uuid
        ? {
            ...conv,
            message_count: payload.conversation_update.message_count,
            last_message_at: payload.conversation_update.last_message_at,
            joined_at: payload.conversation_update.joined_at || conv.joined_at,
            closed_at: payload.conversation_update.closed_at || conv.closed_at,
            status: payload.conversation_update.status || conv.status
          }
        : conv
    ));

    // If this conversation is currently selected, append the message
    if (selectedConversation?.uuid === payload.conversation_uuid) {
      setMessages(prev => [...prev, payload.message]);
      
      // Update selected conversation state with joined_at and status
      setSelectedConversation(prev => prev ? { 
        ...prev, 
        message_count: payload.conversation_update.message_count || prev.message_count,
        joined_at: payload.conversation_update.joined_at || prev.joined_at,
        closed_at: payload.conversation_update.closed_at || prev.closed_at,
        status: payload.conversation_update.status || prev.status 
      } : null);
    }
  };

  const handleConversationCreated = (payload: ConversationCreatedPayload) => {
    // Add new conversation to the top of the list
    const newConversation: ConversationListItem = {
      uuid: payload.conversation.uuid,
      status: payload.conversation.status,
      message_count: payload.conversation.message_count,
      last_message_at: payload.conversation.last_message_at,
      joined_at: null,
      closed_at: null,
      created_at: payload.conversation.created_at,
      updated_at: payload.conversation.created_at
    };

    setConversations(prev => [newConversation, ...prev]);
    
    // Mark as new
    setNewConversationIds(prev => new Set([...prev, newConversation.uuid]));
  };

  const handleJoinConversation = async () => {
    if (!token || !selectedConversation) return;

    setIsJoining(true);
    setError(null);
    try {
      await joinConversation(token, selectedConversation.uuid);
      // The realtime update will handle UI changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join conversation');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!token || !selectedConversation) return;

    setIsClosing(true);
    setError(null);
    try {
      const response = await closeConversation(token, selectedConversation.uuid);
      const closedAt = response.message.created_at;
      setSelectedConversation(prev =>
        prev
          ? { ...prev, closed_at: closedAt, status: 'closed' }
          : prev
      );
      setConversations(prev =>
        prev.map(conv =>
          conv.uuid === selectedConversation.uuid
            ? { ...conv, closed_at: closedAt, status: 'closed' }
            : conv
        )
      );
      // realtime update handles UI
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close conversation');
    } finally {
      setIsClosing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!token || !selectedConversation || !messageContent.trim()) return;

    setIsSending(true);
    setError(null);
    try {
      await sendAgentMessage(token, selectedConversation.uuid, messageContent.trim());
      setMessageContent('');
      // The realtime update will handle UI changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getAvatarColor = (uuid: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-rose-500 to-rose-600',
      'from-orange-500 to-orange-600',
      'from-amber-500 to-amber-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
    ];
    const hash = uuid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (uuid: string) => {
    return uuid.slice(0, 2).toUpperCase();
  };

  const groupMessagesByDate = (messages: ConversationMessage[]) => {
    const groups: { [key: string]: ConversationMessage[] } = {};
    messages.forEach((msg) => {
      const date = new Date(msg.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-50">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : error && conversations.length === 0 ? (
            <div className="p-4 text-center text-red-500 text-sm">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <button
                  key={conv.uuid}
                  onClick={() => handleConversationClick(conv)}
                  className={`w-full p-4 text-left transition-all duration-200 cursor-pointer group ${
                    selectedConversation?.uuid === conv.uuid
                      ? 'bg-emerald-50 border-l-4 border-emerald-600'
                      : 'border-l-4 border-transparent hover:bg-gray-50 hover:border-l-4 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all bg-gradient-to-br ${getAvatarColor(conv.uuid)} text-white font-semibold text-[10px] shadow-md`}>
                      {getInitials(conv.uuid)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium truncate ${
                          selectedConversation?.uuid === conv.uuid
                            ? 'text-emerald-900'
                            : 'text-gray-900'
                        }`}>
                          Conversation #{conv.uuid.slice(0, 8)}
                        </span>
                        {newConversationIds.has(conv.uuid) && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ml-2 text-blue-700 bg-blue-100 animate-pulse">
                            New
                          </span>
                        )}
                        {conv.message_count > 0 && (
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full ml-2 ${
                            selectedConversation?.uuid === conv.uuid
                              ? 'text-emerald-700 bg-emerald-200'
                              : 'text-emerald-600 bg-emerald-100'
                          }`}>
                            {conv.message_count}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`capitalize font-medium ${
                          conv.status === 'in_progress'
                            ? 'text-blue-600'
                            : conv.status === 'closed'
                            ? 'text-gray-500'
                            : 'text-amber-600'
                        }`}>
                          {conv.status === 'in_progress' ? 'In Progress' : conv.status === 'closed' ? 'Closed' : conv.status}
                        </span>
                        <span className="text-gray-500">
                          {conv.last_message_at
                            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                            : formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Conversation #{selectedConversation.uuid.slice(0, 8)}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>
                    <span className="font-medium text-gray-900">{selectedConversation.message_count}</span> messages
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className={`font-medium capitalize ${
                    selectedConversation.status === 'in_progress'
                      ? 'text-blue-600'
                      : selectedConversation.status === 'closed'
                      ? 'text-gray-600'
                      : 'text-amber-600'
                  }`}>
                    {selectedConversation.status === 'in_progress'
                      ? 'In Progress'
                      : selectedConversation.status === 'closed'
                      ? 'Closed'
                      : selectedConversation.status}
                  </span>
                </div>
              </div>
              {!selectedConversation.joined_at ? (
                <button 
                  onClick={handleJoinConversation}
                  disabled={isJoining}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  {isJoining ? 'Joining...' : 'Join Conversation'}
                </button>
              ) : selectedConversation.closed_at ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-sm rounded-lg font-medium cursor-not-allowed opacity-80"
                >
                  Archive Conversation
                </button>
              ) : (
                <button 
                  onClick={handleCloseConversation}
                  disabled={isClosing}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                  <LogIn className="w-4 h-4 rotate-180" />
                  {isClosing ? 'Closing...' : 'Close Conversation'}
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-gray-50 p-6">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    <div className="text-gray-500">Loading messages...</div>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <MessageCircle className="w-16 h-16 text-gray-300" />
                    <div className="text-gray-500">No messages yet</div>
                  </div>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto space-y-6">
                  {Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date}>
                      {/* Date Separator */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="bg-white text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                          {date}
                        </div>
                      </div>

                      {/* Messages for this date */}
                      <div className="space-y-4">
                        {msgs.map((msg) => (
                          <div key={msg.uuid}>
                            {msg.type === 'system' ? (
                              /* System Message - Centered */
                              <div className="flex justify-center">
                                <div className={`text-xs px-4 py-2 rounded-full border ${
                                  msg.content.toLowerCase().includes('closed')
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <span>{msg.content}</span>
                                    <span className="text-xs opacity-70">
                                      {new Date(msg.created_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : msg.type === 'user' ? (
                              /* User Message - Right aligned */
                              <div className="flex justify-end">
                                <div className="max-w-[70%]">
                                  <div className="flex items-center justify-end gap-2 mb-1">
                                    <span className="text-xs font-semibold text-gray-600">
                                      Customer
                                    </span>
                                  </div>
                                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                      {msg.content}
                                    </div>
                                    <div className="flex items-center justify-end mt-0.5">
                                      <span className="text-[10px] text-emerald-200 opacity-70">
                                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Assistant/Agent Message - Left aligned with avatar */
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                                  msg.type === 'agent'
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md'
                                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md'
                                }`}>
                                  {msg.type === 'agent' ? (
                                    <User className="w-4 h-4 text-white" />
                                  ) : (
                                    <Sparkles className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <div className="max-w-[65%]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-semibold ${
                                      msg.type === 'agent' ? 'text-blue-700' : 'text-emerald-700'
                                    }`}>
                                      {msg.type === 'agent' ? 'Agent' : 'Assistant'}
                                    </span>
                                  </div>
                                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                    <div className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                                      {msg.content}
                                    </div>
                                    <div className="flex items-center justify-end mt-0.5">
                                      <span className="text-[10px] text-gray-400">
                                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Editor */}
            <div className="bg-white border-t border-gray-100 shadow-lg px-4 py-3">
              <div className={`relative rounded-xl border overflow-hidden ${
                selectedConversation.joined_at && !selectedConversation.closed_at
                  ? 'border-emerald-300 bg-white'
                  : 'border-emerald-300 bg-gray-100'
              }`}>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && selectedConversation.joined_at && !selectedConversation.closed_at && !isSending) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={!selectedConversation.joined_at || !!selectedConversation.closed_at || isSending}
                  placeholder={
                    selectedConversation.closed_at
                      ? 'Conversation is closed'
                      : selectedConversation.joined_at
                      ? 'Type your message...'
                      : 'Join the conversation to send messages...'
                  }
                  className={`w-full block bg-transparent px-4 py-3 pr-12 text-sm resize-none focus:outline-none placeholder:text-gray-400 border-none ${
                    selectedConversation.joined_at && !selectedConversation.closed_at
                      ? 'text-gray-900 cursor-text'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  rows={3}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!selectedConversation.joined_at || !!selectedConversation.closed_at || isSending || !messageContent.trim()}
                  className={`absolute right-3 bottom-3 p-2 rounded-lg border ${
                    selectedConversation.joined_at && !selectedConversation.closed_at && !isSending && messageContent.trim()
                      ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600 cursor-pointer'
                      : 'border-emerald-300 bg-white text-emerald-300 cursor-not-allowed'
                  }`}
                  title={
                    selectedConversation.closed_at
                      ? 'Conversation is closed'
                      : selectedConversation.joined_at
                      ? 'Send message'
                      : 'Join the conversation to enable messaging'
                  }
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full animate-pulse"></div>
                </div>
                <MessageCircle className="w-16 h-16 text-emerald-600 mx-auto relative z-10" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-sm text-gray-500">Select a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

