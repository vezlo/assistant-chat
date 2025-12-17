import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let clientUrl: string | null = null;
let clientKey: string | null = null;

function getClient(supabaseUrl?: string, supabaseAnonKey?: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[ConversationRealtime] Missing supabaseUrl or supabaseAnonKey');
    return null;
  }

  // Recreate the client if credentials change
  if (!client || clientUrl !== supabaseUrl || clientKey !== supabaseAnonKey) {
    try {
      client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, // Prevent multiple auth instances warning
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        realtime: { params: { eventsPerSecond: 2 } },
      });
      clientUrl = supabaseUrl;
      clientKey = supabaseAnonKey;
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
    closed_at?: string;
    archived_at?: string;
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
  onConversationCreated: (payload: ConversationCreatedPayload) => void,
  supabaseUrl?: string,
  supabaseAnonKey?: string
): () => void {
  try {
    const realtimeClient = getClient(supabaseUrl, supabaseAnonKey);
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

