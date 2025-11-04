/**
 * Conversation API Service
 * Handles conversation creation and management
 */

export interface CreateConversationRequest {
  title: string;
  user_uuid: string;
  company_uuid: string;
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

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

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


