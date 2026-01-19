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

    if (params.username) {
      queryParams.append('username', params.username);
    }
    if (params.minGainPercent !== undefined) {
      queryParams.append('minGain', params.minGainPercent.toString());
    }
    if (params.minCopiers !== undefined) {
      queryParams.append('minCopiers', params.minCopiers.toString());
    }
    if (params.maxRiskScore !== undefined) {
      queryParams.append('maxRisk', params.maxRiskScore.toString());
    }
    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${ENDPOINTS.TRADERS_SEARCH}?${queryString}`
      : ENDPOINTS.TRADERS_SEARCH;

    return this.rest.get<TraderSearchResponse>(url);
  }

  async getTraderProfile(userId: string): Promise<Trader> {
    return this.rest.get<Trader>(ENDPOINTS.TRADER_PROFILE(userId));
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
