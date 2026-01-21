// WebSocket client for eToro streaming data with automatic reconnection

import { WEBSOCKET_URL, WS_TOPICS } from '../api/contracts/endpoints';
import type {
  WebSocketMessage,
  QuoteUpdatePayload,
  PositionUpdatePayload,
  OrderUpdatePayload,
} from '../api/contracts/etoro-api.types';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type AuthState = 'unauthenticated' | 'authenticating' | 'authenticated' | 'failed';

export interface WSClientConfig {
  url?: string;
  userKey: string;
  apiKey?: string;
  maxReconnectDelay?: number;
  initialReconnectDelay?: number;
  onStateChange?: (state: ConnectionState) => void;
  onAuthStateChange?: (state: AuthState, error?: string) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event | Error) => void;
}

type MessageHandler<T> = (payload: T) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private authState: AuthState = 'unauthenticated';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly config: Required<Omit<WSClientConfig, 'onStateChange' | 'onAuthStateChange' | 'onMessage' | 'onError'>> &
    Pick<WSClientConfig, 'onStateChange' | 'onAuthStateChange' | 'onMessage' | 'onError'>;

  private subscriptions: Set<string> = new Set();
  private pendingPrivateSubscriptions: Set<string> = new Set();
  private messageHandlers: Map<string, Set<MessageHandler<unknown>>> = new Map();

  constructor(config: WSClientConfig) {
    this.config = {
      url: WEBSOCKET_URL,
      maxReconnectDelay: 30000,
      initialReconnectDelay: 1000,
      ...config,
    };
  }

  get connectionState(): ConnectionState {
    return this.state;
  }

  get isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  get isAuthenticated(): boolean {
    return this.authState === 'authenticated';
  }

  get authenticationState(): AuthState {
    return this.authState;
  }

  connect(): void {
    if (this.state === 'connected' || this.state === 'connecting') {
      this.log('Already connected or connecting');
      return;
    }

    this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
    this.log(`Connecting to ${this.config.url}...`);

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      this.log('Failed to create WebSocket', error);
      this.handleConnectionFailure();
    }
  }

  disconnect(): void {
    this.log('Disconnecting...');
    this.clearReconnectTimeout();
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setState('disconnected');
    this.setAuthState('unauthenticated');
    this.pendingPrivateSubscriptions.clear();
    this.log('Disconnected');
  }

  subscribe(topic: string): void {
    this.subscriptions.add(topic);

    if (this.isConnected) {
      if (this.isPrivateTopic(topic)) {
        if (this.isAuthenticated) {
          this.sendSubscribe(topic);
        } else {
          this.pendingPrivateSubscriptions.add(topic);
          this.log(`Queued private topic ${topic} until authenticated`);
        }
      } else {
        this.sendSubscribe(topic);
      }
    }
  }

  private isPrivateTopic(topic: string): boolean {
    return topic.startsWith('positions') || 
           topic.startsWith('orders') || 
           topic.startsWith('portfolio');
  }

  unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);

    if (this.isConnected) {
      this.sendUnsubscribe(topic);
    }
  }

  subscribeQuotes(instrumentId?: number): void {
    const topic = instrumentId ? WS_TOPICS.QUOTES_INSTRUMENT(instrumentId) : WS_TOPICS.QUOTES;
    this.subscribe(topic);
  }

  subscribePositions(positionId?: number): void {
    const topic = positionId ? WS_TOPICS.POSITION(positionId) : WS_TOPICS.POSITIONS;
    this.subscribe(topic);
  }

  subscribeOrders(orderId?: string): void {
    const topic = orderId ? WS_TOPICS.ORDER(orderId) : WS_TOPICS.ORDERS;
    this.subscribe(topic);
  }

  subscribePortfolio(): void {
    this.subscribe(WS_TOPICS.PORTFOLIO);
  }

  onQuoteUpdate(handler: MessageHandler<QuoteUpdatePayload>): () => void {
    return this.addMessageHandler(WS_TOPICS.QUOTES, handler as MessageHandler<unknown>);
  }

  onPositionUpdate(handler: MessageHandler<PositionUpdatePayload>): () => void {
    return this.addMessageHandler(WS_TOPICS.POSITIONS, handler as MessageHandler<unknown>);
  }

  onOrderUpdate(handler: MessageHandler<OrderUpdatePayload>): () => void {
    return this.addMessageHandler(WS_TOPICS.ORDERS, handler as MessageHandler<unknown>);
  }

  private addMessageHandler(topicPrefix: string, handler: MessageHandler<unknown>): () => void {
    if (!this.messageHandlers.has(topicPrefix)) {
      this.messageHandlers.set(topicPrefix, new Set());
    }
    this.messageHandlers.get(topicPrefix)!.add(handler);

    return () => {
      this.messageHandlers.get(topicPrefix)?.delete(handler);
    };
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('Connected');
      this.reconnectAttempts = 0;
      this.setState('connected');
      this.authenticate();
      this.resubscribeAll();
    };

    this.ws.onclose = (event) => {
      this.log(`Connection closed: code=${event.code}, reason=${event.reason}`);
      this.ws = null;

      if (event.code !== 1000) {
        this.handleConnectionFailure();
      } else {
        this.setState('disconnected');
      }
    };

    this.ws.onerror = (event) => {
      this.log('WebSocket error', event);
      this.config.onError?.(event);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WebSocketMessage;
      this.log(`Message received: topic=${message.topic}, type=${message.type}`);

      this.config.onMessage?.(message);

      if (message.topic === 'auth') {
        this.handleAuthResponse(message);
        return;
      }

      if (message.type === 'data') {
        this.dispatchToHandlers(message.topic, message.payload);
      } else if (message.type === 'error') {
        this.log('Server error', message.payload);
        this.config.onError?.(new Error(JSON.stringify(message.payload)));
      }
    } catch (error) {
      this.log('Failed to parse message', error);
    }
  }

  private handleAuthResponse(message: WebSocketMessage): void {
    const payload = message.payload as { success?: boolean; error?: string };
    
    if (message.type === 'data' && payload.success) {
      this.setAuthState('authenticated');
      this.log('Authentication successful');
      this.subscribePendingPrivateTopics();
    } else {
      const errorMessage = payload.error || 'Authentication failed';
      this.setAuthState('failed', errorMessage);
      this.log('Authentication failed', errorMessage);
      this.pendingPrivateSubscriptions.clear();
    }
  }

  private subscribePendingPrivateTopics(): void {
    this.pendingPrivateSubscriptions.forEach((topic) => {
      this.sendSubscribe(topic);
    });
    this.pendingPrivateSubscriptions.clear();
  }

  private dispatchToHandlers(topic: string, payload: unknown): void {
    for (const [prefix, handlers] of this.messageHandlers) {
      if (topic.startsWith(prefix)) {
        handlers.forEach((handler) => handler(payload));
      }
    }
  }

  private authenticate(): void {
    if (!this.isConnected) return;

    this.setAuthState('authenticating');

    const authMessage: WebSocketMessage = {
      topic: 'auth',
      type: 'subscribe',
      payload: {
        apiKey: this.config.apiKey,
        userKey: this.config.userKey,
      },
      timestamp: new Date().toISOString(),
    };

    this.send(authMessage);
    this.log('Authentication message sent');
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach((topic) => {
      if (this.isPrivateTopic(topic)) {
        this.pendingPrivateSubscriptions.add(topic);
      } else {
        this.sendSubscribe(topic);
      }
    });
  }

  private sendSubscribe(topic: string): void {
    const message: WebSocketMessage = {
      topic,
      type: 'subscribe',
      payload: {},
      timestamp: new Date().toISOString(),
    };
    this.send(message);
    this.log(`Subscribed to ${topic}`);
  }

  private sendUnsubscribe(topic: string): void {
    const message: WebSocketMessage = {
      topic,
      type: 'unsubscribe',
      payload: {},
      timestamp: new Date().toISOString(),
    };
    this.send(message);
    this.log(`Unsubscribed from ${topic}`);
  }

  private send(message: WebSocketMessage): void {
    if (!this.isConnected) {
      this.log('Cannot send - not connected');
      return;
    }
    this.ws!.send(JSON.stringify(message));
  }

  private handleConnectionFailure(): void {
    this.setState('reconnecting');
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimeout();

    const delay = this.calculateReconnectDelay();
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private calculateReconnectDelay(): number {
    const exponentialDelay = this.config.initialReconnectDelay * Math.pow(2, this.reconnectAttempts);
    return Math.min(exponentialDelay, this.config.maxReconnectDelay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.log(`State: ${this.state} -> ${newState}`);
      this.state = newState;
      this.config.onStateChange?.(newState);
    }
  }

  private setAuthState(newState: AuthState, error?: string): void {
    if (this.authState !== newState) {
      this.log(`Auth state: ${this.authState} -> ${newState}`);
      this.authState = newState;
      this.config.onAuthStateChange?.(newState, error);
    }
  }

  private log(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[WSClient ${timestamp}]`;
    if (data !== undefined) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
}

export { WS_TOPICS };
