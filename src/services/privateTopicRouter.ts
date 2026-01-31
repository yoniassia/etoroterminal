// Private topic router for position, order, and portfolio event routing

import { WSClient, AuthState } from './wsClient';
import { WSSubscriptionManager } from './wsSubscriptionManager';
import { WS_TOPICS } from '../api/contracts/endpoints';
import type {
  PositionUpdatePayload,
  OrderUpdatePayload,
} from '../api/contracts/etoro-api.types';

export interface PortfolioUpdatePayload {
  totalValue: number;
  equity: number;
  profit: number;
  profitPercentage: number;
}

export interface FillPayload {
  orderId: string;
  positionId: number;
  executedRate: number;
  executedAt: string;
  side: 'buy' | 'sell';
  amount: number;
}

export type PositionHandler = (payload: PositionUpdatePayload) => void;
export type OrderHandler = (payload: OrderUpdatePayload) => void;
export type PortfolioHandler = (payload: PortfolioUpdatePayload) => void;
export type FillHandler = (payload: FillPayload) => void;

export interface PrivateTopicRouterConfig {
  wsClient: WSClient;
  subscriptionManager?: WSSubscriptionManager;
  autoSubscribe?: boolean;
}

export class PrivateTopicRouter {
  private readonly wsClient: WSClient;
  private readonly subscriptionManager?: WSSubscriptionManager;
  private readonly autoSubscribe: boolean;

  private readonly positionHandlers: Set<PositionHandler> = new Set();
  private readonly orderHandlers: Set<OrderHandler> = new Set();
  private readonly portfolioHandlers: Set<PortfolioHandler> = new Set();
  private readonly fillHandlers: Set<FillHandler> = new Set();

  private unsubscribeAuthHandler: (() => void) | null = null;
  private unsubscribeMessageHandlers: (() => void)[] = [];
  private isSubscribed = false;

  constructor(config: PrivateTopicRouterConfig) {
    this.wsClient = config.wsClient;
    this.subscriptionManager = config.subscriptionManager;
    this.autoSubscribe = config.autoSubscribe ?? true;

    this.setupAuthListener();
    this.setupMessageHandlers();
  }

  subscribeToPrivateTopics(): void {
    if (this.isSubscribed) {
      this.log('Already subscribed to private topics');
      return;
    }

    if (!this.wsClient.isAuthenticated) {
      this.log('Not authenticated, queuing private subscriptions');
    }

    const topics = [WS_TOPICS.POSITIONS, WS_TOPICS.ORDERS, WS_TOPICS.PORTFOLIO];

    if (this.subscriptionManager) {
      this.subscriptionManager.subscribe(topics);
    } else {
      topics.forEach((topic) => this.wsClient.subscribe(topic));
    }

    this.isSubscribed = true;
    this.log('Subscribed to private topics');
  }

  unsubscribeFromPrivateTopics(): void {
    if (!this.isSubscribed) {
      this.log('Not subscribed to private topics');
      return;
    }

    const topics = [WS_TOPICS.POSITIONS, WS_TOPICS.ORDERS, WS_TOPICS.PORTFOLIO];

    if (this.subscriptionManager) {
      this.subscriptionManager.unsubscribe(topics);
    } else {
      topics.forEach((topic) => this.wsClient.unsubscribe(topic));
    }

    this.isSubscribed = false;
    this.log('Unsubscribed from private topics');
  }

  subscribeToPosition(positionId: number): void {
    const topic = WS_TOPICS.POSITION(positionId);
    if (this.subscriptionManager) {
      this.subscriptionManager.subscribe(topic);
    } else {
      this.wsClient.subscribe(topic);
    }
  }

  unsubscribeFromPosition(positionId: number): void {
    const topic = WS_TOPICS.POSITION(positionId);
    if (this.subscriptionManager) {
      this.subscriptionManager.unsubscribe(topic);
    } else {
      this.wsClient.unsubscribe(topic);
    }
  }

  subscribeToOrder(orderId: string): void {
    const topic = WS_TOPICS.ORDER(orderId);
    if (this.subscriptionManager) {
      this.subscriptionManager.subscribe(topic);
    } else {
      this.wsClient.subscribe(topic);
    }
  }

  unsubscribeFromOrder(orderId: string): void {
    const topic = WS_TOPICS.ORDER(orderId);
    if (this.subscriptionManager) {
      this.subscriptionManager.unsubscribe(topic);
    } else {
      this.wsClient.unsubscribe(topic);
    }
  }

