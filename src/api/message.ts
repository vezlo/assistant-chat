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

export interface StreamChunkEvent {
  type: 'chunk';
  content: string;
  done?: boolean; // Marks the last chunk (streaming complete, but no UUID yet)
  sources?: Array<{
    document_uuid: string;
    document_title: string;
    chunk_indices: number[];
  }>;
}

export interface StreamCompletionEvent {
  type: 'completion';
  uuid: string;
  parent_message_uuid: string;
  status: 'completed';
  created_at: string;
}

export interface StreamErrorEvent {
  type: 'error';
  error: string;
  message: string;
}

export type StreamEvent = StreamChunkEvent | StreamCompletionEvent | StreamErrorEvent;

export interface StreamCallbacks {
  onChunk?: (content: string, isDone?: boolean, sources?: Array<{document_uuid: string; document_title: string; chunk_indices: number[]}>) => void;
  onCompletion?: (data: StreamCompletionEvent) => void;
  onError?: (error: StreamErrorEvent) => void;
  onDone?: () => void;
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
 * Generate AI response for a user message (legacy - returns full response)
 * @deprecated Use streamAIResponse for better performance
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

/**
 * Stream AI response using Server-Sent Events (SSE)
 * This is the recommended approach for real-time streaming
 */
export async function streamAIResponse(
  userMessageUuid: string,
  callbacks: StreamCallbacks,
  apiUrl?: string
): Promise<void> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/messages/${userMessageUuid}/generate`,
      {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
        },
      }
    );

    if (!response.ok) {
      // Try to parse error as JSON first
      try {
        const errorData = await response.json();
        callbacks.onError?.({
          type: 'error',
          error: 'Failed to generate response',
          message: errorData.message || `HTTP ${response.status}`,
        });
      } catch {
        // If not JSON, use status text
        callbacks.onError?.({
          type: 'error',
          error: 'Failed to generate response',
          message: `HTTP ${response.status}: ${response.statusText}`,
        });
      }
      return;
    }

    if (!response.body) {
      callbacks.onError?.({
        type: 'error',
        error: 'No response body',
        message: 'Server did not return a response stream',
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (lines ending with \n\n)
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            // Check for [DONE] marker
            if (data.trim() === '[DONE]') {
              callbacks.onDone?.();
              return;
            }

            try {
              const event: StreamEvent = JSON.parse(data);

              switch (event.type) {
                case 'chunk':
                  callbacks.onChunk?.(event.content, event.done, event.sources);
                  break;
                case 'completion':
                  callbacks.onCompletion?.(event);
                  callbacks.onDone?.();
                  return;
                case 'error':
                  callbacks.onError?.(event);
                  return;
              }
            } catch (parseError) {
              console.warn('[Message API] Failed to parse SSE event:', data, parseError);
              // Continue processing other events
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const lines = buffer.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') {
              callbacks.onDone?.();
              return;
            }
            try {
              const event: StreamEvent = JSON.parse(data);
              if (event.type === 'completion') {
                callbacks.onCompletion?.(event);
              } else if (event.type === 'error') {
                callbacks.onError?.(event);
              }
            } catch (parseError) {
              console.warn('[Message API] Failed to parse final SSE event:', parseError);
            }
          }
        }
      }

      callbacks.onDone?.();
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('[Message API] Error streaming AI response:', error);
    callbacks.onError?.({
      type: 'error',
      error: 'Stream error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

/**
 * Feedback API
 */

export interface SubmitFeedbackRequest {
  message_uuid: string;
  rating: 'positive' | 'negative';
  category?: string;
  comment?: string;
  suggested_improvement?: string;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  feedback: {
    uuid: string;
    message_uuid: string;
    rating: 'positive' | 'negative';
    category?: string;
    comment?: string;
    suggested_improvement?: string;
    created_at: string;
  };
}

export interface DeleteFeedbackResponse {
  success: boolean;
  message: string;
}

/**
 * Submit feedback for a message (create or update) - Public API
 */
export async function submitFeedback(
  request: SubmitFeedbackRequest,
  apiUrl?: string
): Promise<SubmitFeedbackResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;

  try {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to submit feedback: ${response.status}`);
    }

    const data: SubmitFeedbackResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[Message API] Error submitting feedback:', error);
    throw error;
  }
}

/**
 * Delete/undo feedback for a message - Public API
 */
export async function deleteFeedback(
  feedbackUuid: string,
  apiUrl?: string
): Promise<DeleteFeedbackResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;

  try {
    const response = await fetch(`${API_BASE_URL}/api/feedback/${feedbackUuid}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete feedback: ${response.status}`);
    }

    const data: DeleteFeedbackResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[Message API] Error deleting feedback:', error);
    throw error;
  }
}

