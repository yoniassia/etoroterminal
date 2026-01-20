// Curated Lists Adapter
// Fetches eToro curated investment lists via REST API

import { ENDPOINTS } from '../contracts/endpoints';
import type { CuratedList, CuratedListItem } from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';

export interface CuratedListsAdapterConfig {
  restAdapter?: RestAdapter;
}

// Helper to normalize curated list item from API response (handles PascalCase)
function normalizeCuratedListItem(raw: Record<string, unknown>): CuratedListItem {
  return {
    instrumentId: (raw.instrumentId ?? raw.InstrumentId ?? raw.InstrumentID ?? 0) as number,
    symbol: (raw.symbol ?? raw.Symbol ?? '') as string,
    displayName: (raw.displayName ?? raw.DisplayName ?? raw.symbol ?? raw.Symbol ?? '') as string,
    weight: (raw.weight ?? raw.Weight) as number | undefined,
  };
}

// Helper to normalize curated list from API response (handles PascalCase)
function normalizeCuratedList(raw: Record<string, unknown>): CuratedList {
  const rawItems = (raw.items ?? raw.Items ?? []) as Record<string, unknown>[];
  const items = rawItems.map(normalizeCuratedListItem);
  return {
    listId: (raw.listId ?? raw.ListId ?? raw.ListID ?? raw.id ?? raw.Id ?? '') as string,
    name: (raw.name ?? raw.Name ?? '') as string,
    description: (raw.description ?? raw.Description) as string | undefined,
    category: (raw.category ?? raw.Category) as string | undefined,
    items,
    itemCount: (raw.itemCount ?? raw.ItemCount ?? items.length) as number,
    imageUrl: (raw.imageUrl ?? raw.ImageUrl ?? raw.ImageURL) as string | undefined,
    createdAt: (raw.createdAt ?? raw.CreatedAt) as string | undefined,
    updatedAt: (raw.updatedAt ?? raw.UpdatedAt) as string | undefined,
  };
}

export class CuratedListsAdapter {
  private readonly restAdapter: RestAdapter;

  constructor(config: CuratedListsAdapterConfig = {}) {
    this.restAdapter = config.restAdapter || getDefaultAdapter();
  }

  async getCuratedLists(): Promise<CuratedList[]> {
    const response = await this.restAdapter.get<Record<string, unknown>>(ENDPOINTS.CURATED_LISTS);
    const rawLists = (response.lists ?? response.Lists ?? []) as Record<string, unknown>[];
    return rawLists.map(normalizeCuratedList);
  }
}

export function createCuratedListsAdapter(config: CuratedListsAdapterConfig = {}): CuratedListsAdapter {
  return new CuratedListsAdapter(config);
}

let defaultCuratedListsAdapter: CuratedListsAdapter | null = null;

export function getDefaultCuratedListsAdapter(): CuratedListsAdapter {
  if (!defaultCuratedListsAdapter) {
    defaultCuratedListsAdapter = new CuratedListsAdapter();
  }
  return defaultCuratedListsAdapter;
}
