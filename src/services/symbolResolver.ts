// Symbol Resolution Service
// Maps ticker symbols to eToro instrument IDs with caching and fuzzy matching

import { ENDPOINTS } from '../api/contracts/endpoints';
import { Instrument, InstrumentType } from '../api/contracts/etoro-api.types';
import { getDefaultAdapter } from '../api/restAdapter';

// Import pre-cached symbol universe for faster lookups
import symbolUniverseData from '../data/symbolUniverse.json';

interface CachedInstrument {
  id: number;
  sym: string;
  name: string;
  type: string;
  exchange: string;
}

export interface ResolvedSymbol {
  instrumentId: number;
  symbol: string;
  name: string;
  displayName: string;
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

  // Headers storage for future API authentication
  // private _headers: Record<string, string> = {};
  private staticCacheLoaded = false;

  constructor() {
    // Pre-load the static symbol universe cache on initialization
    this.loadStaticCache();
  }

  private loadStaticCache(): void {
    if (this.staticCacheLoaded) return;
    
    try {
      const data = symbolUniverseData as CachedInstrument[];
      console.log(`[SymbolResolver] Loading ${data.length} instruments from static cache`);
      
      for (const item of data) {
        const instrument: Instrument = {
          instrumentId: item.id,
          symbol: item.sym,
          displayName: item.name,
          type: item.type as InstrumentType,
          exchange: item.exchange,
          isActive: true,
        };
        this.cache.byId.set(item.id, instrument);
        this.cache.bySymbol.set(item.sym.toUpperCase(), instrument);
        this.cache.allInstruments.push(instrument);
      }
      
      this.cache.lastFetched = Date.now();
      this.staticCacheLoaded = true;
      console.log(`[SymbolResolver] Static cache loaded: ${this.cache.allInstruments.length} instruments`);
    } catch (err) {
      console.warn('[SymbolResolver] Failed to load static cache:', err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setHeaders(_headers: Record<string, string>): void {
    // Reserved for future API authentication
  }

  private isCacheValid(): boolean {
    return this.staticCacheLoaded || (Date.now() - this.cache.lastFetched < CACHE_TTL_MS && this.cache.allInstruments.length > 0);
  }

  private async fetchInstruments(): Promise<Instrument[]> {
    try {
      // Use the restAdapter which handles API keys automatically
      const adapter = getDefaultAdapter();
      const data = await adapter.get<Record<string, unknown> | Record<string, unknown>[]>(
        ENDPOINTS.MARKET_DATA_SEARCH
      );
      
      console.log('[SymbolResolver] Raw API response sample:', Array.isArray(data) ? (data as Record<string, unknown>[]).slice(0, 2) : Object.keys(data as Record<string, unknown>));
      
      // API returns paginated response with 'items' key, or may return array directly
      const rawData = data as Record<string, unknown>;
      const rawItems = Array.isArray(data) 
        ? data as Record<string, unknown>[]
        : (rawData.items || rawData.Items || rawData.instruments || rawData.Instruments || []) as Record<string, unknown>[];
      
      // Map API response fields to our Instrument interface (handle multiple field name formats)
      const instruments = rawItems.map((item: Record<string, unknown>) => ({
        instrumentId: (item.instrumentId ?? item.InstrumentID ?? item.instrumentID ?? item.InstrumentId ?? 0) as number,
        symbol: String(item.internalSymbolFull ?? item.InternalSymbolFull ?? item.symbol ?? item.Symbol ?? ''),
        displayName: String(item.instrumentDisplayName ?? item.InstrumentDisplayName ?? item.displayName ?? item.DisplayName ?? item.name ?? item.Name ?? ''),
        type: (item.instrumentTypeId ?? item.InstrumentTypeId ?? item.type ?? 'stock') as InstrumentType,
        exchange: String(item.exchangeId ?? item.ExchangeId ?? item.exchange ?? ''),
        isActive: item.isActive !== false && item.IsActive !== false,
      }));
      
      console.log('[SymbolResolver] Parsed instruments count:', instruments.length);
      if (instruments.length > 0) {
        console.log('[SymbolResolver] Sample instrument:', instruments[0]);
      }
      
      return instruments;
    } catch (error) {
      console.error('[SymbolResolver] Failed to fetch instruments:', error);
      throw error;
    }
  }

  async searchBySymbol(symbol: string): Promise<Instrument | null> {
    try {
      const adapter = getDefaultAdapter();
      const data = await adapter.get<Record<string, unknown> | Record<string, unknown>[]>(
        `${ENDPOINTS.MARKET_DATA_SEARCH}?internalSymbolFull=${encodeURIComponent(symbol.toUpperCase())}`
      );
      
      // API returns paginated response with 'items' key, or may return array directly
      const rawData = data as Record<string, unknown>;
      const items = Array.isArray(data) 
        ? data as Record<string, unknown>[]
        : (rawData.items || rawData.Items || rawData.instruments || rawData.Instruments || []) as Record<string, unknown>[];
      
      const upperSymbol = symbol.toUpperCase();
      const match = items.find((item: Record<string, unknown>) => {
        const itemSymbol = String(item.internalSymbolFull ?? item.InternalSymbolFull ?? item.symbol ?? item.Symbol ?? '');
        return itemSymbol.toUpperCase() === upperSymbol;
      });
      
      if (match) {
        return {
          instrumentId: (match.instrumentId ?? match.InstrumentID ?? match.instrumentID ?? match.InstrumentId ?? 0) as number,
          symbol: String(match.internalSymbolFull ?? match.InternalSymbolFull ?? match.symbol ?? match.Symbol ?? ''),
          displayName: String(match.instrumentDisplayName ?? match.InstrumentDisplayName ?? match.displayName ?? match.DisplayName ?? match.name ?? match.Name ?? ''),
          type: (match.instrumentTypeId ?? match.InstrumentTypeId ?? match.type ?? 'stock') as string,
          exchange: String(match.exchangeId ?? match.ExchangeId ?? match.exchange ?? ''),
          isActive: true,
        } as Instrument;
      }
      
      console.log(`[SymbolResolver] No exact match for ${symbol} in ${items.length} items`);
    } catch (e) {
      console.error('[SymbolResolver] Symbol search failed:', e);
    }
    return null;
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
      displayName: instrument.displayName,
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

    // Check cache first
    const instrument = this.cache.byId.get(instrumentId);
    if (instrument) {
      return this.instrumentToResolved(instrument);
    }

    // If not in cache, try direct API lookup
    try {
      const adapter = getDefaultAdapter();
      const data = await adapter.get<Record<string, unknown>>(
        `${ENDPOINTS.MARKET_DATA_SEARCH}?instrumentIds=${instrumentId}`
      );
      
      const rawData = data as Record<string, unknown>;
      const items = (rawData.items || rawData.Items || []) as Record<string, unknown>[];
      
      if (items.length > 0) {
        const item = items[0];
        const resolved: ResolvedSymbol = {
          instrumentId: (item.internalInstrumentId ?? item.InternalInstrumentId ?? item.instrumentId ?? item.InstrumentId ?? instrumentId) as number,
          symbol: String(item.internalSymbolFull ?? item.InternalSymbolFull ?? item.symbol ?? item.Symbol ?? ''),
          name: String(item.internalInstrumentDisplayName ?? item.InternalInstrumentDisplayName ?? item.instrumentDisplayName ?? item.InstrumentDisplayName ?? item.displayName ?? item.DisplayName ?? ''),
          displayName: String(item.internalInstrumentDisplayName ?? item.InternalInstrumentDisplayName ?? item.instrumentDisplayName ?? item.InstrumentDisplayName ?? item.displayName ?? item.DisplayName ?? ''),
          type: (item.instrumentTypeId ?? item.InstrumentTypeId ?? 'stock') as InstrumentType,
          exchange: String(item.internalExchangeName ?? item.InternalExchangeName ?? item.exchangeId ?? ''),
        };
        
        // Add to cache
        this.cache.byId.set(instrumentId, {
          instrumentId: resolved.instrumentId,
          symbol: resolved.symbol,
          displayName: resolved.displayName,
          type: resolved.type,
          exchange: resolved.exchange,
          isActive: true,
        });
        
        return resolved;
      }
    } catch (e) {
      console.warn(`[SymbolResolver] Failed to lookup instrument ${instrumentId}:`, e);
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
