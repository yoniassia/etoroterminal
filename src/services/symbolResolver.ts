// Symbol Resolution Service
// Maps ticker symbols to eToro instrument IDs with caching and fuzzy matching

import { API_BASE_URL, ENDPOINTS } from '../api/contracts/endpoints';
import { Instrument, InstrumentType } from '../api/contracts/etoro-api.types';

export interface ResolvedSymbol {
  instrumentId: number;
  symbol: string;
  name: string;
  type: InstrumentType;
  exchange?: string;
}

export interface SymbolSearchResult extends ResolvedSymbol {
  score: number;
}

interface InstrumentCache {
  byId: Map<number, Instrument>;
  bySymbol: Map<string, Instrument>;
  allInstruments: Instrument[];
  lastFetched: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class SymbolResolver {
  private cache: InstrumentCache = {
    byId: new Map(),
    bySymbol: new Map(),
    allInstruments: [],
    lastFetched: 0,
  };

  private headers: Record<string, string> = {};

  setHeaders(headers: Record<string, string>): void {
    this.headers = headers;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cache.lastFetched < CACHE_TTL_MS && this.cache.allInstruments.length > 0;
  }

  private async fetchInstruments(): Promise<Instrument[]> {
    const url = `${API_BASE_URL}${ENDPOINTS.INSTRUMENTS_LIST}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch instruments: ${response.status}`);
    }

    const data = await response.json();
    return data.instruments || data || [];
  }

  private async ensureCache(): Promise<void> {
    if (this.isCacheValid()) {
      return;
    }

    try {
      const instruments = await this.fetchInstruments();
      this.cache.allInstruments = instruments;
      this.cache.byId.clear();
      this.cache.bySymbol.clear();

      for (const instrument of instruments) {
        this.cache.byId.set(instrument.instrumentId, instrument);
        this.cache.bySymbol.set(instrument.symbol.toUpperCase(), instrument);
      }

      this.cache.lastFetched = Date.now();
    } catch (error) {
      if (this.cache.allInstruments.length > 0) {
        return;
      }
      throw error;
    }
  }

  private instrumentToResolved(instrument: Instrument): ResolvedSymbol {
    return {
      instrumentId: instrument.instrumentId,
      symbol: instrument.symbol,
      name: instrument.displayName,
      type: instrument.type,
      exchange: instrument.exchange,
    };
  }

  private calculateScore(query: string, instrument: Instrument): number {
    const upperQuery = query.toUpperCase();
    const upperSymbol = instrument.symbol.toUpperCase();
    const upperName = instrument.displayName.toUpperCase();

    if (upperSymbol === upperQuery) {
      return 100;
    }

    if (upperSymbol.startsWith(upperQuery)) {
      return 90 - (upperSymbol.length - upperQuery.length);
    }

    if (upperName.toUpperCase().startsWith(upperQuery)) {
      return 70;
    }

    if (upperSymbol.includes(upperQuery)) {
      return 60;
    }

    if (upperName.includes(upperQuery)) {
      return 50;
    }

    const queryWords = upperQuery.split(/\s+/);
    const nameWords = upperName.split(/\s+/);
    const matchedWords = queryWords.filter((qw) => nameWords.some((nw) => nw.startsWith(qw)));
    if (matchedWords.length > 0) {
      return 30 + (matchedWords.length / queryWords.length) * 20;
    }

    return 0;
  }

  async resolveSymbol(query: string): Promise<ResolvedSymbol | null> {
    if (!query || query.trim().length === 0) {
      return null;
    }

    await this.ensureCache();

    const upperQuery = query.trim().toUpperCase();

    const exactMatch = this.cache.bySymbol.get(upperQuery);
    if (exactMatch) {
      return this.instrumentToResolved(exactMatch);
    }

    const results = await this.searchSymbols(query, 1);
    if (results.length > 0 && results[0].score >= 50) {
      return results[0];
    }

    return null;
  }

  async searchSymbols(prefix: string, limit: number = 10): Promise<SymbolSearchResult[]> {
    if (!prefix || prefix.trim().length === 0) {
      return [];
    }

    await this.ensureCache();

    const scored: SymbolSearchResult[] = [];

    for (const instrument of this.cache.allInstruments) {
      if (!instrument.isActive) {
        continue;
      }

      const score = this.calculateScore(prefix.trim(), instrument);
      if (score > 0) {
        scored.push({
          ...this.instrumentToResolved(instrument),
          score,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  async getInstrumentById(instrumentId: number): Promise<ResolvedSymbol | null> {
    await this.ensureCache();

    const instrument = this.cache.byId.get(instrumentId);
    if (instrument) {
      return this.instrumentToResolved(instrument);
    }

    return null;
  }

  clearCache(): void {
    this.cache = {
      byId: new Map(),
      bySymbol: new Map(),
      allInstruments: [],
      lastFetched: 0,
    };
  }

  getCacheStats(): { size: number; lastFetched: Date | null } {
    return {
      size: this.cache.allInstruments.length,
      lastFetched: this.cache.lastFetched > 0 ? new Date(this.cache.lastFetched) : null,
    };
  }
}

export const symbolResolver = new SymbolResolver();
export default symbolResolver;
