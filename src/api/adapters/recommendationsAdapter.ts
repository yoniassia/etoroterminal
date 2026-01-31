// Recommendations Adapter
// Provides operations for fetching market recommendations

import { ENDPOINTS } from '../contracts/endpoints';
import type { Recommendation, RecommendationType } from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';

interface MarketRecommendationsApiResponse {
  ResponseType?: string;
  Recommendations?: number[];
  recommendations?: number[];
}

interface InstrumentInfo {
  instrumentId: number;
  symbol: string;
  displayName: string;
}

export class RecommendationsAdapter {
  private readonly rest: RestAdapter;

  constructor(restAdapter?: RestAdapter) {
    this.rest = restAdapter || getDefaultAdapter();
  }

  async getRecommendations(count: number = 10): Promise<Recommendation[]> {
    const response = await this.rest.get<MarketRecommendationsApiResponse>(ENDPOINTS.RECOMMENDATIONS(count));
    
    const instrumentIds = response.Recommendations || response.recommendations || [];
    
    if (instrumentIds.length === 0) {
      return [];
    }
    
    const instrumentDetails = await this.fetchInstrumentDetails(instrumentIds);
    
    return instrumentIds.map((id: number) => {
      const details = instrumentDetails.get(id);
      return {
        instrumentId: id,
        symbol: details?.symbol || `#${id}`,
        displayName: details?.displayName || `Instrument ${id}`,
        recommendationType: 'buy' as RecommendationType,
      };
    });
  }

  private async fetchInstrumentDetails(instrumentIds: number[]): Promise<Map<number, InstrumentInfo>> {
    const result = new Map<number, InstrumentInfo>();
    
    try {
      const response = await this.rest.get<{ instruments?: Array<Record<string, unknown>> }>(
        ENDPOINTS.MARKET_DATA_SEARCH
      );
      
      const instruments = response.instruments || response || [];
      
      for (const instrument of instruments as Array<Record<string, unknown>>) {
        const id = (instrument.instrumentId || instrument.InstrumentID || instrument.instrumentID) as number;
        if (instrumentIds.includes(id)) {
          result.set(id, {
            instrumentId: id,
            symbol: (instrument.internalSymbolFull || instrument.symbol || instrument.Symbol || `#${id}`) as string,
            displayName: (instrument.instrumentDisplayName || instrument.displayName || instrument.name || `Instrument ${id}`) as string,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch instrument details for recommendations:', err);
    }
    
    return result;
  }
}

export function createRecommendationsAdapter(restAdapter?: RestAdapter): RecommendationsAdapter {
  return new RecommendationsAdapter(restAdapter);
}

let defaultAdapter: RecommendationsAdapter | null = null;

export function getRecommendationsAdapter(): RecommendationsAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new RecommendationsAdapter();
  }
  return defaultAdapter;
}

export function setRecommendationsAdapter(adapter: RecommendationsAdapter): void {
  defaultAdapter = adapter;
}
