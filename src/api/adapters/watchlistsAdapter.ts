// Watchlists CRUD Adapter
// Provides operations for managing user watchlists

import { ENDPOINTS } from '../contracts/endpoints';
import type { Watchlist, WatchlistItem } from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';
import { symbolResolver } from '../../services/symbolResolver';
import { isDemoMode, getDemoWatchlist } from '../../services/demoDataService';

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

// Helper to normalize watchlist item from API response
// API returns: { itemId: number, itemType: "Instrument" | "User", itemRank: number }
function normalizeWatchlistItem(raw: Record<string, unknown>): WatchlistItem | null {
  // Filter out non-instrument items (e.g., Users)
  const itemType = (raw.itemType ?? raw.ItemType ?? 'Instrument') as string;
  if (itemType !== 'Instrument') {
    return null;
  }
  
  // API uses itemId for instrument ID
  const instrumentId = (raw.itemId ?? raw.ItemId ?? raw.instrumentId ?? raw.InstrumentId ?? raw.InstrumentID ?? 0) as number;
  
  return {
    instrumentId,
    symbol: (raw.symbol ?? raw.Symbol ?? '') as string,
    displayName: (raw.displayName ?? raw.DisplayName ?? '') as string,
    order: (raw.itemRank ?? raw.ItemRank ?? raw.order ?? raw.Order ?? 0) as number,
  };
}

// Helper to normalize watchlist from API response (handles PascalCase)
function normalizeWatchlist(raw: Record<string, unknown>): Watchlist {
  const rawItems = (raw.items ?? raw.Items ?? []) as Record<string, unknown>[];
  // Filter out null items (non-instrument items like Users)
  const items = rawItems
    .map(normalizeWatchlistItem)
    .filter((item): item is WatchlistItem => item !== null);
  
  return {
    watchlistId: (raw.watchlistId ?? raw.WatchlistId ?? raw.WatchlistID ?? raw.id ?? raw.Id ?? '') as string,
    name: (raw.name ?? raw.Name ?? '') as string,
    items,
    isDefault: (raw.isDefault ?? raw.IsDefault ?? false) as boolean,
    createdAt: (raw.createdAt ?? raw.CreatedAt) as string | undefined,
    updatedAt: (raw.updatedAt ?? raw.UpdatedAt) as string | undefined,
  };
}

export class WatchlistsAdapter {
  private readonly rest: RestAdapter;

  constructor(restAdapter?: RestAdapter) {
    this.rest = restAdapter || getDefaultAdapter();
  }

  async getWatchlists(): Promise<Watchlist[]> {
    // Return demo data if in demo mode
    if (isDemoMode()) {
      const demoItems = getDemoWatchlist();
      const watchlist: Watchlist = {
        watchlistId: 'demo-watchlist-1',
        name: 'Demo Watchlist',
        isDefault: true,
        items: demoItems.map((item, idx) => ({
          instrumentId: item.instrumentId,
          symbol: item.symbol,
          displayName: item.name,
          order: idx,
        })),
      };
      return [watchlist];
    }
    
    const response = await this.rest.get<Record<string, unknown>>(ENDPOINTS.WATCHLISTS);
    const rawWatchlists = (response.watchlists ?? response.Watchlists ?? []) as Record<string, unknown>[];
    const watchlists = rawWatchlists.map(normalizeWatchlist);
    
    // Enrich items with missing symbols/names from symbolResolver
    for (const watchlist of watchlists) {
      for (let i = 0; i < watchlist.items.length; i++) {
        const item = watchlist.items[i];
        if (!item.symbol || item.symbol === '' || !item.displayName || item.displayName === '') {
          try {
            const resolved = await symbolResolver.getInstrumentById(item.instrumentId);
            if (resolved) {
              watchlist.items[i] = {
                ...item,
                symbol: resolved.symbol || item.symbol,
                displayName: resolved.displayName || item.displayName,
              };
            }
          } catch {
            // Keep original item if resolution fails
          }
        }
      }
    }
    
    return watchlists;
  }

  async getWatchlist(watchlistId: string): Promise<Watchlist> {
    const response = await this.rest.get<Record<string, unknown>>(
      ENDPOINTS.WATCHLIST(watchlistId)
    );
    const rawWatchlist = (response.watchlist ?? response.Watchlist ?? response) as Record<string, unknown>;
    return normalizeWatchlist(rawWatchlist);
  }

  async createWatchlist(name: string): Promise<Watchlist> {
    const request: CreateWatchlistRequest = { name };
    const response = await this.rest.post<Record<string, unknown>>(
      ENDPOINTS.WATCHLISTS,
      request
    );
    const rawWatchlist = (response.watchlist ?? response.Watchlist ?? response) as Record<string, unknown>;
    return normalizeWatchlist(rawWatchlist);
  }

  async deleteWatchlist(watchlistId: string): Promise<boolean> {
    const response = await this.rest.delete<Record<string, unknown>>(
      ENDPOINTS.WATCHLIST(watchlistId)
    );
    return (response.success ?? response.Success ?? true) as boolean;
  }

  async addToWatchlist(watchlistId: string, instrumentId: number): Promise<WatchlistItem> {
    const request: AddWatchlistItemRequest = { instrumentId };
    const response = await this.rest.post<Record<string, unknown>>(
      ENDPOINTS.WATCHLIST_ITEMS(watchlistId),
      request
    );
    const rawItem = (response.item ?? response.Item ?? response) as Record<string, unknown>;
    return normalizeWatchlistItem(rawItem);
  }

  async removeFromWatchlist(watchlistId: string, instrumentId: number): Promise<boolean> {
    const response = await this.rest.delete<Record<string, unknown>>(
      `${ENDPOINTS.WATCHLIST_ITEMS(watchlistId)}/${instrumentId}`
    );
    return (response.success ?? response.Success ?? true) as boolean;
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
