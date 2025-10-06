import type { AssistantServerResponse } from '@/types';
import { debugLog } from '@/utils';

export class AssistantServerService {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async sendMessage(message: string, conversationId?: string): Promise<AssistantServerResponse> {
    debugLog('Sending message to assistant server', { message, conversationId });

    try {
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      debugLog('Received response from assistant server', data);

      return {
        message: data.message || data.response || 'No response received',
        sources: data.sources || [],
        conversationId: data.conversationId || conversationId,
      };
    } catch (error) {
      debugLog('Error sending message to assistant server', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchKnowledge(query: string): Promise<AssistantServerResponse> {
    debugLog('Searching knowledge base', { query });

    try {
      const response = await fetch(`${this.apiUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      debugLog('Received search results', data);

      return {
        message: data.message || data.response || 'No results found',
        sources: data.sources || [],
      };
    } catch (error) {
      debugLog('Error searching knowledge base', error);
      throw new Error(`Failed to search knowledge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateConnection(): Promise<boolean> {
    debugLog('Validating connection to assistant server');

    try {
      const response = await fetch(`${this.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      debugLog('Connection validation failed', error);
      return false;
    }
  }
}
