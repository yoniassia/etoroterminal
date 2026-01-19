// Compare Store
// Manages traders selected for comparison (max 5)

import { Trader } from '../api/adapters/tradersAdapter';

export interface CompareTrader {
  userId: string;
  username: string;
  displayName?: string;
  gainPercent: number;
  maxDrawdown?: number;
  riskScore: number;
  copiers: number;
}

type CompareStoreListener = () => void;

const MAX_COMPARE_TRADERS = 5;

class CompareStore {
  private traders: CompareTrader[] = [];
  private listeners: Set<CompareStoreListener> = new Set();

  subscribe(listener: CompareStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  getTraders(): CompareTrader[] {
    return [...this.traders];
  }

  getCount(): number {
    return this.traders.length;
  }

  isFull(): boolean {
    return this.traders.length >= MAX_COMPARE_TRADERS;
  }

  isInCompare(userId: string): boolean {
    return this.traders.some((t) => t.userId === userId);
  }

  addTrader(trader: CompareTrader): boolean {
    if (this.isFull()) {
      return false;
    }
    if (this.isInCompare(trader.userId)) {
      return false;
    }
    this.traders.push(trader);
    this.notify();
    return true;
  }

  addFromTrader(trader: Trader, maxDrawdown?: number): boolean {
    return this.addTrader({
      userId: trader.userId,
      username: trader.username,
      displayName: trader.displayName,
      gainPercent: trader.gainPercent,
      maxDrawdown,
      riskScore: trader.riskScore,
      copiers: trader.copiers,
    });
  }

  removeTrader(userId: string): void {
    const index = this.traders.findIndex((t) => t.userId === userId);
    if (index !== -1) {
      this.traders.splice(index, 1);
      this.notify();
    }
  }

  clearAll(): void {
    if (this.traders.length > 0) {
      this.traders = [];
      this.notify();
    }
  }
}

export const compareStore = new CompareStore();
