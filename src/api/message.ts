/**
 * Message API Service
 * Handles message creation and AI response generation
 */

export interface CreateMessageRequest {
  content: string;
}

export interface MessageResponse {
  uuid: string;
  conversation_uuid: string;
  type: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface GenerateMessageResponse {
  uuid: string;
  parent_message_uuid: string;
  type: 'assistant';
  content: string;
  status: 'completed' | 'pending' | 'error';
  created_at: string;
}

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

/**
 * Create a user message in a conversation
 */
export async function createUserMessage(
  conversationUuid: string,
  request: CreateMessageRequest,
  apiUrl?: string
): Promise<MessageResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationUuid}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create message: ${response.status}`);
    }

    const data: MessageResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[Message API] Error creating user message:', error);
    throw error;
  }
}

/**
 * Generate AI response for a user message
 */
export async function generateAIResponse(
  userMessageUuid: string,
  apiUrl?: string
): Promise<GenerateMessageResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/messages/${userMessageUuid}/generate`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to generate response: ${response.status}`);
    }

    const data: GenerateMessageResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[Message API] Error generating AI response:', error);
    throw error;
  }
}


