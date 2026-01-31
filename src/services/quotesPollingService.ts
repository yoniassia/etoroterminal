// Quote Polling Service - REST-based fallback for live quotes
// Polls the quotes API periodically when WebSocket is unavailable

import { ENDPOINTS } from '../api/contracts/endpoints';
import { quotesStore } from '../stores/quotesStore';
import { getDefaultAdapter } from '../api/restAdapter';

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const MAX_INSTRUMENTS_PER_REQUEST = 50;

interface MarketDataItem {
  internalInstrumentId?: number;
  InternalInstrumentId?: number;
  instrumentId?: number;
  InstrumentId?: number;
  currentRate?: number;
  CurrentRate?: number;
  dailyPriceChange?: number;
  DailyPriceChange?: number;
  internalClosingPrice?: number;
  InternalClosingPrice?: number;
}

class QuotesPollingService {
  private subscribedInstruments: Set<number> = new Set();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;

  subscribe(instrumentId: number): void {
    this.subscribedInstruments.add(instrumentId);
    console.log(`[QuotesPolling] Subscribed to ${instrumentId}, total: ${this.subscribedInstruments.size}`);
    this.ensurePolling();
  }

  unsubscribe(instrumentId: number): void {
    this.subscribedInstruments.delete(instrumentId);
    console.log(`[QuotesPolling] Unsubscribed from ${instrumentId}, remaining: ${this.subscribedInstruments.size}`);
    if (this.subscribedInstruments.size === 0) {
      this.stopPolling();
    }
  }

  private ensurePolling(): void {
    if (this.pollInterval || this.subscribedInstruments.size === 0) {
      return;
    }

    console.log('[QuotesPolling] Starting polling...');
    this.pollInterval = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    // Do an immediate poll
    this.poll();
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      console.log('[QuotesPolling] Stopping polling');
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async poll(): Promise<void> {
    if (this.isPolling || this.subscribedInstruments.size === 0) {
      return;
    }

    this.isPolling = true;
    const instrumentIds = Array.from(this.subscribedInstruments);

    try {
      // Batch instruments into chunks
      for (let i = 0; i < instrumentIds.length; i += MAX_INSTRUMENTS_PER_REQUEST) {
        const batch = instrumentIds.slice(i, i + MAX_INSTRUMENTS_PER_REQUEST);
        await this.fetchQuotesForBatch(batch);
      }
    } catch (err) {
      console.error('[QuotesPolling] Error polling quotes:', err);
    } finally {
      this.isPolling = false;
    }
  }

  private async fetchQuotesForBatch(instrumentIds: number[]): Promise<void> {
    const adapter = getDefaultAdapter();

    // Use market-data/search with instrumentIds - this returns currentRate, dailyPriceChange, etc.
    const endpoint = `${ENDPOINTS.MARKET_DATA_SEARCH}?instrumentIds=${instrumentIds.join(',')}`;

    try {
      const data = await adapter.get<Record<string, unknown>>(endpoint);
      
      // API returns paginated response with 'items' key
      const items = (data?.items || data?.Items || []) as MarketDataItem[];

      if (items.length > 0) {
        console.log(`[QuotesPolling] Received ${items.length} quotes via market-data`);
        items.forEach((item: MarketDataItem) => {
          const instrumentId = item.internalInstrumentId ?? item.InternalInstrumentId ?? item.instrumentId ?? item.InstrumentId ?? 0;
          if (instrumentId > 0) {
            const quote = {
              instrumentId,
              bid: item.currentRate ?? item.CurrentRate ?? 0,
              ask: item.currentRate ?? item.CurrentRate ?? 0,
              lastPrice: item.currentRate ?? item.CurrentRate ?? 0,
              change: item.dailyPriceChange ?? item.DailyPriceChange ?? 0,
              changePercent: item.dailyPriceChange ?? item.DailyPriceChange ?? 0,
            };
            quotesStore.updateQuote(instrumentId, quote);
          }
        });
        return;
      }
    } catch (err) {
      console.error('[QuotesPolling] Error fetching via market-data:', err);
    }
  }

  getSubscribedCount(): number {
    return this.subscribedInstruments.size;
  }

  clear(): void {
    this.stopPolling();
    this.subscribedInstruments.clear();
  }
}

export const quotesPollingService = new QuotesPollingService();
