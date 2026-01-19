// WebSocket subscription manager for topic subscriptions with batching and reconnect recovery

import { WSClient, ConnectionState } from './wsClient';

export interface SubscriptionOptions {
  batchDelay?: number;
}

export interface SubscriptionManagerConfig {
  wsClient: WSClient;
  batchDelay?: number;
  onSubscriptionChange?: (topics: string[]) => void;
}

export class WSSubscriptionManager {
  private readonly wsClient: WSClient;
  private readonly activeSubscriptions: Set<string> = new Set();
  private readonly pendingSubscribes: Set<string> = new Set();
  private readonly pendingUnsubscribes: Set<string> = new Set();
  private readonly batchDelay: number;
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly onSubscriptionChange?: (topics: string[]) => void;
  private unsubscribeStateHandler: (() => void) | null = null;

  constructor(config: SubscriptionManagerConfig) {
    this.wsClient = config.wsClient;
    this.batchDelay = config.batchDelay ?? 50;
    this.onSubscriptionChange = config.onSubscriptionChange;
    this.setupReconnectHandler();
  }

  subscribe(topics: string | string[]): void {
    const topicList = Array.isArray(topics) ? topics : [topics];

    topicList.forEach((topic) => {
      if (this.activeSubscriptions.has(topic)) {
        this.log(`Already subscribed to ${topic}, skipping`);
        return;
      }

      this.pendingUnsubscribes.delete(topic);
      this.pendingSubscribes.add(topic);
    });

    this.scheduleBatch();
  }

  unsubscribe(topics: string | string[]): void {
    const topicList = Array.isArray(topics) ? topics : [topics];

    topicList.forEach((topic) => {
      if (!this.activeSubscriptions.has(topic) && !this.pendingSubscribes.has(topic)) {
        this.log(`Not subscribed to ${topic}, skipping unsubscribe`);
        return;
      }

      this.pendingSubscribes.delete(topic);
      this.pendingUnsubscribes.add(topic);
    });

    this.scheduleBatch();
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions);
  }

  hasSubscription(topic: string): boolean {
    return this.activeSubscriptions.has(topic);
  }

  get subscriptionCount(): number {
    return this.activeSubscriptions.size;
  }

  clearAllSubscriptions(): void {
    const topics = this.getActiveSubscriptions();
    if (topics.length > 0) {
      this.unsubscribe(topics);
    }
  }

  dispose(): void {
    this.clearBatchTimeout();
    if (this.unsubscribeStateHandler) {
      this.unsubscribeStateHandler();
      this.unsubscribeStateHandler = null;
    }
    this.activeSubscriptions.clear();
    this.pendingSubscribes.clear();
    this.pendingUnsubscribes.clear();
  }

  private setupReconnectHandler(): void {
    let previousState: ConnectionState = this.wsClient.connectionState;

    const stateChangeHandler = (state: ConnectionState): void => {
      if (state === 'connected' && previousState === 'reconnecting') {
        this.log('Reconnected, resubscribing to all topics');
        this.resubscribeAll();
      }
      previousState = state;
    };

    const originalOnStateChange = (this.wsClient as unknown as { config: { onStateChange?: (state: ConnectionState) => void } }).config?.onStateChange;

    const wrappedHandler = (state: ConnectionState): void => {
      stateChangeHandler(state);
      originalOnStateChange?.(state);
    };

    (this.wsClient as unknown as { config: { onStateChange?: (state: ConnectionState) => void } }).config.onStateChange = wrappedHandler;

    this.unsubscribeStateHandler = () => {
      (this.wsClient as unknown as { config: { onStateChange?: (state: ConnectionState) => void } }).config.onStateChange = originalOnStateChange;
    };
  }

  private resubscribeAll(): void {
    const topics = this.getActiveSubscriptions();
    if (topics.length === 0) return;

    this.log(`Resubscribing to ${topics.length} topics`);
    topics.forEach((topic) => {
      this.wsClient.subscribe(topic);
    });
  }

  private scheduleBatch(): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  private processBatch(): void {
    this.clearBatchTimeout();

    const toSubscribe = Array.from(this.pendingSubscribes);
    const toUnsubscribe = Array.from(this.pendingUnsubscribes);

    this.pendingSubscribes.clear();
    this.pendingUnsubscribes.clear();

    if (toUnsubscribe.length > 0) {
      this.log(`Batch unsubscribing from ${toUnsubscribe.length} topics`);
      toUnsubscribe.forEach((topic) => {
        this.wsClient.unsubscribe(topic);
        this.activeSubscriptions.delete(topic);
      });
    }

    if (toSubscribe.length > 0) {
      this.log(`Batch subscribing to ${toSubscribe.length} topics`);
      toSubscribe.forEach((topic) => {
        this.wsClient.subscribe(topic);
        this.activeSubscriptions.add(topic);
      });
    }

    if ((toSubscribe.length > 0 || toUnsubscribe.length > 0) && this.onSubscriptionChange) {
      this.onSubscriptionChange(this.getActiveSubscriptions());
    }
  }

  private clearBatchTimeout(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[WSSubscriptionManager ${timestamp}]`, message);
  }
}

export function createSubscriptionManager(
  wsClient: WSClient,
  options?: SubscriptionOptions
): WSSubscriptionManager {
  return new WSSubscriptionManager({
    wsClient,
    batchDelay: options?.batchDelay,
  });
}
