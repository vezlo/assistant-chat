import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  getConversations,
  getConversationMessages,
  joinConversation,
  closeConversation,
  archiveConversation,
  sendAgentMessage,
} from '@/api/conversation';
import type { ConversationListItem, ConversationMessage } from '@/api/conversation';
import { subscribeToConversations, type MessageCreatedPayload, type ConversationCreatedPayload } from '@/services/conversationRealtime';
import { ConversationList } from '@/components/conversations/ConversationList';
import { ConversationChat } from '@/components/conversations/ConversationChat';
import { requestNotificationPermission, showNotification, truncateMessage } from '@/services/notificationService';
import { useIsAdmin } from '@/utils/useIsAdmin';

export function ConversationsTab() {
  const { token, user } = useApp();
  const isAdmin = useIsAdmin();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationListItem | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newConversationIds, setNewConversationIds] = useState<Set<string>>(new Set());
  const [conversationsPage, setConversationsPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const conversationsListRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (page: number = 1, append: boolean = false, status?: 'active' | 'archived') => {
    if (!token) return;
    
    const listElement = conversationsListRef.current;
    const previousScrollHeight = listElement?.scrollHeight || 0;
    const previousScrollTop = listElement?.scrollTop || 0;
    const clientHeight = listElement?.clientHeight || 0;
    const wasNearBottom = previousScrollHeight - previousScrollTop - clientHeight < 150;
    
    if (append) {
      setIsLoadingMoreConversations(true);
    } else {
      setIsLoadingConversations(true);
    }
    setError(null);
    try {
      const response = await getConversations(token, page, 20, 'last_message_at', undefined, status);
      if (append) {
        setConversations(prev => [...prev, ...response.conversations]);
      } else {
        setConversations(response.conversations);
      }
      setHasMoreConversations(response.pagination.has_more);
      setConversationsPage(page);
      
      // Maintain scroll position after appending new conversations
      if (append && listElement) {
        setTimeout(() => {
          const newScrollHeight = listElement.scrollHeight;
          if (wasNearBottom) {
            // User was at bottom, scroll to new bottom
            listElement.scrollTop = newScrollHeight - clientHeight;
          } else {
            // User was not at bottom, maintain scroll position
            listElement.scrollTop = previousScrollTop;
          }
        }, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      if (append) {
        setIsLoadingMoreConversations(false);
      } else {
        setIsLoadingConversations(false);
      }
    }
  }, [token]);

  const loadMessages = useCallback(async (conversationUuid: string, page: number = 1, prepend: boolean = false) => {
    if (!token) return;
    
    if (prepend) {
      setIsLoadingMoreMessages(true);
    } else {
      setIsLoadingMessages(true);
    }
    setError(null);
    try {
      const response = await getConversationMessages(token, conversationUuid, page, 6);
      const reversedMessages = response.messages.reverse();
      
      if (prepend) {
        // For pagination: capture scroll position before adding messages
        const messagesElement = messagesAreaRef.current;
        const previousScrollHeight = messagesElement?.scrollHeight || 0;
        
        setMessages(prev => [...reversedMessages, ...prev]);
        
        // After state update, adjust scroll position and push slightly down
        if (messagesElement) {
          setTimeout(() => {
            const newScrollHeight = messagesElement.scrollHeight;
            const scrollDifference = newScrollHeight - previousScrollHeight;
            // Push scroll down by adding 150px so user isn't stuck at the top
            messagesElement.scrollTop = scrollDifference + 150;
          }, 0);
        }
      } else {
        // For initial load: set messages and scroll to bottom
        setMessages(reversedMessages);
      }
      setHasMoreMessages(response.pagination.has_more);
      setMessagesPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      if (prepend) {
        setIsLoadingMoreMessages(false);
      } else {
        setIsLoadingMessages(false);
      }
    }
  }, [token]);

  const handleTabChange = useCallback((tab: 'active' | 'archived') => {
    setActiveTab(tab);
    setConversationsPage(1);
    setHasMoreConversations(false);
    setSelectedConversation(null);
    setMessages([]);
    setConversations([]);
    setIsLoadingConversations(true);
    loadConversations(1, false, tab);
  }, [loadConversations]);

  useEffect(() => {
    if (token) {
      setConversationsPage(1);
      setHasMoreConversations(false);
      loadConversations(1, false, activeTab);
    }
  }, [token, loadConversations, activeTab]);

      // Handle conversations list scroll
  useEffect(() => {
    const listElement = conversationsListRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom && hasMoreConversations && !isLoadingConversations && !isLoadingMoreConversations) {
        loadConversations(conversationsPage + 1, true, activeTab);
      }
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [hasMoreConversations, conversationsPage, isLoadingConversations, isLoadingMoreConversations, loadConversations]);

  // Scroll to bottom after initial message load
  useEffect(() => {
    const messagesElement = messagesAreaRef.current;
    if (!messagesElement || isLoadingMessages || messages.length === 0) return;
    
    // Only scroll to bottom on initial load (page 1) or when not loading more
    if (messagesPage === 1 && !isLoadingMoreMessages) {
      setTimeout(() => {
        messagesElement.scrollTop = messagesElement.scrollHeight;
      }, 0);
    }
  }, [messages, messagesPage, isLoadingMessages, isLoadingMoreMessages]);

  // Handle messages area scroll
  useEffect(() => {
    const messagesElement = messagesAreaRef.current;
    if (!messagesElement || !selectedConversation) return;

    const handleScroll = () => {
      const { scrollTop } = messagesElement;
      // Only trigger when at the very top (within 10px)
      const isAtTop = scrollTop <= 10;

      if (isAtTop && hasMoreMessages && !isLoadingMessages && !isLoadingMoreMessages) {
        loadMessages(selectedConversation.uuid, messagesPage + 1, true);
      }
    };

    messagesElement.addEventListener('scroll', handleScroll);
    return () => messagesElement.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, messagesPage, isLoadingMessages, isLoadingMoreMessages, selectedConversation, loadMessages]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.profile?.company_uuid) {
      console.warn('[Realtime] No company_uuid found in user profile, cannot subscribe');
      return;
    }

    const cleanup = subscribeToConversations(
      user.profile.company_uuid,
      handleMessageCreated,
      handleConversationCreated,
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    return cleanup;
  }, [user?.profile?.company_uuid, selectedConversation?.uuid]);

  const handleConversationClick = (conversation: ConversationListItem) => {
    // Clear messages immediately to show loading state
    setMessages([]);
    setSelectedConversation(conversation);
    setMessagesPage(1);
    setHasMoreMessages(false);
    loadMessages(conversation.uuid, 1, false);
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

    // Show notification only if:
    // 1. Message is not in currently selected conversation
    // 2. Message is not a system message
    // 3. Tab is not visible (handled in notificationService)
    if (selectedConversation?.uuid !== payload.conversation_uuid && payload.message.type !== 'system') {
      const authorName = payload.message.type === 'user' ? 'User' : payload.message.type === 'agent' ? 'Agent' : 'Assistant';
      const convId = payload.conversation_uuid.slice(0, 8);
      showNotification({
        title: `New message from ${authorName} - Conv #${convId}`,
        body: truncateMessage(payload.message.content),
        tag: payload.conversation_uuid,
        onClick: () => {
          // Find conversation in current list
          let conversation = conversations.find(c => c.uuid === payload.conversation_uuid);
          
          // If not in current tab, switch to the correct tab and reload
          if (!conversation) {
            const shouldBeActive = !payload.conversation_update.archived_at;
            const targetTab = shouldBeActive ? 'active' : 'archived';
            
            if (activeTab !== targetTab) {
              setActiveTab(targetTab);
              loadConversations(1, false, targetTab).then(() => {
                // After loading, find and select the conversation
                setConversations(prev => {
                  const found = prev.find(c => c.uuid === payload.conversation_uuid);
                  if (found) {
                    handleConversationClick(found);
                  }
                  return prev;
                });
              });
            }
          } else {
            handleConversationClick(conversation);
          }
        }
      });
    }

    // If this conversation is currently selected, append the message
    if (selectedConversation?.uuid === payload.conversation_uuid) {
      setMessages(prev => {
        // If a pending optimistic message exists, replace it
        const pendingIndex = prev.findIndex(
          msg => msg.pending && msg.type === payload.message.type && msg.content === payload.message.content
        );
        if (pendingIndex !== -1) {
          const updated = [...prev];
          updated[pendingIndex] = { ...payload.message };
          return updated;
        }

        const exists = prev.some(msg => msg.uuid === payload.message.uuid);
        if (exists) {
          return prev.map(msg => (msg.uuid === payload.message.uuid ? { ...payload.message } : msg));
        }

        return [...prev, payload.message];
      });
      
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
      archived_at: null,
      created_at: payload.conversation.created_at,
      updated_at: payload.conversation.created_at
    };

    setConversations(prev => [newConversation, ...prev]);
    
    // Mark as new
    setNewConversationIds(prev => new Set([...prev, newConversation.uuid]));

    // Show notification for new conversation
    const convId = payload.conversation.uuid.slice(0, 8);
    showNotification({
      title: `New Conversation - Conv #${convId}`,
      body: `New conversation started`,
      tag: payload.conversation.uuid,
      onClick: () => {
        // Ensure we're on active tab (new conversations are always active)
        if (activeTab !== 'active') {
          setActiveTab('active');
          loadConversations(1, false, 'active').then(() => {
            setConversations(prev => {
              const found = prev.find(c => c.uuid === payload.conversation.uuid);
              if (found) {
                handleConversationClick(found);
              }
              return prev;
            });
          });
        } else {
          handleConversationClick(newConversation);
        }
      }
    });
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

  const handleArchiveConversation = async () => {
    if (!token || !selectedConversation) return;

    setIsArchiving(true);
    setError(null);
    try {
      await archiveConversation(token, selectedConversation.uuid);
      
      // If on active tab, remove conversation from list and clear selection
      if (activeTab === 'active') {
        setConversations(prev =>
          prev.filter(conv => conv.uuid !== selectedConversation.uuid)
        );
        setSelectedConversation(null);
        setMessages([]);
      } else {
        // If on archived tab (shouldn't happen, but handle it), update the conversation
        setSelectedConversation(prev =>
          prev
            ? { ...prev, archived_at: new Date().toISOString(), status: 'archived' }
            : prev
        );
        setConversations(prev =>
          prev.map(conv =>
            conv.uuid === selectedConversation.uuid
              ? { ...conv, archived_at: new Date().toISOString(), status: 'archived' }
              : conv
          )
        );
      }
      
      // realtime update handles UI for other clients
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive conversation');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!token || !selectedConversation) return;
    const trimmed = messageContent.trim();
    if (!trimmed) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: ConversationMessage = {
      uuid: tempId,
      content: trimmed,
      type: 'agent',
      author_id: user?.id ? Number(user.id) : null,
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessageContent('');
    setIsSending(true);
    setError(null);

    try {
      const savedMessage = await sendAgentMessage(token, selectedConversation.uuid, trimmed);
      setMessages(prev => {
        const tempIndex = prev.findIndex(msg => msg.uuid === tempId);
        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = { ...savedMessage };
          return updated;
        }
        const exists = prev.some(msg => msg.uuid === savedMessage.uuid);
        if (exists) {
          return prev.map(msg => (msg.uuid === savedMessage.uuid ? { ...savedMessage } : msg));
        }
        return [...prev, savedMessage];
      });
    } catch (err) {
      setMessages(prev => prev.filter(msg => msg.uuid !== tempId));
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-50">
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        isLoading={isLoadingConversations}
        isLoadingMore={isLoadingMoreConversations}
        hasError={Boolean(error && conversations.length === 0)}
        errorMessage={error}
        newConversationIds={newConversationIds}
        onConversationClick={handleConversationClick}
        listRef={conversationsListRef}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <ConversationChat
        selectedConversation={selectedConversation}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        isLoadingMoreMessages={isLoadingMoreMessages}
        messagesAreaRef={messagesAreaRef}
        isJoining={isJoining}
        isClosing={isClosing}
        isArchiving={isArchiving}
        isSending={isSending}
        messageContent={messageContent}
        onMessageChange={setMessageContent}
        onSendMessage={handleSendMessage}
        onJoinConversation={handleJoinConversation}
        onCloseConversation={handleCloseConversation}
        onArchiveConversation={handleArchiveConversation}
        isAdmin={isAdmin}
      />
    </div>
  );
}

