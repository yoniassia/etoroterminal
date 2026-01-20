import type { OrderStatus, OrderSide, OrderType, OrderUpdatePayload } from '../api/contracts/etoro-api.types';

export interface StoredOrder {
  orderId: string;
  instrumentId: number;
  symbol: string;
  displayName: string;
  side: OrderSide;
  orderType: OrderType;
  amount: number;
  leverage?: number;
  limitRate?: number;
  stopLossRate?: number;
  takeProfitRate?: number;
  status: OrderStatus;
  executedRate?: number;
  executedAt?: string;
  createdAt: string;
  updatedAt: string;
  isOptimistic?: boolean;
}

export interface OptimisticOrderParams {
  instrumentId: number;
  symbol: string;
  displayName: string;
  side: OrderSide;
  orderType: OrderType;
  amount: number;
  leverage?: number;
  stopLossRate?: number;
  takeProfitRate?: number;
}

export type OrderUpdateCallback = (order: StoredOrder) => void;
export type OrdersChangeCallback = (orders: StoredOrder[]) => void;

const OPTIMISTIC_TIMEOUT_MS = 30000;

class OrdersStore {
  private orders: Map<string, StoredOrder> = new Map();
  private subscribers: Map<string, Set<OrderUpdateCallback>> = new Map();
  private globalSubscribers: Set<OrdersChangeCallback> = new Set();
  private optimisticTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  addOrder(order: StoredOrder): void {
    this.orders.set(order.orderId, order);
    this.notifyOrderSubscribers(order.orderId, order);
    this.notifyGlobalSubscribers();
  }

  addOptimisticOrder(params: OptimisticOrderParams): string {
    const tempOrderId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const optimisticOrder: StoredOrder = {
      orderId: tempOrderId,
      instrumentId: params.instrumentId,
      symbol: params.symbol,
      displayName: params.displayName,
      side: params.side,
      orderType: params.orderType,
      amount: params.amount,
      leverage: params.leverage,
      stopLossRate: params.stopLossRate,
      takeProfitRate: params.takeProfitRate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      isOptimistic: true,
    };

    this.orders.set(tempOrderId, optimisticOrder);
    this.notifyOrderSubscribers(tempOrderId, optimisticOrder);
    this.notifyGlobalSubscribers();

    const timeout = setTimeout(() => {
      this.markOrderAsUnknown(tempOrderId);
    }, OPTIMISTIC_TIMEOUT_MS);
    this.optimisticTimeouts.set(tempOrderId, timeout);

    return tempOrderId;
  }

  reconcileOptimisticOrder(
    tempOrderId: string,
    realOrderId: string,
    update: Partial<StoredOrder>
  ): void {
    const existing = this.orders.get(tempOrderId);
    if (!existing) {
      return;
    }

    const timeout = this.optimisticTimeouts.get(tempOrderId);
    if (timeout) {
      clearTimeout(timeout);
      this.optimisticTimeouts.delete(tempOrderId);
    }

    this.orders.delete(tempOrderId);
    this.subscribers.delete(tempOrderId);

    const reconciledOrder: StoredOrder = {
      ...existing,
      orderId: realOrderId,
      status: update.status ?? existing.status,
      executedRate: update.executedRate,
      executedAt: update.executedAt,
      updatedAt: new Date().toISOString(),
      isOptimistic: false,
    };

    this.orders.set(realOrderId, reconciledOrder);
    this.notifyOrderSubscribers(realOrderId, reconciledOrder);
    this.notifyGlobalSubscribers();
  }

  private markOrderAsUnknown(orderId: string): void {
    const existing = this.orders.get(orderId);
    if (!existing || !existing.isOptimistic) {
      return;
    }

    this.optimisticTimeouts.delete(orderId);

    const unknownOrder: StoredOrder = {
      ...existing,
      status: 'pending',
      updatedAt: new Date().toISOString(),
      isOptimistic: true,
    };

    (unknownOrder as StoredOrder & { isUnknown?: boolean }).isUnknown = true;

    this.orders.set(orderId, unknownOrder);
    this.notifyOrderSubscribers(orderId, unknownOrder);
    this.notifyGlobalSubscribers();
  }

  updateOrder(orderId: string, update: Partial<StoredOrder> | OrderUpdatePayload): void {
    const existing = this.orders.get(orderId);
    if (!existing) {
      return;
    }

    const timeout = this.optimisticTimeouts.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      this.optimisticTimeouts.delete(orderId);
    }

    const updatedOrder: StoredOrder = {
      ...existing,
      status: 'status' in update && update.status !== undefined ? update.status : existing.status,
      executedRate: 'executedRate' in update ? update.executedRate : existing.executedRate,
      executedAt: 'executedAt' in update ? update.executedAt : existing.executedAt,
      updatedAt: new Date().toISOString(),
      isOptimistic: false,
    };

    this.orders.set(orderId, updatedOrder);
    this.notifyOrderSubscribers(orderId, updatedOrder);
    this.notifyGlobalSubscribers();
  }

  getOrder(orderId: string): StoredOrder | undefined {
    return this.orders.get(orderId);
  }

  getAllOrders(): StoredOrder[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrdersByStatus(status: OrderStatus): StoredOrder[] {
    return this.getAllOrders().filter((order) => order.status === status);
  }

  getOrdersByInstrument(instrumentId: number): StoredOrder[] {
    return this.getAllOrders().filter((order) => order.instrumentId === instrumentId);
  }

  subscribeToOrder(orderId: string, callback: OrderUpdateCallback): () => void {
    let callbacks = this.subscribers.get(orderId);
    if (!callbacks) {
      callbacks = new Set();
      this.subscribers.set(orderId, callbacks);
    }
    callbacks.add(callback);

    return () => {
      callbacks?.delete(callback);
      if (callbacks?.size === 0) {
        this.subscribers.delete(orderId);
      }
    };
  }

  subscribeToChanges(callback: OrdersChangeCallback): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  private notifyOrderSubscribers(orderId: string, order: StoredOrder): void {
    const callbacks = this.subscribers.get(orderId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(order);
        } catch (error) {
          console.error(`[OrdersStore] Subscriber error for order ${orderId}:`, error);
        }
      });
    }
  }

  private notifyGlobalSubscribers(): void {
    const allOrders = this.getAllOrders();
    this.globalSubscribers.forEach((callback) => {
      try {
        callback(allOrders);
      } catch (error) {
        console.error('[OrdersStore] Global subscriber error:', error);
      }
    });
  }

  clear(): void {
    this.orders.clear();
    this.notifyGlobalSubscribers();
  }
}

export const ordersStore = new OrdersStore();
