// Watchlists CRUD Adapter
// Provides operations for managing user watchlists

import { ENDPOINTS } from '../contracts/endpoints';
import type { Watchlist, WatchlistItem } from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';

// ============================================================================
// Types
// ============================================================================

export interface WatchlistsResponse {
  watchlists: Watchlist[];
}

export interface CreateWatchlistRequest {
  name: string;
}

export interface CreateWatchlistResponse {
  watchlist: Watchlist;
}

export interface AddWatchlistItemRequest {
  instrumentId: number;
}

export interface AddWatchlistItemResponse {
  item: WatchlistItem;
}

export interface RemoveWatchlistItemResponse {
  success: boolean;
}

export interface DeleteWatchlistResponse {
  success: boolean;
}

// ============================================================================
// Watchlists Adapter Class
// ============================================================================

export class WatchlistsAdapter {
  private readonly rest: RestAdapter;

  constructor(restAdapter?: RestAdapter) {
    this.rest = restAdapter || getDefaultAdapter();
  }

  async getWatchlists(): Promise<Watchlist[]> {
    const response = await this.rest.get<WatchlistsResponse>(ENDPOINTS.WATCHLISTS);
    return response.watchlists;
  }

  async getWatchlist(watchlistId: string): Promise<Watchlist> {
    const response = await this.rest.get<{ watchlist: Watchlist }>(
      ENDPOINTS.WATCHLIST(watchlistId)
    );
    return response.watchlist;
  }

  async createWatchlist(name: string): Promise<Watchlist> {
    const request: CreateWatchlistRequest = { name };
    const response = await this.rest.post<CreateWatchlistResponse>(
      ENDPOINTS.WATCHLISTS,
      request
    );
    return response.watchlist;
  }

  async deleteWatchlist(watchlistId: string): Promise<boolean> {
    const response = await this.rest.delete<DeleteWatchlistResponse>(
      ENDPOINTS.WATCHLIST(watchlistId)
    );
    return response.success;
  }

  async addToWatchlist(watchlistId: string, instrumentId: number): Promise<WatchlistItem> {
    const request: AddWatchlistItemRequest = { instrumentId };
    const response = await this.rest.post<AddWatchlistItemResponse>(
      ENDPOINTS.WATCHLIST_ITEMS(watchlistId),
      request
    );
    return response.item;
  }

  async removeFromWatchlist(watchlistId: string, instrumentId: number): Promise<boolean> {
    const response = await this.rest.delete<RemoveWatchlistItemResponse>(
      `${ENDPOINTS.WATCHLIST_ITEMS(watchlistId)}/${instrumentId}`
    );
    return response.success;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createWatchlistsAdapter(restAdapter?: RestAdapter): WatchlistsAdapter {
  return new WatchlistsAdapter(restAdapter);
}

// ============================================================================
// Default Instance (singleton pattern)
// ============================================================================

let defaultAdapter: WatchlistsAdapter | null = null;

export function getWatchlistsAdapter(): WatchlistsAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new WatchlistsAdapter();
  }
  return defaultAdapter;
}

export function setWatchlistsAdapter(adapter: WatchlistsAdapter): void {
  defaultAdapter = adapter;
}