  onPositionUpdate(handler: PositionHandler): () => void {
    this.positionHandlers.add(handler);
    return () => {
      this.positionHandlers.delete(handler);
    };
  }

  onOrderUpdate(handler: OrderHandler): () => void {
    this.orderHandlers.add(handler);
    return () => {
      this.orderHandlers.delete(handler);
    };
  }

  onPortfolioUpdate(handler: PortfolioHandler): () => void {
    this.portfolioHandlers.add(handler);
    return () => {
      this.portfolioHandlers.delete(handler);
    };
  }

  onFill(handler: FillHandler): () => void {
    this.fillHandlers.add(handler);
    return () => {
      this.fillHandlers.delete(handler);
    };
  }

  get isSubscribedToPrivateTopics(): boolean {
    return this.isSubscribed;
  }

  dispose(): void {
    this.unsubscribeFromPrivateTopics();

    if (this.unsubscribeAuthHandler) {
      this.unsubscribeAuthHandler();
      this.unsubscribeAuthHandler = null;
    }

    this.unsubscribeMessageHandlers.forEach((unsub) => unsub());
    this.unsubscribeMessageHandlers = [];

    this.positionHandlers.clear();
    this.orderHandlers.clear();
    this.portfolioHandlers.clear();
    this.fillHandlers.clear();

    this.log('Disposed');
  }

  private setupAuthListener(): void {
    const originalOnAuthStateChange = (
      this.wsClient as unknown as {
        config: { onAuthStateChange?: (state: AuthState, error?: string) => void };
      }
    ).config?.onAuthStateChange;

    const wrappedHandler = (state: AuthState, error?: string): void => {
      this.handleAuthStateChange(state);
      originalOnAuthStateChange?.(state, error);
    };

    (
      this.wsClient as unknown as {
        config: { onAuthStateChange?: (state: AuthState, error?: string) => void };
      }
    ).config.onAuthStateChange = wrappedHandler;

    this.unsubscribeAuthHandler = () => {
      (
        this.wsClient as unknown as {
          config: { onAuthStateChange?: (state: AuthState, error?: string) => void };
        }
      ).config.onAuthStateChange = originalOnAuthStateChange;
    };
  }

  private handleAuthStateChange(state: AuthState): void {
    if (state === 'authenticated' && this.autoSubscribe) {
      this.log('Authenticated, auto-subscribing to private topics');
      this.subscribeToPrivateTopics();
    } else if (state === 'unauthenticated' || state === 'failed') {
      this.isSubscribed = false;
    }
  }

  private setupMessageHandlers(): void {
    const unsubPosition = this.wsClient.onPositionUpdate((payload) => {
      this.routePositionUpdate(payload);
    });

    const unsubOrder = this.wsClient.onOrderUpdate((payload) => {
      this.routeOrderUpdate(payload);
    });

    this.unsubscribeMessageHandlers.push(unsubPosition, unsubOrder);
  }

  private routePositionUpdate(payload: PositionUpdatePayload): void {
    this.log(`Routing position update: positionId=${payload.positionId}`);
    this.positionHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        this.log('Position handler error', error);
      }
    });
  }

  private routeOrderUpdate(payload: OrderUpdatePayload): void {
    this.log(`Routing order update: orderId=${payload.orderId}, status=${payload.status}`);
    this.orderHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        this.log('Order handler error', error);
      }
    });

    if (payload.status === 'executed' && payload.executedRate && payload.executedAt) {
      this.routeFill(payload);
    }
  }

  private routeFill(orderPayload: OrderUpdatePayload): void {
    const fillPayload: FillPayload = {
      orderId: orderPayload.orderId,
      positionId: 0,
      executedRate: orderPayload.executedRate!,
      executedAt: orderPayload.executedAt!,
      side: 'buy',
      amount: 0,
    };

    this.log(`Routing fill: orderId=${fillPayload.orderId}`);
    this.fillHandlers.forEach((handler) => {
      try {
        handler(fillPayload);
      } catch (error) {
        this.log('Fill handler error', error);
      }
    });
  }

  private log(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[PrivateTopicRouter ${timestamp}]`;
    if (data !== undefined) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
}

export function createPrivateTopicRouter(
  wsClient: WSClient,
  subscriptionManager?: WSSubscriptionManager,
  options?: { autoSubscribe?: boolean }
): PrivateTopicRouter {
  return new PrivateTopicRouter({
    wsClient,
    subscriptionManager,
    autoSubscribe: options?.autoSubscribe,
  });
}
