// Streaming service - manages WebSocket connection and quote streaming
import { WSClient, ConnectionState, AuthState } from './wsClient';
import { quotesStore } from '../stores/quotesStore';
import { keyManager } from './keyManager';
import type { QuoteUpdatePayload } from '../api/contracts/etoro-api.types';

export type StreamingStateCallback = (state: {
  connectionState: ConnectionState;
  authState: AuthState;
}) => void;

class StreamingService {
  private wsClient: WSClient | null = null;
  private subscribers: Set<StreamingStateCallback> = new Set();
  private connectionState: ConnectionState = 'disconnected';
  private authState: AuthState = 'unauthenticated';
  private quoteUnsubscribe: (() => void) | null = null;

  get isConnected(): boolean {
    return this.wsClient?.isConnected ?? false;
  }

  get isAuthenticated(): boolean {
    return this.wsClient?.isAuthenticated ?? false;
  }

  get currentConnectionState(): ConnectionState {
    return this.connectionState;
  }

  get currentAuthState(): AuthState {
    return this.authState;
  }

  connect(): void {
    if (this.wsClient?.isConnected) {
      console.log('[StreamingService] Already connected');
      return;
    }

    const keys = keyManager.getKeys();
    if (!keys) {
      console.warn('[StreamingService] No API keys configured');
      return;
    }

    console.log('[StreamingService] Initializing WebSocket connection...');

    this.wsClient = new WSClient({
      apiKey: keys.apiKey,
      userKey: keys.userKey,
      onStateChange: (state) => {
        console.log('[StreamingService] Connection state:', state);
        this.connectionState = state;
        this.notifySubscribers();
      },
      onAuthStateChange: (state, error) => {
        console.log('[StreamingService] Auth state:', state, error || '');
        this.authState = state;
        this.notifySubscribers();
      },
      onMessage: (message) => {
        console.log('[StreamingService] Message received:', message.topic);
      },
      onError: (error) => {
        console.error('[StreamingService] Error:', error);
      },
    });

    // Wire up quote updates to the quotes store
    this.quoteUnsubscribe = this.wsClient.onQuoteUpdate((payload: QuoteUpdatePayload) => {
      console.log('[StreamingService] Quote update:', payload);
      const rawPayload = payload as QuoteUpdatePayload & { InstrumentId?: number };
      const instrumentId = payload.instrumentId ?? rawPayload.InstrumentId;
      if (instrumentId) {
        quotesStore.updateQuote(instrumentId, payload);
      }
    });

    this.wsClient.connect();

    // Subscribe to general quotes
    this.wsClient.subscribeQuotes();
  }

  disconnect(): void {
    if (this.quoteUnsubscribe) {
      this.quoteUnsubscribe();
      this.quoteUnsubscribe = null;
    }

    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }

    this.connectionState = 'disconnected';
    this.authState = 'unauthenticated';
    this.notifySubscribers();
  }

  subscribeToInstrument(instrumentId: number): void {
    console.log(`[StreamingService] subscribeToInstrument(${instrumentId}) - connected: ${this.wsClient?.isConnected}`);
    if (this.wsClient?.isConnected) {
      this.wsClient.subscribeQuotes(instrumentId);
    } else {
      console.warn(`[StreamingService] Cannot subscribe to ${instrumentId} - not connected`);
    }
  }

  unsubscribeFromInstrument(instrumentId: number): void {
    console.log(`[StreamingService] unsubscribeFromInstrument(${instrumentId})`);
    if (this.wsClient?.isConnected) {
      this.wsClient.unsubscribe(`quotes.${instrumentId}`);
    }
  }

  subscribe(callback: StreamingStateCallback): () => void {
    this.subscribers.add(callback);
    // Immediately notify with current state
    callback({
      connectionState: this.connectionState,
      authState: this.authState,
    });
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const state = {
      connectionState: this.connectionState,
      authState: this.authState,
    };
    this.subscribers.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('[StreamingService] Subscriber error:', error);
      }
    });
  }
}

export const streamingService = new StreamingService();
