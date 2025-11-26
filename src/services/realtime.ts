import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type AuthBroadcastPayload = {
  uuid: string;
  name: string;
  email: string;
  role: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Realtime] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
    return null;
  }

  if (!client) {
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: { params: { eventsPerSecond: 2 } },
      });
    } catch (error) {
      console.error('[Realtime] Failed to initialize client:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  return client;
}

/**
 * Initialize Supabase Realtime client connection
 * Call this on app load to establish the WebSocket connection
 */
export function initializeRealtime(): boolean {
  try {
    const realtimeClient = getClient();
    if (realtimeClient) {
      console.info('[Realtime] Initialized and connected');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Realtime] Initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

export function listenForAuthBroadcast(
  onPayload: (payload: AuthBroadcastPayload) => void
): () => void {
  try {
    const realtimeClient = getClient();
    if (!realtimeClient) {
      return () => {};
    }

    const channel = realtimeClient.channel('vezlo_authenticated', {
      config: {
        broadcast: { self: true, ack: false }
      }
    });

    channel.on('broadcast', { event: 'me_payload' }, ({ payload }) => {
      onPayload(payload as AuthBroadcastPayload);
    });

    channel.subscribe((status, err) => {
      if (err) {
        console.error('[Realtime] Subscription failed:', err.message || err);
      } else if (status === 'SUBSCRIBED') {
        console.info('[Realtime] Subscribed to channel: vezlo_authenticated');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel connection failed:', status);
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
    console.error('[Realtime] Failed to setup broadcast listener:', error instanceof Error ? error.message : 'Unknown error');
    return () => {};
  }
}


