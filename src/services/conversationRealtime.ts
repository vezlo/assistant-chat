import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[ConversationRealtime] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    return null;
  }

  if (!client) {
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: { params: { eventsPerSecond: 2 } },
      });
    } catch (error) {
      console.error('[ConversationRealtime] Failed to initialize client:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  return client;
}

export interface MessageCreatedPayload {
  conversation_uuid: string;
  message: {
    uuid: string;
    content: string;
    type: 'user' | 'assistant' | 'agent' | 'system';
    author_id: number | null;
    created_at: string;
  };
  conversation_update: {
    message_count: number;
    last_message_at: string;
    joined_at?: string;
    status?: string;
  };
}

export interface ConversationCreatedPayload {
  conversation: {
    uuid: string;
    status: string;
    message_count: number;
    last_message_at: string | null;
    created_at: string;
  };
}

export function subscribeToConversations(
  companyUuid: string,
  onMessageCreated: (payload: MessageCreatedPayload) => void,
  onConversationCreated: (payload: ConversationCreatedPayload) => void
): () => void {
  try {
    const realtimeClient = getClient();
    if (!realtimeClient) {
      console.error('[ConversationRealtime] Client not available');
      return () => {};
    }

    const channelName = `company:${companyUuid}:conversations`;
    const channel: RealtimeChannel = realtimeClient.channel(channelName, {
      config: {
        broadcast: { self: true, ack: false }
      }
    });

    channel.on('broadcast', { event: 'message:created' }, ({ payload }) => {
      console.info('[Realtime] Received update:', payload);
      onMessageCreated(payload as MessageCreatedPayload);
    });

    channel.on('broadcast', { event: 'conversation:created' }, ({ payload }) => {
      console.info('[Realtime] Received update:', payload);
      onConversationCreated(payload as ConversationCreatedPayload);
    });

    channel.subscribe((status, err) => {
      if (err) {
        console.error('[Realtime] Subscription failed:', err.message || err);
      } else if (status === 'SUBSCRIBED') {
        console.info(`[Realtime] Subscribed to channel: ${channelName}`);
      }
    });

    return () => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.error('[Realtime] Unsubscribe error:', error instanceof Error ? error.message : 'Unknown error');
      }
    };
  } catch (error) {
    console.error('[Realtime] Failed to setup listener:', error instanceof Error ? error.message : 'Unknown error');
    return () => {};
  }
}

