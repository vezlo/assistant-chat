/**
 * Conversations API Service
 * Handles fetching conversations and messages for human agent support
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface ConversationListItem {
  uuid: string;
  status: string;
  message_count: number;
  last_message_at: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
  };
}

export interface ConversationMessage {
  uuid: string;
  content: string;
  type: 'user' | 'assistant' | 'agent' | 'system';
  author_id: number | null;
  created_at: string;
}

export interface ConversationMessagesResponse {
  messages: ConversationMessage[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
  };
}

const parseErrorMessage = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return (data as { error?: string; message?: string }).error || (data as { error?: string; message?: string }).message || 'Unexpected server error';
};

export async function getConversations(
  token: string,
  page = 1,
  pageSize = 20,
  orderBy = 'last_message_at',
  apiUrl?: string
): Promise<ConversationListResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(
    `${API_BASE_URL}/api/conversations?page=${page}&page_size=${pageSize}&order_by=${orderBy}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as ConversationListResponse;
}

export async function getConversationMessages(
  token: string,
  conversationUuid: string,
  page = 1,
  pageSize = 50,
  order = 'desc',
  apiUrl?: string
): Promise<ConversationMessagesResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationUuid}/messages?page=${page}&page_size=${pageSize}&order=${order}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as ConversationMessagesResponse;
}

export interface JoinConversationResponse {
  success: boolean;
  message: ConversationMessage;
}

export async function joinConversation(
  token: string,
  conversationUuid: string,
  apiUrl?: string
): Promise<JoinConversationResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationUuid}/join`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as JoinConversationResponse;
}

export async function sendAgentMessage(
  token: string,
  conversationUuid: string,
  content: string,
  apiUrl?: string
): Promise<ConversationMessage> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationUuid}/messages/agent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as ConversationMessage;
}

