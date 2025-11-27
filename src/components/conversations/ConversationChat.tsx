import { useMemo, type RefObject } from 'react';
import { MessageCircle, LogIn, User, Sparkles, Send, Loader2 } from 'lucide-react';
import type { ConversationListItem, ConversationMessage } from '@/api/conversation';

interface ConversationChatProps {
  selectedConversation: ConversationListItem | null;
  messages: ConversationMessage[];
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  messagesAreaRef: RefObject<HTMLDivElement | null>;
  isJoining: boolean;
  isClosing: boolean;
  isSending: boolean;
  messageContent: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onJoinConversation: () => void;
  onCloseConversation: () => void;
}

function groupMessagesByDate(messages: ConversationMessage[]) {
  const groups: Record<string, ConversationMessage[]> = {};
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
}

export function ConversationChat({
  selectedConversation,
  messages,
  isLoadingMessages,
  isLoadingMoreMessages,
  messagesAreaRef,
  isJoining,
  isClosing,
  isSending,
  messageContent,
  onMessageChange,
  onSendMessage,
  onJoinConversation,
  onCloseConversation,
}: ConversationChatProps) {
  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
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
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-gray-900">Conversation #{selectedConversation.uuid.slice(0, 8)}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>
              <span className="font-medium text-gray-900">{selectedConversation.message_count}</span> messages
            </span>
            <span className="text-gray-300">•</span>
            <span
              className={`font-medium capitalize ${
                selectedConversation.status === 'in_progress'
                  ? 'text-blue-600'
                  : selectedConversation.status === 'closed'
                  ? 'text-gray-600'
                  : 'text-amber-600'
              }`}
            >
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
            onClick={onJoinConversation}
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
            onClick={onCloseConversation}
            disabled={isClosing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            <LogIn className="w-4 h-4 rotate-180" />
            {isClosing ? 'Closing...' : 'Close Conversation'}
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-gray-50 p-6" ref={messagesAreaRef}>
        {isLoadingMessages && messages.length === 0 ? (
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
            {isLoadingMoreMessages && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  <span>Loading older messages...</span>
                </div>
              </div>
            )}
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
                          <div
                            className={`text-xs px-4 py-2 rounded-full border ${
                              msg.content.toLowerCase().includes('closed')
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span>{msg.content}</span>
                              <span className="text-xs opacity-70">
                                {new Date(msg.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
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
                              <span className="text-xs font-semibold text-gray-600">Customer</span>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                              <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
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
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                              msg.type === 'agent'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md'
                                : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md'
                            }`}
                          >
                            {msg.type === 'agent' ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="max-w-[65%]">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs font-semibold ${
                                  msg.type === 'agent' ? 'text-blue-700' : 'text-emerald-700'
                                }`}
                              >
                                {msg.type === 'agent' ? 'Agent' : 'Assistant'}
                              </span>
                            </div>
                            <div
                              className={`bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm relative ${
                                msg.pending ? 'opacity-70' : ''
                              }`}
                            >
                              {msg.pending && msg.type === 'agent' && (
                                <div className="absolute -top-3 right-3 bg-white rounded-full p-1 shadow-sm">
                                  <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" aria-label="Sending" />
                                </div>
                              )}
                              <div className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                                {msg.content}
                              </div>
                              <div className="flex items-center justify-end mt-0.5 gap-2">
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
        <div
          className={`relative rounded-xl border overflow-hidden ${
            selectedConversation.joined_at && !selectedConversation.closed_at
              ? 'border-emerald-300 bg-white'
              : 'border-emerald-300 bg-gray-100'
          }`}
        >
          <textarea
            value={messageContent}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && selectedConversation.joined_at && !selectedConversation.closed_at && !isSending) {
                e.preventDefault();
                onSendMessage();
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
              selectedConversation.joined_at && !selectedConversation.closed_at ? 'text-gray-900 cursor-text' : 'text-gray-400 cursor-not-allowed'
            }`}
            rows={3}
          />
          <button
            onClick={onSendMessage}
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
    </div>
  );
}

