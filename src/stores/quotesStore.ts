import type { Quote, QuoteUpdatePayload } from '../api/contracts/etoro-api.types';

export interface StoredQuote {
  instrumentId: number;
  bid: number;
  ask: number;
  lastPrice: number;
  change?: number;
  changePercent?: number;
  timestamp: string;
  receivedAt: number;
}

export type QuoteUpdateCallback = (quote: StoredQuote) => void;

const STALENESS_THRESHOLD_MS = 10_000;

interface RawQuotePayload {
  instrumentId?: number;
  InstrumentId?: number;
  bid?: number;
  Bid?: number;
  ask?: number;
  Ask?: number;
  lastPrice?: number;
  LastPrice?: number;
  change?: number;
  Change?: number;
  changePercent?: number;
  ChangePercent?: number;
  timestamp?: string;
  Timestamp?: string;
}

function normalizeQuotePayload(raw: RawQuotePayload): Partial<QuoteUpdatePayload> & { timestamp?: string } {
  return {
    instrumentId: raw.instrumentId ?? raw.InstrumentId,
    bid: raw.bid ?? raw.Bid,
    ask: raw.ask ?? raw.Ask,
    lastPrice: raw.lastPrice ?? raw.LastPrice,
    change: raw.change ?? raw.Change,
    changePercent: raw.changePercent ?? raw.ChangePercent,
    timestamp: raw.timestamp ?? raw.Timestamp,
  };
}

class QuotesStore {
  private quotes: Map<number, StoredQuote> = new Map();
  private subscribers: Map<number, Set<QuoteUpdateCallback>> = new Map();

  updateQuote(instrumentId: number, rawQuote: Partial<Quote> | QuoteUpdatePayload | RawQuotePayload): void {
    const now = Date.now();
    const existing = this.quotes.get(instrumentId);
    const quote = normalizeQuotePayload(rawQuote as RawQuotePayload);

    const storedQuote: StoredQuote = {
      instrumentId,
      bid: quote.bid ?? existing?.bid ?? 0,
      ask: quote.ask ?? existing?.ask ?? 0,
      lastPrice: quote.lastPrice ?? existing?.lastPrice ?? 0,
      change: quote.change ?? existing?.change,
      changePercent: quote.changePercent ?? existing?.changePercent,
      timestamp: quote.timestamp ?? new Date().toISOString(),
      receivedAt: now,
    };

    console.log(`[QuotesStore] updateQuote(${instrumentId}):`, storedQuote);
    this.quotes.set(instrumentId, storedQuote);
    this.notifySubscribers(instrumentId, storedQuote);
  }

  getQuote(instrumentId: number): StoredQuote | undefined {
    return this.quotes.get(instrumentId);
  }

  isStale(instrumentId: number): boolean {
    const quote = this.quotes.get(instrumentId);
    if (!quote) {
      return true;
    }
    return Date.now() - quote.receivedAt > STALENESS_THRESHOLD_MS;
  }

  subscribe(instrumentId: number, callback: QuoteUpdateCallback): () => void {
    let callbacks = this.subscribers.get(instrumentId);
    if (!callbacks) {
      callbacks = new Set();
      this.subscribers.set(instrumentId, callbacks);
    }
    callbacks.add(callback);

    return () => {
      callbacks?.delete(callback);
      if (callbacks?.size === 0) {
        this.subscribers.delete(instrumentId);
      }
    };
  }

  private notifySubscribers(instrumentId: number, quote: StoredQuote): void {
    const callbacks = this.subscribers.get(instrumentId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(quote);
        } catch (error) {
          console.error(`[QuotesStore] Subscriber error for instrument ${instrumentId}:`, error);
        }
      });
    }
  }

  getAllQuotes(): Map<number, StoredQuote> {
    return new Map(this.quotes);
  }

  getStaleInstruments(): number[] {
    const stale: number[] = [];
    const now = Date.now();
    this.quotes.forEach((quote, instrumentId) => {
      if (now - quote.receivedAt > STALENESS_THRESHOLD_MS) {
        stale.push(instrumentId);
      }
    });
    return stale;
  }

  clear(): void {
    this.quotes.clear();
  }
}

export const quotesStore = new QuotesStore();
