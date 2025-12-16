import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ConversationListItem } from '@/api/conversation';
import type { RefObject } from 'react';

interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedConversation: ConversationListItem | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  errorMessage?: string | null;
  newConversationIds: Set<string>;
  onConversationClick: (conversation: ConversationListItem) => void;
  listRef: RefObject<HTMLDivElement | null>;
  activeTab: 'active' | 'archived';
  onTabChange: (tab: 'active' | 'archived') => void;
}

const avatarColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-rose-500 to-rose-600',
  'from-orange-500 to-orange-600',
  'from-amber-500 to-amber-600',
  'from-teal-500 to-teal-600',
  'from-cyan-500 to-cyan-600',
];

function getAvatarColor(uuid: string) {
  const hash = uuid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}

function getInitials(uuid: string) {
  return uuid.slice(0, 2).toUpperCase();
}

export function ConversationList({
  conversations,
  selectedConversation,
  isLoading,
  isLoadingMore,
  hasError,
  errorMessage,
  newConversationIds,
  onConversationClick,
  listRef,
  activeTab,
  onTabChange,
}: ConversationListProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          <button
            onClick={() => onTabChange('active')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onTabChange('archived')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'archived'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Archived
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" ref={listRef}>
        {isLoading && conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Loading conversations...</div>
        ) : hasError && conversations.length === 0 ? (
          <div className="p-4 text-center text-red-500 text-sm">{errorMessage}</div>
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
                onClick={() => onConversationClick(conv)}
                className={`w-full p-4 text-left transition-all duration-200 cursor-pointer group ${
                  selectedConversation?.uuid === conv.uuid
                    ? 'bg-emerald-50 border-l-4 border-emerald-600'
                    : 'border-l-4 border-transparent hover:bg-gray-50 hover:border-l-4 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all bg-gradient-to-br ${getAvatarColor(
                      conv.uuid
                    )} text-white font-semibold text-[10px] shadow-md`}
                  >
                    {getInitials(conv.uuid)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium truncate ${
                          selectedConversation?.uuid === conv.uuid ? 'text-emerald-900' : 'text-gray-900'
                        }`}
                      >
                        Conversation #{conv.uuid.slice(0, 8)}
                      </span>
                      {newConversationIds.has(conv.uuid) && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ml-2 text-blue-700 bg-blue-100 animate-pulse">
                          New
                        </span>
                      )}
                      {conv.message_count > 0 && (
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full ml-2 ${
                            selectedConversation?.uuid === conv.uuid
                              ? 'text-emerald-700 bg-emerald-200'
                              : 'text-emerald-600 bg-emerald-100'
                          }`}
                        >
                          {conv.message_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`capitalize font-medium ${
                          conv.archived_at
                            ? 'text-purple-600'
                            : conv.status === 'in_progress'
                            ? 'text-blue-600'
                            : conv.status === 'closed'
                            ? 'text-gray-500'
                            : 'text-amber-600'
                        }`}
                      >
                        {conv.archived_at ? 'Archived' : conv.status === 'in_progress' ? 'In Progress' : conv.status === 'closed' ? 'Closed' : conv.status}
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
            {isLoadingMore && (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  <span>Loading more conversations...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

