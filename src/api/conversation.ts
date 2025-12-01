/**
 * Conversation API Service
 * Handles conversation creation, listing, and agent messaging
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface CreateConversationRequest {
  title?: string;
}

export interface ConversationResponse {
  uuid: string;
  title: string;
  user_uuid: string;
  company_uuid: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationListItem {
  uuid: string;
  status: string;
  message_count: number;
  last_message_at: string | null;
  joined_at: string | null;
  closed_at: string | null;
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
  pending?: boolean;
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

export interface JoinConversationResponse {
  message: ConversationMessage;
}

const parseErrorMessage = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return (
    (data as { error?: string; message?: string }).error ||
    (data as { error?: string; message?: string }).message ||
    'Unexpected server error'
  );
};

/**
 * Create a new conversation
 */
export async function createConversation(
  request: CreateConversationRequest,
  apiUrl?: string
): Promise<ConversationResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create conversation: ${response.status}`);
    }

    const data: ConversationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[Conversation API] Error creating conversation:', error);
    throw error;
  }
}

/**
 * Get conversation by UUID
 */
export async function getConversation(uuid: string, apiUrl?: string): Promise<ConversationResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${uuid}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.status}`);
    }

    const data: ConversationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[Conversation API] Error getting conversation:', error);
    throw error;
  }
}

/**
 * Get paginated conversations for agent UI
 */
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

/**
 * Get messages within a conversation
 */
export async function getConversationMessages(
  token: string,
  conversationUuid: string,
  page = 1,
  pageSize = 50,
  apiUrl?: string
): Promise<ConversationMessagesResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationUuid}/messages?page=${page}&page_size=${pageSize}`,
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

/**
 * Join a conversation as an agent
 */
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

/**
 * Close a conversation as an agent
 */
export async function closeConversation(
  token: string,
  conversationUuid: string,
  apiUrl?: string
): Promise<JoinConversationResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationUuid}/close`,
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

/**
 * Send agent-authored message
 */
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


