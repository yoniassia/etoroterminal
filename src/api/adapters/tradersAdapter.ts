// Traders Adapter
// Provides operations for searching and discovering traders

import { ENDPOINTS } from '../contracts/endpoints';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';

export type RiskScore = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Trader {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  country?: string;
  gainPercent: number;
  copiers: number;
  riskScore: RiskScore;
  assetsUnderManagement?: number;
  trades?: number;
  profitableTrades?: number;
  isVerified?: boolean;
}

export interface TraderSearchFilters {
  username?: string;
  minGainPercent?: number;
  minCopiers?: number;
  maxRiskScore?: RiskScore;
}

export interface TraderSearchParams extends TraderSearchFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'username' | 'gainPercent' | 'copiers' | 'riskScore';
  sortOrder?: 'asc' | 'desc';
}

export interface TraderSearchResponse {
  traders: Trader[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class TradersAdapter {
  private readonly rest: RestAdapter;

  constructor(restAdapter?: RestAdapter) {
    this.rest = restAdapter || getDefaultAdapter();
  }

  async searchTraders(params: TraderSearchParams = {}): Promise<TraderSearchResponse> {
    const queryParams = new URLSearchParams();

    queryParams.append('period', 'LastYear');
    
    if (params.minGainPercent !== undefined) {
      queryParams.append('gainMin', params.minGainPercent.toString());
    }
    if (params.maxRiskScore !== undefined) {
      queryParams.append('maxDailyRiskScoreMax', params.maxRiskScore.toString());
    }
    if (params.minCopiers !== undefined) {
      queryParams.append('copiersMin', params.minCopiers.toString());
    }
    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params.sortBy) {
      const sortPrefix = params.sortOrder === 'asc' ? '' : '-';
      const sortField = params.sortBy === 'gainPercent' ? 'gain' : params.sortBy;
      queryParams.append('sort', `${sortPrefix}${sortField}`);
    }

    const queryString = queryParams.toString();
    const url = `${ENDPOINTS.TRADERS_SEARCH}?${queryString}`;

    const response = await this.rest.get<{ status?: string; totalRows?: number; items?: Array<Record<string, unknown>> }>(url);
    
    const items = response.items || [];
    const traders: Trader[] = items.map((item) => this.mapApiResponseToTrader(item));
    
    return {
      traders,
      total: response.totalRows || 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      totalPages: Math.ceil((response.totalRows || 0) / (params.pageSize || 10)),
    };
  }

  async getTraderProfile(userId: string): Promise<Trader> {
    const response = await this.rest.get<Record<string, unknown> | Array<Record<string, unknown>>>(ENDPOINTS.TRADER_PROFILE(userId));
    const data = Array.isArray(response) ? response[0] : response;
    if (!data) {
      throw new Error(`Trader not found: ${userId}`);
    }
    return this.mapApiResponseToTrader(data);
  }

  private mapApiResponseToTrader(item: Record<string, unknown>): Trader {
    return {
      userId: String(item.userId || item.customerId || item.cid || ''),
      username: String(item.username || item.userName || ''),
      displayName: String(item.displayName || item.fullName || item.username || ''),
      avatarUrl: item.avatarUrl as string | undefined,
      country: item.country as string | undefined,
      gainPercent: Number(item.gain || item.gainPercent || item.yearlyGain || 0),
      copiers: Number(item.copiers || item.copiersCount || 0),
      riskScore: Math.min(7, Math.max(1, Number(item.riskScore || item.maxDailyRiskScore || 4))) as RiskScore,
      assetsUnderManagement: item.aum as number | undefined,
      trades: item.trades as number | undefined,
      profitableTrades: item.profitableTrades as number | undefined,
      isVerified: Boolean(item.isVerified || item.verified || item.isPopularInvestor),
    };
  }
}

export function createTradersAdapter(restAdapter?: RestAdapter): TradersAdapter {
  return new TradersAdapter(restAdapter);
}

let defaultAdapter: TradersAdapter | null = null;

export function getTradersAdapter(): TradersAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new TradersAdapter();
  }
  return defaultAdapter;
}

export function setTradersAdapter(adapter: TradersAdapter): void {
  defaultAdapter = adapter;
}
