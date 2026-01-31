// Activity Store - tracks trade executions and important events

export type ActivityType = 'trade_open' | 'trade_close' | 'order_rejected' | 'connection' | 'error';
export type ActivityMode = 'demo' | 'real';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  mode: ActivityMode;
  message: string;
  details?: string;
  symbol?: string;
  amount?: number;
  profit?: number;
  timestamp: string;
  read: boolean;
}

type ActivityCallback = (activities: ActivityItem[]) => void;

class ActivityStore {
  private activities: ActivityItem[] = [];
  private subscribers: Set<ActivityCallback> = new Set();
  private maxItems = 100;

  getActivities(): ActivityItem[] {
    return [...this.activities];
  }

  getUnreadCount(): number {
    return this.activities.filter(a => !a.read).length;
  }

  addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp' | 'read'>): void {
    const newActivity: ActivityItem = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.activities = [newActivity, ...this.activities].slice(0, this.maxItems);
    this.notifySubscribers();
    
    console.log(`[ActivityStore] ${activity.mode.toUpperCase()} ${activity.type}: ${activity.message}`);
  }

  addTradeOpen(mode: ActivityMode, symbol: string, amount: number, side: 'buy' | 'sell'): void {
    this.addActivity({
      type: 'trade_open',
      mode,
      message: `${side.toUpperCase()} ${symbol} for $${amount.toFixed(2)}`,
      symbol,
      amount,
    });
  }

  addTradeClose(mode: ActivityMode, symbol: string, profit: number): void {
    const profitStr = profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`;
    this.addActivity({
      type: 'trade_close',
      mode,
      message: `Closed ${symbol} (${profitStr})`,
      symbol,
      profit,
    });
  }

  addOrderRejected(mode: ActivityMode, symbol: string, reason: string): void {
    this.addActivity({
      type: 'order_rejected',
      mode,
      message: `Order rejected: ${symbol}`,
      details: reason,
      symbol,
    });
  }

  addError(mode: ActivityMode, message: string, details?: string): void {
    this.addActivity({
      type: 'error',
      mode,
      message,
      details,
    });
  }

  markAsRead(id: string): void {
    const activity = this.activities.find(a => a.id === id);
    if (activity && !activity.read) {
      activity.read = true;
      this.notifySubscribers();
    }
  }

  markAllAsRead(): void {
    let changed = false;
    this.activities.forEach(a => {
      if (!a.read) {
        a.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.notifySubscribers();
    }
  }

  clearAll(): void {
    this.activities = [];
    this.notifySubscribers();
  }

  subscribe(callback: ActivityCallback): () => void {
    this.subscribers.add(callback);
    callback(this.getActivities());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const activities = this.getActivities();
    this.subscribers.forEach(callback => {
      try {
        callback(activities);
      } catch (err) {
        console.error('[ActivityStore] Subscriber error:', err);
      }
    });
  }
}

export const activityStore = new ActivityStore();
